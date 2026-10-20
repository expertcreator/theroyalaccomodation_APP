import NetInfo from '@react-native-community/netinfo';
import { showToast } from './ToastNotifier';

/**
 * A friendly toast for a request that failed before any answer came back
 * (no internet, server unreachable, or our time limit hit).
 *
 * Used by apiClient.ts, so every API call gets the same wording. Before this,
 * guests saw axios's raw text: "Network Error".
 */

// The phone has no internet (no Wi-Fi/mobile data, or a network that can't reach the internet).
const OFFLINE_MESSAGE = "You're offline. Check your connection and try again.";

// The phone is online, but our server didn't answer.
const NO_ANSWER_MESSAGE = "Couldn't connect. Please try again.";

// When the connection drops, a screen's requests (often two or three at once)
// all fail together. Show the toast once for the whole burst, not once per request.
const SAME_TOAST_GAP_MS = 4000;
let lastToast = { message: '', shownAt: 0 };

export async function showNetworkError(error: any): Promise<void> {
    const message = await messageFor(error);

    // Skip it if the same message was shown a moment ago.
    const now = Date.now();
    if (message === lastToast.message && now - lastToast.shownAt < SAME_TOAST_GAP_MS) return;
    lastToast = { message, shownAt: now };

    showToast('warning', message);
}

async function messageFor(error: any): Promise<string> {
    // Our own time limit (e.g. /rates and /availability give up after 30 s).
    // axios marks it 'ECONNABORTED' and uses the timeoutErrorMessage we set.
    if (error?.code === 'ECONNABORTED' && error?.message) {
        return error.message;
    }

    // Otherwise ask the phone whether it's online right now.
    // NetInfo says null while it doesn't know yet; only a clear `false` counts as offline.
    try {
        const net = await NetInfo.fetch();
        const offline = net.isConnected === false || net.isInternetReachable === false;
        return offline ? OFFLINE_MESSAGE : NO_ANSWER_MESSAGE;
    } catch {
        return NO_ANSWER_MESSAGE;
    }
}
