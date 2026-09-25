export const live_BaseUrl = "https://theroyalaccommodation.com/wp-admin/admin-ajax.php";

export const baseUrl = live_BaseUrl;
// RA App API — our companion WordPress plugin (read-only, public availability/occupied dates).
// Note: this is the wp-json REST base, NOT admin-ajax.
export const raAppBaseUrl = "https://theroyalaccommodation.com/wp-json/ra-app/v1";

export const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    'Referer': 'https://theroyalaccommodation.com/book-online/',
    'Origin': 'https://theroyalaccommodation.com',
};

export const apiEndpoints = {
    getAvailableAccom: 'ow_get_available_accom',
    getSummary: 'ow_get_summary',
    verifyCoupon: 'ow_verify_coupon',
    createResa: 'ow_create_resa',
} as const;