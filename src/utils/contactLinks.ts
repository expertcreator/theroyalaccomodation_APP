import { Linking } from 'react-native';
import { showToast } from './ToastNotifier';

/**
 * Open the phone's dialer / mail app for our contact details.
 *
 * Opening fails when nothing can handle the link — e.g. an iPad or the iOS
 * simulator has no Phone app, or no mail app is set up. Instead of the tap
 * silently doing nothing, we show the number / address in a toast so the
 * guest can still use it.
 */

/** Opens the link; calls onFail if it couldn't be opened. */
function open(url: string, onFail: () => void) {
    Linking.openURL(url)
        // Usually a failure is an error, but on the iOS simulator React Native
        // answers a failed "tel:" link with `false` instead — treat both the same.
        // (RN's types say it resolves with nothing, hence `unknown`.)
        .then((opened: unknown) => { if (opened === false) onFail(); })
        .catch(onFail);
}

/** Opens the dialer with the number filled in. Pass the E.164 form, e.g. "+447736072100". */
export function callNumber(phone: string, display: string = phone) {
    open(`tel:${phone}`, () => {
        showToast('warning', `Couldn't open your phone app. Please call us on ${display}.`);
    });
}

/** Opens a new email to this address in the guest's mail app. */
export function sendEmail(email: string) {
    open(`mailto:${email}`, () => {
        showToast('warning', `Couldn't open your email app. Please email us at ${email}.`);
    });
}
