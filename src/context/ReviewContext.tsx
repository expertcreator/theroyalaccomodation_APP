import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { ASYNC_KEYS, getItemFromAsyncStorage, setItemInAsyncStorage } from '../utils/storage';
import { getReviewsAPI, ReviewsMap } from '../api/raApi';

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
 * Loads guest reviews once at startup and keeps them in context.
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

    const load = async () => {
        setLoading(true);
        const live = await getReviewsAPI();   // null on any failure
        if (!mounted.current) return;
        if (live) {
            setReviews(live);
            setItemInAsyncStorage(ASYNC_KEYS.REVIEWS, live); // fire-and-forget cache write
        }
        setLoading(false);
    };

    useEffect(() => {
        mounted.current = true;
        (async () => {
            const cached = await getItemFromAsyncStorage<ReviewsMap>(ASYNC_KEYS.REVIEWS);
            if (mounted.current && cached) setReviews(prev => prev ?? cached);
            load();
        })();
        return () => { mounted.current = false; };
    }, []);

    return (
        <ReviewsContext.Provider value={{ reviews, loading, refresh: load }}>
            {children}
        </ReviewsContext.Provider>
    );
};