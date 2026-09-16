import { StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';

// Scale helper — same approach as typography.ts (ms).
// Every spacing value is pre-scaled once here, so components just use
// spacing.lg directly with no moderateScale() wrapper at the call site.
const s = (n: number) => moderateScale(n);

/**
 * Spacing scale, base-4 rhythm. Already scaled for device size.
 * Use for padding / margin / gaps — horizontal and vertical alike.
 */
export const spacing = {
    none: 0,
    xxs: s(2),
    xs: s(4),
    sm: s(8),
    md: s(12),
    lg: s(16),
    xl2: s(20),
    xl: s(24),
    xl3: s(28),
    xxl: s(32),
    xxxl: s(48),
} as const;

/** Corner radii — NOT scaled (radii shouldn't grow with device; pill must stay huge). */
export const radius = {
    none: 0,
    sm: 6,
    md: 10,
    lg: 16,
    xl: 24,
    pill: 999,
} as const;

/** Border / hairline widths — thin lines suit the luxury look. NOT scaled. */
export const borderWidth = {
    hairline: StyleSheet.hairlineWidth,
    thin: 1,
    thick: 2,
} as const;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;