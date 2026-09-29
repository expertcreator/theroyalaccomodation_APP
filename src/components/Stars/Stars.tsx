import React from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { withAlpha } from '../../utils/color';

type Props = {
    rating: number;          // 0..5 (rounded for fill)
    size?: number;           // glyph font size
    color?: string;          // filled star colour (defaults to accent)
    emptyColor?: string;     // empty star colour
    style?: StyleProp<TextStyle>;
};

/**
 * Reusable star rating. Fill reflects the rounded rating, so it's honest for
 * any average (5.0 → ★★★★★, 4.0 → ★★★★☆). Pure presentation — pass a number.
 */
const Stars: React.FC<Props> = ({ rating, size = 12, color, emptyColor, style }) => {
    const { theme } = useTheme();
    const p = theme.palette;

    const filled = Math.max(0, Math.min(5, Math.round(rating || 0)));
    const on = color ?? p.accent.main;
    const off = emptyColor ?? withAlpha(p.accent.main, 0.25);

    return (
        <Text
            accessibilityLabel={`${rating} out of 5`}
            style={[{ fontSize: size, letterSpacing: 2 }, style]}
        >
            <Text style={{ color: on }}>{'★'.repeat(filled)}</Text>
            <Text style={{ color: off }}>{'☆'.repeat(5 - filled)}</Text>
        </Text>
    );
};

export default Stars;