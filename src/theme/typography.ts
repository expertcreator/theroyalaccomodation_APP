import { Platform, type TextStyle } from 'react-native';
import { moderateScale } from 'react-native-size-matters';

// Scale helper — every size/spacing/line-height runs through this so the
// whole type scale is responsive. Change scaling behaviour in ONE place.
const ms = (n: number) => moderateScale(n);

export const FONT_FAMILY = {
    heading: undefined as string | undefined,
    body: undefined as string | undefined,
};

// Raw semantic sizes (unscaled). Presets below apply ms().
export const fontSizes = {
    xxs: 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 34,
} as const;

/**
 * Text presets — size / weight / spacing / line-height / transform, all
 * scaled via ms(). NO colour: colour comes from the theme at usage
 * (theme.palette.*), so one preset works in both light and dark.
 */
export const typography = {
    display: {
        fontFamily: FONT_FAMILY.heading, fontSize: ms(fontSizes.display),
        fontWeight: '400', letterSpacing: ms(3), lineHeight: ms(42), textTransform: 'uppercase',
    },
    h1: {
        fontFamily: FONT_FAMILY.heading, fontSize: ms(fontSizes.xxl),
        fontWeight: '400', letterSpacing: ms(2.5), lineHeight: ms(34), textTransform: 'uppercase',
    },
    h2: {
        fontFamily: FONT_FAMILY.heading, fontSize: ms(fontSizes.xl),
        fontWeight: '400', letterSpacing: ms(2), lineHeight: ms(28), textTransform: 'uppercase',
    },
    title: {
        fontFamily: FONT_FAMILY.heading, fontSize: ms(fontSizes.lg),
        fontWeight: '500', letterSpacing: ms(1.5), lineHeight: ms(24), textTransform: 'uppercase',
    },
    // Nav-bar title (Check Availability header, etc.) — Stitch: 13px, wide track, semibold.
    headerTitle: {
        fontFamily: FONT_FAMILY.heading, fontSize: ms(13),
        fontWeight: '600', letterSpacing: ms(2), lineHeight: ms(18), textTransform: 'uppercase',
    },
    // Gold eyebrow / wordmark subtitle — Stitch: ~10px, very wide track.
    overline: {
        fontFamily: FONT_FAMILY.body, fontSize: ms(fontSizes.xxs),
        fontWeight: '600', letterSpacing: ms(2), lineHeight: ms(14), textTransform: 'uppercase',
    },
    subtitle: {
        fontFamily: FONT_FAMILY.body, fontSize: ms(fontSizes.md),
        fontWeight: '600', letterSpacing: ms(0.2), lineHeight: ms(24),
    },
    body: {
        fontFamily: FONT_FAMILY.body, fontSize: ms(fontSizes.md),
        fontWeight: '400', letterSpacing: ms(0.2), lineHeight: ms(24),
    },
    bodySmall: {
        fontFamily: FONT_FAMILY.body, fontSize: ms(fontSizes.sm),
        fontWeight: '400', letterSpacing: ms(0.2), lineHeight: ms(Platform.OS === "ios" ? 0 : 20),
    },
    caption: {
        fontFamily: FONT_FAMILY.body, fontSize: ms(fontSizes.xs),
        fontWeight: '400', letterSpacing: ms(0.3), lineHeight: ms(16),
    },
    button: {
        fontFamily: FONT_FAMILY.heading, fontSize: ms(fontSizes.sm),
        fontWeight: '500', letterSpacing: ms(1.5), textTransform: 'uppercase',
    },
    buttonSmall: {
        fontFamily: FONT_FAMILY.heading,
        fontSize: ms(fontSizes.xs),
        fontWeight: '500',
        letterSpacing: ms(1),
        textTransform: 'uppercase',
    },
    label: {
        fontFamily: FONT_FAMILY.body, fontSize: ms(fontSizes.sm),
        fontWeight: '500', letterSpacing: ms(0.3), lineHeight: ms(20),
    },
} satisfies Record<string, TextStyle>;

export type TypographyPreset = keyof typeof typography;