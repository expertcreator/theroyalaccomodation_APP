import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { ASYNC_KEYS, getItemFromAsyncStorage, setItemInAsyncStorage } from '../utils/storage';
import { getReviewsAPI, ReviewsMap } from '../api/raApi';
import { useRefreshWhenStale } from '../hooks/useRefreshWhenStale';

type ReviewsContextValue = {
    reviews: ReviewsMap | null;    // live or cached; null until either arrives (consumers hide the row)
    loading: boolean;
    refresh: () => Promise<void>;
};

const ReviewsContext = createContext<ReviewsContextValue>({
    reviews: null,
    loading: false,
    refresh: async () => { },
});

export const useReviews = () => useContext(ReviewsContext);

/**
 * Loads guest reviews at startup and keeps them in context.
 * Reloads by itself (quietly) when the phone comes back online or the app comes
 * back to the foreground, if the reviews aren't fresh — see useRefreshWhenStale.
 *
 * NON-blocking — unlike rates, reviews never gate the splash. Fetched in
 * parallel with rates, cache-first: show cached reviews instantly on cold
 * start, then refresh in the background. On failure we keep whatever we have
 * (cache, or nothing → PropertyCard simply hides the review row).
 */
export const ReviewsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [reviews, setReviews] = useState<ReviewsMap | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const mounted = useRef(true);

    // Fetch the reviews. Returns true if it worked. quiet = no toast on failure.
    const load = async (quiet: boolean): Promise<boolean> => {
        setLoading(true);
        const live = await getReviewsAPI(quiet);   // null on any failure
        if (!mounted.current) return false;
        if (live) {
            setReviews(live);
            setItemInAsyncStorage(ASYNC_KEYS.REVIEWS, live); // fire-and-forget cache write
        }
        setLoading(false);
        return !!live;
    };

    // `run` does the first load; the hook reloads later when the reviews go stale.
    const run = useRefreshWhenStale(load);

    useEffect(() => {
        mounted.current = true;
        (async () => {
            const cached = await getItemFromAsyncStorage<ReviewsMap>(ASYNC_KEYS.REVIEWS);
            if (mounted.current && cached) setReviews(prev => prev ?? cached);
            run();
        })();
        return () => { mounted.current = false; };
    }, []);

    return (
        <ReviewsContext.Provider value={{ reviews, loading, refresh: () => run() }}>
            {children}
        </ReviewsContext.Provider>
    );
};

// Convenience lookup for one residence — used by ReviewsSection (and can replace
// PropertyCard's manual map indexing). Pass the accom id, get its reviews or null.
export const useResidenceReviews = (accomId: number) => {
    const { reviews } = useReviews();
    return reviews?.[String(accomId)] ?? null; // { accomId, property, average, count, reviews[] } | null
};