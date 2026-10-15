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

// HTML snippet → plain text, e.g. "Cleaning Fee: &pound;295.00" → "Cleaning Fee: £295.00".
const plainText = (s: string): string =>
    s.replace(/<[^>]*>/g, '')
        .replace(/&pound;/g, '£')
        .replace(/&#0?38;|&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .trim();

// The amount at the end of a summary line, e.g. "Cleaning Fee: £295.00" → 295.
const amountAtEnd = (text: string): number | null => {
    const m = text.match(/([\d,]+(?:\.\d+)?)\s*$/);
    return m ? parseFloat(m[1].replace(/,/g, '')) : null;
};

// Text of every <div class="…cls…">…</div> in the summary.
const divTexts = (html: string, cls: string): string[] => {
    const re = new RegExp(`<div class="[^"]*\\b${cls}\\b[^"]*">([\\s\\S]*?)</div>`, 'g');
    return Array.from(html.matchAll(re), (m) => plainText(m[1]));
};

/* ---------- ow_get_summary → the REAL price (fees, seasonal rates and all) ---------- */
// One fee line from OWcal's summary, e.g. { label: 'Cleaning Fee', amount: 295 }.
export type OwFee = { label: string; amount: number };

export type OwSummary = {
    ok: boolean; total: number; deposit: number; html: string;
    // Price breakdown, read from the same summary (null / empty if OWcal didn't show it):
    accomPrice: number | null;   // "Accommodation price" (all nights)
    extrasPrice: number | null;  // "Options / Pets" (e.g. the pet fee)
    fees: OwFee[];               // e.g. the cleaning fee — one entry per fee
    couponAmount: number | null; // "Coupon amount" — only when a coupon is applied
};

export async function owGetSummary(input: {
    accomId: number; checkIn: string; checkOut: string;
    adults: number; children: number; pets?: number;
    couponId?: string | null;    // from owVerifyCoupon — OWcal then takes the discount off the total
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

    // A checked coupon — same field the website sends, so OWcal applies the discount itself.
    if (input.couponId) {
        fields['ow-pre-validated-coupon-id'] = input.couponId;
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

    // Breakdown lines, e.g. "Accommodation price: £4,350.00", "Cleaning Fee: £295.00".
    const accomLine = divTexts(html, 'ow-summary-accom-price')[0];
    const extrasLine = divTexts(html, 'ow-summary-options-price')[0];
    const couponLine = divTexts(html, 'ow-summary-coupon-amount')[0];   // "Coupon amount: £464.50"
    const fees: OwFee[] = [];
    for (const line of divTexts(html, 'ow-summary-fee')) {
        const amount = amountAtEnd(line);
        const label = line.slice(0, line.lastIndexOf(':')).trim(); // text before the last ':'
        if (amount != null && label) fees.push({ label, amount });
    }

    return {
        ok: total != null, total: total ?? 0, deposit: deposit ?? total ?? 0, html,
        accomPrice: accomLine ? amountAtEnd(accomLine) : null,
        extrasPrice: extrasLine ? amountAtEnd(extrasLine) : null,
        fees,
        couponAmount: couponLine ? amountAtEnd(couponLine) : null,
    };
}

/* ---------- ow_verify_coupon → is this coupon code valid for this stay? ---------- */
// valid → couponId (send it to owGetSummary) and label ("10%" / "£50.00").
// message → OWcal's own text (editable by the owner), e.g. "This coupon code is not valid."
export type OwCouponCheck = { valid: boolean; couponId?: string; label?: string; message: string };

export async function owVerifyCoupon(input: {
    code: string; accomId: number; checkIn: string; checkOut: string;
}): Promise<OwCouponCheck> {
    const res = await postDataAPI({
        url: baseUrl,
        data: encodeForm({
            action: apiEndpoints.verifyCoupon,
            coupon_code: input.code,
            accom_ids: input.accomId,
            check_in: input.checkIn,
            check_out: input.checkOut,
        }),
        ContentType: 'application/x-www-form-urlencoded',
        headers: OW_HEADERS,
    });

    // OWcal replies with JSON, which can arrive as a string or already parsed.
    let reply: any = res;
    if (typeof res === 'string') {
        try { reply = JSON.parse(res); } catch { reply = null; }
    }
    if (!reply || typeof reply !== 'object') {
        return { valid: false, message: "Couldn't check the code. Please try again." };
    }

    // OWcal escapes its text (e.g. "&amp;pound;50.00") — turn it back into plain text.
    const clean = (s: unknown) => plainText(String(s ?? '').replace(/&amp;/g, '&'));
    const message = clean(reply.msg) || 'This coupon code is not valid.';

    // OWcal sends success as "1" (valid) or "" (not valid).
    if (reply.success && reply.coupon_id) {
        return { valid: true, couponId: String(reply.coupon_id), label: clean(reply.coupon_amount_text), message };
    }
    return { valid: false, message };
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