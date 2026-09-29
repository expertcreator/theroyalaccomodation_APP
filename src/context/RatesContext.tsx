import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { ASYNC_KEYS, getItemFromAsyncStorage, setItemInAsyncStorage } from '../utils/storage';
import { getRatesAPI, RatesMap } from '../api/raApi';

type RatesContextValue = {
    rates: RatesMap | null;        // live or cached; null until either arrives (consumers fall back to static)
    loading: boolean;              // true while the first network fetch is in flight
    ready: boolean;
    refresh: () => Promise<void>;  // manual re-fetch if ever needed
};

const RatesContext = createContext<RatesContextValue>({
    rates: null,
    loading: false,
    ready: false,
    refresh: async () => { },
});

export const useRates = () => useContext(RatesContext);

/**
 * Loads lowest/highest nightly rates once at startup and keeps them in context.
 *
 * Non-blocking: children render immediately (splash is never delayed). Flow is
 * cache-first — show the last cached rates instantly on cold start, then refresh
 * from the network in the background. On failure we simply keep whatever we have
 * (cache, or nothing → consumers fall back to their static baseRate).
 */
export const RatesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [rates, setRates] = useState<RatesMap | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [ready, setReady] = useState<boolean>(false);
    const mounted = useRef(true);

    const load = async () => {
        setLoading(true);
        const live = await getRatesAPI();               // null on any failure
        if (!mounted.current) return;
        if (live) {
            setRates(live);
            setItemInAsyncStorage(ASYNC_KEYS.RATES, live); // fire-and-forget cache write
        }
        setLoading(false);
        setReady(true);   // we got a definitive true/false response — splash may proceed
    };

    useEffect(() => {
        mounted.current = true;

        (async () => {
            // 1. Instant paint from cache (if any) so Home shows real numbers on cold start.
            const cached = await getItemFromAsyncStorage<RatesMap>(ASYNC_KEYS.RATES);
            if (mounted.current && cached) {
                setRates(prev => prev ?? cached); // don't clobber a live result that already landed
            }
            // 2. Refresh from the network in the background.
            load();
        })();

        return () => { mounted.current = false; };
    }, []);

    return (
        <RatesContext.Provider value={{ rates, loading, ready, refresh: load }}>
            {children}
        </RatesContext.Provider>
    );
};