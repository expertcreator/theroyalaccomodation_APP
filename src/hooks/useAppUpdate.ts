import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import SpInAppUpdates, { IAUUpdateKind, type AndroidInAppUpdateExtras, type IosPerformCheckResponse } from 'sp-react-native-in-app-updates';
import { getBuildNumber, getVersion } from 'react-native-device-info';
import { compareVersions, majorOf, versionFromCode } from '../utils/version';
import { ASYNC_KEYS, getItemFromAsyncStorage, setItemInAsyncStorage } from '../utils/storage';
import { showToast } from '../utils/ToastNotifier';

/**
 * Tells the guest when a newer version of the app is in the store.
 * No backend: everything comes from Google Play / the App Store.
 *
 * The version number we publish decides how pushy it is:
 *  - First number higher (1.4 → 2.0): FORCED — "Update Required", no "Later".
 *  - Smaller bump (1.4 → 1.5, 1.4 → 1.4.1): OPTIONAL — "Update Now" or "Later".
 *    "Later" hides it for SNOOZE_DAYS for that store version.
 *
 * Where the answer comes from:
 *  - Android: Google Play itself (Play's in-app updates API). Play only reports the
 *    new versionCode, so versionCodes follow major × 10000 + minor × 100 + patch
 *    (1.1.0 = 10100, 2.0.0 = 20000) — see versionFromCode. Only works for apps
 *    installed from Play; elsewhere (debug builds, emulators) it quietly says no.
 *  - iOS: the App Store listing (iTunes lookup, UK store). Says no until the app is live.
 *
 * It checks when the app opens (after the splash) and again when it comes back
 * to the foreground — every time while a forced prompt is showing, otherwise at
 * most once an hour. Every failure is quiet: no toast, just no prompt.
 */

const SNOOZE_DAYS = 3;
const RECHECK_AFTER_MS = 60 * 60 * 1000; // 1 hour
const IOS_COUNTRY = 'gb';                // look the app up in the UK App Store

// Used only if the store check didn't give us a link.
const FALLBACK_STORE_URL = Platform.select({
    android: 'https://play.google.com/store/apps/details?id=com.theroyalaccommodation',
    default: 'https://apps.apple.com/gb/search?term=The%20Royal%20Accommodation',
}) ?? '';

export type UpdatePrompt = {
    force: boolean;
    storeVersion?: string;   // e.g. "1.1" — shown in the message when we know it
} | null;

// One instance of the library, made the first time it's needed.
let updatesLib: SpInAppUpdates | null = null;
const updates = () => (updatesLib ??= new SpInAppUpdates(false));

type StoreResult = {
    available: boolean;
    version?: string;            // the new version, like "1.1" (unknown for an old-style Android versionCode)
    snoozeKey?: string;          // what "Later" remembers (the store's own version / versionCode)
    url?: string;                // iOS: the App Store page
    canUpdateInApp?: boolean;    // Android: Play's full-screen update can run
};

/** Asks Google Play / the App Store whether there's a newer version. Never throws. */
async function checkStore(): Promise<StoreResult> {
    try {
        if (Platform.OS === 'android') {
            // Play reports the new versionCode, so compare it with our own versionCode
            // (the build number), not with the "1.0" version name.
            const res = await updates().checkNeedsUpdate({ curVersion: getBuildNumber() });
            const other = res.other as AndroidInAppUpdateExtras | undefined;
            return {
                available: res.shouldUpdate,
                version: versionFromCode(other?.versionCode),
                snoozeKey: res.storeVersion,
                canUpdateInApp: !!other?.isImmediateUpdateAllowed,
            };
        }
        const res = await updates().checkNeedsUpdate({ country: IOS_COUNTRY });
        const other = res.other as IosPerformCheckResponse | undefined;
        return { available: res.shouldUpdate, version: res.storeVersion, snoozeKey: res.storeVersion, url: other?.trackViewUrl };
    } catch {
        // Not installed from the store, no internet, store unreachable, app not live yet…
        return { available: false };
    }
}

/** Forced when the store's first version number is higher than ours (1.x → 2.0). */
function isMajorUpdate(storeVersion: string | undefined): boolean {
    if (!storeVersion) return false;
    return compareVersions(String(majorOf(storeVersion)), String(majorOf(getVersion()))) > 0;
}

export function useAppUpdate(enabled: boolean) {
    const [prompt, setPromptState] = useState<UpdatePrompt>(null);
    const promptRef = useRef<UpdatePrompt>(null);          // the latest prompt, for the AppState listener
    const storeUrl = useRef<string>(FALLBACK_STORE_URL);    // where "Update Now" goes
    const canUpdateInApp = useRef(false);                   // Android: use Play's own update screen
    const snoozeKey = useRef<string>('');                   // the store version "Later" applies to
    const lastCheckAt = useRef(0);
    const checking = useRef(false);

    const setPrompt = (next: UpdatePrompt) => {
        promptRef.current = next;
        setPromptState(next);
    };

    const check = useCallback(async () => {
        if (checking.current) return;   // one check at a time
        checking.current = true;
        lastCheckAt.current = Date.now();
        try {
            const store = await checkStore();
            storeUrl.current = store.url ?? FALLBACK_STORE_URL;
            canUpdateInApp.current = !!store.canUpdateInApp;

            if (!store.available) {
                // Up to date — or we couldn't tell. Keep a forced prompt that's already
                // showing (e.g. the store was unreachable this time); clear anything else.
                if (!promptRef.current?.force) setPrompt(null);
                return;
            }

            // Forced: a new major version.
            if (isMajorUpdate(store.version)) {
                setPrompt({ force: true, storeVersion: store.version });
                return;
            }

            // Optional — unless the guest said "Later" to this version recently.
            const key = store.snoozeKey ?? store.version ?? 'unknown';
            const snooze = await getItemFromAsyncStorage<{ version: string; until: number }>(ASYNC_KEYS.UPDATE_SNOOZE);
            if (snooze?.version === key && Date.now() < snooze.until) {
                setPrompt(null);
                return;
            }
            snoozeKey.current = key;
            setPrompt({ force: false, storeVersion: store.version });
        } finally {
            checking.current = false;
        }
    }, []);

    // Check once the app is ready (after the splash).
    useEffect(() => {
        if (enabled) check();
    }, [enabled, check]);

    // …and again when it comes back to the foreground.
    useEffect(() => {
        if (!enabled) return;
        const sub = AppState.addEventListener('change', (state) => {
            if (state !== 'active') return;
            const stale = Date.now() - lastCheckAt.current > RECHECK_AFTER_MS;
            if (promptRef.current?.force || stale) check();
        });
        return () => sub.remove();
    }, [enabled, check]);

    // "Update Now": Play's full-screen update on Android when it can run; otherwise the store page.
    // The prompt stays up — if the guest comes back without updating, a forced one must still be there.
    const update = useCallback(async () => {
        if (Platform.OS === 'android' && canUpdateInApp.current) {
            try {
                await updates().startUpdate({ updateType: IAUUpdateKind.IMMEDIATE });
                return;
            } catch {
                // Fall through to the Play Store page.
            }
        }
        Linking.openURL(storeUrl.current).catch(() => {
            showToast('warning', "Couldn't open the store. Please update the app from the store.");
        });
    }, []);

    // "Later": hide it, and don't ask about this version again for a few days.
    const later = useCallback(() => {
        if (promptRef.current?.force) return; // a forced prompt can't be skipped
        setPrompt(null);
        setItemInAsyncStorage(ASYNC_KEYS.UPDATE_SNOOZE, {
            version: snoozeKey.current,
            until: Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000,
        });
    }, []);

    return { prompt, update, later };
}
