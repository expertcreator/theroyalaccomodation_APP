import { useEffect, useState } from 'react';
import { getOccupiedDates } from '../api/raApi';

type State = { occupied: string[]; loading: boolean };

/**
 * Loads the REAL occupied dates for a property from the RA App API.
 * Re-fetches only when accomId / from / to change — keep `from` and `to`
 * stable in the caller (useMemo) so this doesn't fetch on every render.
 */
export function useOccupiedDates(
    accomId: number,
    from: string,
    to: string,
    enabled: boolean = true,
): State {
    const [state, setState] = useState<State>({ occupied: [], loading: false });

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        setState(s => ({ ...s, loading: true }));

        getOccupiedDates(accomId, from, to)
            .then(list => {
                if (!cancelled) setState({ occupied: list, loading: false });
            })
            .catch(() => {
                if (!cancelled) setState({ occupied: [], loading: false });
            });

        return () => {
            cancelled = true;
        };
    }, [accomId, from, to, enabled]);

    return state;
}