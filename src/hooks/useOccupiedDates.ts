import { useEffect, useRef, useState } from 'react';
import { getOccupiedDates } from '../api/raApi';
import { toISO, startOfDay, addMonths } from '../utils/date';

// How many months to fetch per request (the viewed month + the rest as a buffer).
const CHUNK_MONTHS = 3;

/**
 * Loads REAL occupied dates for a property, windowed around the viewed month and
 * extended as the user pages the calendar. Results ACCUMULATE — a fetch in flight
 * when the month changes still merges its data (it's valid regardless of the
 * current month), which is what makes far-future months and quick paging work.
 */
export function useOccupiedDates(accomId: number, focusMonth: Date) {
    const [occupied, setOccupied] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const occ = useRef<Set<string>>(new Set());        // all occupied dates gathered so far
    const loaded = useRef<Set<string>>(new Set());     // 'YYYY-MM' chunks confirmed fetched
    const inFlight = useRef<Set<string>>(new Set());   // 'YYYY-MM' chunks currently fetching
    const accomRef = useRef<number>(accomId);
    const mounted = useRef<boolean>(true);

    // Only guard against setState after the screen is really gone.
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    useEffect(() => {
        // Reset everything if the property changes.
        if (accomRef.current !== accomId) {
            accomRef.current = accomId;
            occ.current = new Set();
            loaded.current = new Set();
            inFlight.current = new Set();
            setOccupied([]);
        }

        const key = (d: Date) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        const monthKey = key(focusMonth);
        if (loaded.current.has(monthKey) || inFlight.current.has(monthKey)) return; // already have / getting it

        const start = new Date(focusMonth.getFullYear(), focusMonth.getMonth(), 1);
        const today = startOfDay(new Date());
        const from = toISO(start < today ? today : start); // never ask before today
        const to = toISO(addMonths(start, CHUNK_MONTHS));

        const chunkKeys = Array.from({ length: CHUNK_MONTHS }, (_, i) => key(addMonths(start, i)));
        chunkKeys.forEach(k => inFlight.current.add(k));

        // Capture the accom this fetch is for, so a late reply after a property
        // switch doesn't merge into the wrong property.
        const forAccom = accomId;

        setLoading(true);
        getOccupiedDates(accomId, from, to)
            .then(list => {
                if (!mounted.current || accomRef.current !== forAccom) return;
                for (const d of list) occ.current.add(d);
                chunkKeys.forEach(k => loaded.current.add(k)); // mark loaded on success
                setOccupied(Array.from(occ.current));          // always merges, even if month changed
            })
            .finally(() => {
                if (accomRef.current === forAccom) {
                    chunkKeys.forEach(k => inFlight.current.delete(k));
                }
                if (mounted.current && accomRef.current === forAccom) setLoading(false);
            });

        // NOTE: no per-effect cleanup that cancels — that was discarding valid data.
    }, [accomId, focusMonth]);

    return { occupied, loading };
}