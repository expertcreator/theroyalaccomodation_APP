import { useCallback, useEffect, useState } from 'react';
import { initStripe } from '@stripe/stripe-react-native';
import { getCheckoutConfigAPI } from '../api/raApi';

// What the Payment screen should show:
//   loading → asking the site, then starting Stripe
//   off     → in-app booking is switched off on the site → "coming soon"
//   error   → couldn't reach the site or start Stripe → "Try Again"
//   ready   → Stripe is set up with the site's key ('test' = test cards only)
export type CheckoutConfigState =
    | { status: 'loading' }
    | { status: 'off' }
    | { status: 'error' }
    | { status: 'ready'; mode: 'test' | 'live' };

/**
 * Asks our plugin whether the app can take bookings and which Stripe key to
 * use, then starts Stripe with that key. The key always matches the website's
 * Stripe account and mode — nothing about Stripe is hard-coded in the app.
 */
export function useCheckoutConfig() {
    const [state, setState] = useState<CheckoutConfigState>({ status: 'loading' });

    const load = useCallback(async () => {
        setState({ status: 'loading' });

        const config = await getCheckoutConfigAPI();
        if (!config) {
            setState({ status: 'error' });   // site unreachable
            return;
        }
        if (!config.enabled || !config.publishableKey || config.mode === 'off') {
            setState({ status: 'off' });     // switched off on the site
            return;
        }

        try {
            await initStripe({ publishableKey: config.publishableKey });
            setState({ status: 'ready', mode: config.mode });
        } catch {
            setState({ status: 'error' });   // Stripe couldn't start
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return { state, retry: load };
}
