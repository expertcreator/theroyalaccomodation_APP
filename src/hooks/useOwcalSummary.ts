import { useEffect, useState } from 'react';
import { owGetSummary, OwSummary } from '../api/owcal';

type State = { loading: boolean; summary: OwSummary | null; error: boolean };

export function useOwcalSummary(input: {
    accomId: number;
    checkIn: string | null;
    checkOut: string | null;
    adults: number;
    children: number;
    pets?: number;
    enabled?: boolean;
    debounceMs?: number;
}): State {
    const { accomId, checkIn, checkOut, adults, children, pets = 0, enabled = true, debounceMs = 400 } = input;

    const [state, setState] = useState<State>({ loading: false, summary: null, error: false });

    useEffect(() => {
        if (!enabled || !checkIn || !checkOut) {
            setState({ loading: false, summary: null, error: false });
            return;
        }

        let cancelled = false;
        setState(s => ({ ...s, loading: true, error: false }));   // spinner shows immediately

        const timer = setTimeout(() => {
            owGetSummary({ accomId, checkIn, checkOut, adults, children, pets })
                .then(res => { if (!cancelled) setState({ loading: false, summary: res, error: !res.ok }); })
                .catch(() => { if (!cancelled) setState({ loading: false, summary: null, error: true }); });
        }, debounceMs);

        return () => { cancelled = true; clearTimeout(timer); };  // new tap cancels the pending call
    }, [accomId, checkIn, checkOut, adults, children, pets, enabled, debounceMs]);

    return state;
}