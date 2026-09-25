import { postDataAPI } from './apiClient';
import { baseUrl, headers as OW_HEADERS, apiEndpoints } from './apiEndpoints';

// admin-ajax needs application/x-www-form-urlencoded — build the body by hand
// (avoids depending on URLSearchParams being polyfilled in RN 0.87).
const encodeForm = (obj: Record<string, string | number>) =>
    Object.entries(obj)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');

const num = (html: string, re: RegExp): number | null => {
    const m = html.match(re);
    return m ? parseFloat(m[1]) : null;
};

// OWcal "Pet Fee" option — global (Ascot 1680 & Windsor 1225), £295 each, max 2.
// Field name pattern: ow-option-<id>-multi-accom-1
const OW_PET_OPTION_ID = 1;

/* ---------- ow_get_summary → the REAL price (fees, seasonal rates and all) ---------- */
export type OwSummary = { ok: boolean; total: number; deposit: number; html: string };

export async function owGetSummary(input: {
    accomId: number; checkIn: string; checkOut: string;
    adults: number; children: number; pets?: number;
}): Promise<OwSummary> {
    const fields: Record<string, string | number> = {
        action: apiEndpoints.getSummary,
        'ow-details-accom-ids': input.accomId,
        'ow-details-check-in': input.checkIn,
        'ow-details-check-out': input.checkOut,
        'ow-details-adults': input.adults,
        'ow-details-children': input.children,
    };

    // Pet Fee is an OWcal option, not a base field — include it only when pets > 0.
    if (input.pets && input.pets > 0) {
        fields['ow-has-options-form'] = 'yes';
        fields[`ow-option-${OW_PET_OPTION_ID}-multi-accom-1`] = input.pets;
    }

    const res = await postDataAPI({
        url: baseUrl,
        data: encodeForm(fields),
        ContentType: 'application/x-www-form-urlencoded',
        headers: OW_HEADERS,
    });

    const html = typeof res === 'string' ? res : '';
    const total = num(html, /data-charged-total-price-raw="([\d.]+)"/);
    const deposit = num(html, /data-charged-deposit-raw="([\d.]+)"/);
    return { ok: total != null, total: total ?? 0, deposit: deposit ?? total ?? 0, html };
}

/* ---------- ow_get_available_accom → is this property bookable for these dates? ---------- */
export type OwAvailability = { success: boolean; raw: any };

export async function owGetAvailableAccom(input: {
    accomId: number; checkIn: string; checkOut: string; adults: number; children: number;
}): Promise<OwAvailability> {
    const body = encodeForm({
        action: apiEndpoints.getAvailableAccom,
        check_in: input.checkIn,
        check_out: input.checkOut,
        adults: input.adults,
        children: input.children,
        page_accom_id: input.accomId,
        results_show_only_accom_id: input.accomId,
        current_page_id: '',
        exists_main_booking_form: 'no',
        force_display_thumb: 'no',
        force_display_desc: 'no',
        is_admin: 'no',
        // NB: deliberately NOT sending admin_accom_id / admin_search_type / accom_people
        //     — those admin_* fields trip the WAF (that was the earlier 403).
    });

    const res = await postDataAPI({
        url: baseUrl,
        data: body,
        ContentType: 'application/x-www-form-urlencoded',
        headers: OW_HEADERS,
    });

    return { success: !!(res && res.success), raw: res };
}