import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { ASYNC_KEYS, getItemFromAsyncStorage, setItemInAsyncStorage } from '../utils/storage';
import { getRatesAPI, RatesMap } from '../api/raApi';
import { useRefreshWhenStale } from '../hooks/useRefreshWhenStale';
import type { Property } from '../interfaces/property';

type RatesContextValue = {
    rates: RatesMap | null;        // live or cached; null until either arrives (consumers fall back to static)
    loading: boolean;              // true while a network fetch is in flight
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

// A residence's "from" price per night: the live rate from the website if we
// have it, otherwise the fixed baseRate from constants/data.ts.
// Used by every screen that shows "from £X", so they always agree.
export const useFromRate = (property: Property): number => {
    const { rates } = useRates();
    const liveFrom = rates?.[String(property.owAccomId)]?.from;
    return typeof liveFrom === 'number' && liveFrom > 0 ? liveFrom : property.baseRate;
};

/**
 * Loads lowest/highest nightly rates at startup and keeps them in context.
 * Reloads by itself (quietly) when the phone comes back online or the app comes
 * back to the foreground, if the rates aren't fresh — see useRefreshWhenStale.
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

    // Fetch the rates. Returns true if it worked. quiet = no toast on failure.
    const load = async (quiet: boolean): Promise<boolean> => {
        setLoading(true);
        const live = await getRatesAPI(quiet);          // null on any failure
        if (!mounted.current) return false;
        if (live) {
            setRates(live);
            setItemInAsyncStorage(ASYNC_KEYS.RATES, live); // fire-and-forget cache write
        }
        setLoading(false);
        setReady(true);   // we got a definitive true/false response — splash may proceed
        return !!live;
    };

    // `run` does the first load; the hook reloads later when the rates go stale.
    const run = useRefreshWhenStale(load);

    useEffect(() => {
        mounted.current = true;

        (async () => {
            // 1. Instant paint from cache (if any) so Home shows real numbers on cold start.
            const cached = await getItemFromAsyncStorage<RatesMap>(ASYNC_KEYS.RATES);
            if (mounted.current && cached) {
                setRates(prev => prev ?? cached); // don't clobber a live result that already landed
            }
            // 2. Refresh from the network in the background.
            run();
        })();

        return () => { mounted.current = false; };
    }, []);

    return (
        <RatesContext.Provider value={{ rates, loading, ready, refresh: () => run() }}>
            {children}
        </RatesContext.Provider>
    );
};