import type { TextStyle } from 'react-native';

/**
 * Font families. SYSTEM fonts for now — actual fonts are linked later.
 * When Montserrat + Open Sans are in assets/fonts and linked, fill these
 * in ONE place and every preset below picks them up automatically.
 * e.g. heading: 'Montserrat-Regular', body: 'OpenSans-Regular'
 * (undefined = RN falls back to the system font, no crash.)
 */
export const FONT_FAMILY = {
    heading: undefined as string | undefined,
    body: undefined as string | undefined,
};

export const fontSizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 34,
} as const;

/**
 * Text presets — size / weight / spacing / line-height / transform ONLY.
 * No colour here: colour comes from the theme at usage (theme.palette.text.*),
 * so one preset works in both light and dark.
 *
 * Headings follow the RA design language: uppercase, weight 400, wide
 * letter-spacing. In RN letterSpacing is absolute points (not em), so it's
 * tuned per size rather than a single ~+0.09em value like the web prototype.
 */
export const typography = {
    display: {
        fontFamily: FONT_FAMILY.heading,
        fontSize: fontSizes.display,
        fontWeight: '400',
        letterSpacing: 3,
        lineHeight: 42,
        textTransform: 'uppercase',
    },
    h1: {
        fontFamily: FONT_FAMILY.heading,
        fontSize: fontSizes.xxl,
        fontWeight: '400',
        letterSpacing: 2.5,
        lineHeight: 34,
        textTransform: 'uppercase',
    },
    h2: {
        fontFamily: FONT_FAMILY.heading,
        fontSize: fontSizes.xl,
        fontWeight: '400',
        letterSpacing: 2,
        lineHeight: 28,
        textTransform: 'uppercase',
    },
    title: {
        fontFamily: FONT_FAMILY.heading,
        fontSize: fontSizes.lg,
        fontWeight: '500',
        letterSpacing: 1.5,
        lineHeight: 24,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontFamily: FONT_FAMILY.body,
        fontSize: fontSizes.md,
        fontWeight: '600',
        letterSpacing: 0.2,
        lineHeight: 24,
    },
    body: {
        fontFamily: FONT_FAMILY.body,
        fontSize: fontSizes.md,
        fontWeight: '400',
        letterSpacing: 0.2,
        lineHeight: 24,
    },
    bodySmall: {
        fontFamily: FONT_FAMILY.body,
        fontSize: fontSizes.sm,
        fontWeight: '400',
        letterSpacing: 0.2,
        lineHeight: 20,
    },
    caption: {
        fontFamily: FONT_FAMILY.body,
        fontSize: fontSizes.xs,
        fontWeight: '400',
        letterSpacing: 0.3,
        lineHeight: 16,
    },
    button: {
        fontFamily: FONT_FAMILY.heading,
        fontSize: fontSizes.sm,
        fontWeight: '500',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    label: {
        fontFamily: FONT_FAMILY.body,
        fontSize: fontSizes.sm,
        fontWeight: '500',
        letterSpacing: 0.3,
        lineHeight: 20,
    },
} satisfies Record<string, TextStyle>;

export type TypographyPreset = keyof typeof typography;