import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';

// Data older than this counts as stale.
const STALE_AFTER_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Keeps data that's loaded at app start (rates, reviews) up to date.
 *
 * `load(quiet)` fetches the data and returns true if it worked. `quiet` is true
 * for the automatic refreshes below, so a failed one shows no toast — the guest
 * didn't ask for it.
 *
 * Returns `run(quiet?)`: call it for the first load (and any manual refresh).
 * After that, the hook calls `load` again by itself when:
 *   1. the phone comes back online, or
 *   2. the app comes back to the foreground,
 * but only if the data isn't fresh: nothing has loaded successfully yet, or the
 * last success was more than 30 minutes ago. So turning Wi-Fi off and on with
 * fresh data, or a quick trip to another app, makes no requests.
 */
export function useRefreshWhenStale(load: (quiet: boolean) => Promise<boolean>) {
    const lastSuccessAt = useRef<number | null>(null);    // when `load` last worked
    const inFlight = useRef<Promise<void> | null>(null);  // the load in progress, if any

    // Always call the latest `load` (it's recreated on every render of the provider).
    const loadRef = useRef(load);
    loadRef.current = load;

    // Load once, remembering when it worked. A second call while one is running
    // doesn't start another request; it just waits for the running one (so e.g.
    // Home's pull-to-refresh spinner stays until the data is in).
    const run = useCallback((quiet = false): Promise<void> => {
        if (inFlight.current) return inFlight.current;
        inFlight.current = (async () => {
            try {
                const worked = await loadRef.current(quiet);
                if (worked) lastSuccessAt.current = Date.now();
            } finally {
                inFlight.current = null;
            }
        })();
        return inFlight.current;
    }, []);

    // Load again only if what we have isn't fresh.
    const refreshIfStale = useCallback(() => {
        const last = lastSuccessAt.current;
        const stale = last === null || Date.now() - last > STALE_AFTER_MS;
        if (stale) run(true);
    }, [run]);

    // 1. Back online. "Offline" = no network, or a network that can't reach the
    //    internet. NetInfo starts as "unknown" (null), which doesn't count as
    //    offline, so app start is never mistaken for "just came back online".
    const net = useNetInfo();
    const isOffline = net.isConnected === false || net.isInternetReachable === false;
    const wasOffline = useRef(isOffline);
    useEffect(() => {
        const cameBackOnline = wasOffline.current && !isOffline;
        wasOffline.current = isOffline;
        if (cameBackOnline) refreshIfStale();
    }, [isOffline, refreshIfStale]);

    // 2. Back in the foreground (e.g. the app was left in the background overnight).
    useEffect(() => {
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') refreshIfStale();
        });
        return () => sub.remove();
    }, [refreshIfStale]);

    return run;
}
