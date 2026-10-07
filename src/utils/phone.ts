// Phone helpers — validate + normalize using the country the user picked.
// Phone is OPTIONAL, so empty always counts as valid.
import { isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';
import { isoForCountry } from '../constants/countries';

// Valid for the selected country? Empty = valid (optional field).
export function isValidPhone(input: string, countryName?: string | null): boolean {
    const raw = input.trim();
    if (!raw) return true;
    const region = isoForCountry(countryName) as CountryCode | undefined;
    return isValidPhoneNumber(raw, region);
}

// Normalize to E.164 for storage ("+447700900000"). Empty → null.
// If it can't be parsed we keep the raw text (validation flags bad input separately).
export function toE164(input: string, countryName?: string | null): string | null {
    console.log('toE164', { input, countryName });
    
    const raw = input.trim();
    if (!raw) return null;
    const region = isoForCountry(countryName) as CountryCode | undefined;
    const parsed = parsePhoneNumberFromString(raw, region);
    return parsed ? parsed.number : raw;
}

// Pretty international format for display ("+44 7700 900000").
// Falls back to the raw text if it can't be parsed yet.
export function formatPhoneDisplay(input: string, countryName?: string | null): string {
    const raw = input.trim();
    if (!raw) return '';
    const region = isoForCountry(countryName) as CountryCode | undefined;
    const parsed = parsePhoneNumberFromString(raw, region);
    return parsed ? parsed.formatInternational() : input;
}