import { StyleSheet } from 'react-native';

/**
 * Spacing scale (points), base-4 rhythm.
 * Use these instead of ad-hoc numbers so padding/margins stay consistent.
 */
export const spacing = {
    none: 0,
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
} as const;

/** Corner radii. */
export const radius = {
    none: 0,
    sm: 6,
    md: 10,
    lg: 16,
    xl: 24,
    pill: 999,
} as const;

/** Border / hairline widths — thin lines suit the luxury look. */
export const borderWidth = {
    hairline: StyleSheet.hairlineWidth,
    thin: 1,
    thick: 2,
} as const;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;