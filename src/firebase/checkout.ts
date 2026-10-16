// In-app booking — talks to our WordPress plugin's checkout routes (RA App API v1.4.0).
//
// Every call carries the guest's Firebase sign-in token. The plugin takes the
// booking email from that token, and does all the pricing and payment checks
// itself — the app never decides what is charged.
//
//   startCheckout   → POST /me/checkout          hold the dates + create the Stripe payment
//   confirmCheckout → POST /me/checkout/confirm  after Stripe took the card: complete the booking
//   cancelCheckout  → POST /me/checkout/cancel   the guest left without paying: free the dates

import { getIdToken } from '@react-native-firebase/auth';
import { auth } from './config';
import { postDataAPI } from '../api/apiClient';
import { headers as OW_HEADERS, raAppBaseUrl } from '../api/apiEndpoints';

/** What the app sends to start a booking (email is NOT sent — it comes from the token). */
export type CheckoutRequest = {
    accomId: number;
    checkIn: string;    // 'YYYY-MM-DD'
    checkOut: string;   // 'YYYY-MM-DD'
    adults: number;
    children: number;
    pets: number;
    couponCode?: string | null;
    // The guest's details (same fields as the website's "Enter your details" form)
    firstName: string;
    lastName: string;
    countryIso: string; // e.g. 'GB'
    phone?: string | null;
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    county?: string | null;
    postCode?: string | null;
};

/** A started booking: what Stripe needs to take the card, and what to show. */
export type StartedCheckout = {
    ref: string;              // OWcal booking reference, e.g. 'AB12CD34'
    paymentIntentId: string;
    clientSecret: string;     // for Stripe's confirmPayment
    publishableKey: string;
    amount: number;           // exactly what will be charged
    currency: string;         // e.g. 'GBP'
};

/** Why something failed — the plugin's data.code, or 'network' if we couldn't reach it. */
export type CheckoutErrorCode =
    | 'checkout-off' | 'invalid-request' | 'dates-unavailable' | 'coupon-invalid'
    | 'price-error' | 'payment-error' | 'unavailable' | 'invalid-token'
    | 'not-found' | 'not-paid' | 'network';

export type CheckoutError = { kind: 'error'; code: CheckoutErrorCode; message: string };

export type StartResult =
    | { kind: 'started'; checkout: StartedCheckout }
    | { kind: 'already-paid'; paymentIntentId: string }   // an earlier payment for this stay went through → just confirm it
    | CheckoutError;

export type ConfirmResult =
    | {
        kind: 'confirmed' | 'processing';   // processing = the bank is still finishing; OWcal completes it later
        ref: string;
        total: number;
        paid: number;
        currency: string;
        bookingStatus: string;              // OWcal's status, e.g. 'new' (or 'pending' = awaiting the owner)
    }
    | CheckoutError;

// The plugin's reply envelope.
type PluginReply = { success: boolean; message: string; data: any } | null;

const NETWORK_ERROR: CheckoutError = {
    kind: 'error',
    code: 'network',
    message: "Couldn't reach the booking system. Please check your connection and try again.",
};

// How long a checkout request may take before we give up.
const CHECKOUT_TIMEOUT_MS = 45000;

// POST to a checkout route with the guest's sign-in token. null = no reply (network).
async function postWithToken(path: string, body: object): Promise<PluginReply | 'signed-out'> {
    const user = auth.currentUser;
    if (!user) return 'signed-out';
    const token = await getIdToken(user);

    // Same firewall-friendly headers as the other plugin calls, minus the form
    // Content-Type — these are JSON requests (see sendEnquiryAPI in api/raApi.ts).
    const { 'Content-Type': _omit, ...wafHeaders } = OW_HEADERS;

    // Give up after 45 s (Android has no time limit of its own), so a dead connection
    // can't leave "Holding your dates…" spinning forever. A timed-out request
    // comes back as null = the usual "Couldn't reach the booking system" message.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CHECKOUT_TIMEOUT_MS);
    try {
        return await postDataAPI({
            url: `${raAppBaseUrl}${path}`,
            data: body as Record<string, any>,
            headers: { ...wafHeaders, 'X-Firebase-Token': token },
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timer);
    }
}

// Turn a failed reply into a CheckoutError the screen can switch on.
function toError(reply: PluginReply | 'signed-out'): CheckoutError {
    if (reply === 'signed-out') {
        return { kind: 'error', code: 'invalid-token', message: 'Please sign in again.' };
    }
    if (!reply) return NETWORK_ERROR;
    return {
        kind: 'error',
        code: (reply.data?.code as CheckoutErrorCode) || 'unavailable',
        message: reply.message || 'Something went wrong. Please try again.',
    };
}

/** Start a booking. Never throws. */
export async function startCheckout(request: CheckoutRequest): Promise<StartResult> {
    try {
        const reply = await postWithToken('/me/checkout', request);
        if (reply && reply !== 'signed-out' && reply.success) {
            const d = reply.data ?? {};
            if (d.alreadyPaid && d.paymentIntentId) {
                return { kind: 'already-paid', paymentIntentId: String(d.paymentIntentId) };
            }
            if (d.clientSecret && d.paymentIntentId) {
                return {
                    kind: 'started',
                    checkout: {
                        ref: String(d.ref ?? ''),
                        paymentIntentId: String(d.paymentIntentId),
                        clientSecret: String(d.clientSecret),
                        publishableKey: String(d.publishableKey ?? ''),
                        amount: Number(d.amount) || 0,
                        currency: String(d.currency ?? 'GBP'),
                    },
                };
            }
        }
        return toError(reply);
    } catch {
        return NETWORK_ERROR;
    }
}

/** After Stripe took the card: ask the plugin to check with Stripe and complete the booking. Never throws. */
export async function confirmCheckout(paymentIntentId: string): Promise<ConfirmResult> {
    try {
        const reply = await postWithToken('/me/checkout/confirm', { paymentIntentId });
        if (reply && reply !== 'signed-out' && reply.success) {
            const d = reply.data ?? {};
            return {
                kind: d.status === 'processing' ? 'processing' : 'confirmed',
                ref: String(d.ref ?? ''),
                total: Number(d.total) || 0,
                paid: Number(d.paid) || 0,
                currency: String(d.currency ?? 'GBP'),
                bookingStatus: String(d.bookingStatus ?? ''),
            };
        }
        return toError(reply);
    } catch {
        return NETWORK_ERROR;
    }
}

// The "free the dates" request that's still on its way (null when there's none).
// Check Availability waits for it before re-loading booked dates, so dates the
// guest has just let go of don't still show as booked.
let releasing: Promise<void> | null = null;

/**
 * The guest left without paying: free the held dates. Fire-and-forget — if it
 * fails, OWcal releases the hold by itself within the hour.
 */
export function cancelCheckout(paymentIntentId: string): Promise<void> {
    const request = (async () => {
        try {
            await postWithToken('/me/checkout/cancel', { paymentIntentId });
        } catch {
            // ignore — see above
        }
    })();
    releasing = request;
    request.then(() => {
        if (releasing === request) releasing = null;
    });
    return request;
}

/** Resolves once a "free the dates" request has finished (straight away if none; at most 5 s). */
export function waitForRelease(): Promise<void> {
    if (!releasing) return Promise.resolve();
    const fiveSeconds = new Promise<void>((resolve) => setTimeout(() => resolve(), 5000));
    return Promise.race([releasing, fiveSeconds]);
}
