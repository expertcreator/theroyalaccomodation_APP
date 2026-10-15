import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, radius, borderWidth } from '../../../theme';
import { withAlpha } from '../../../utils/color';
import Text from '../../../components/Text/Text';
import Icon from '../../../components/Icon/Icon';

export type Notice = {
    kind: 'error' | 'info';   // error = red (declined, dates taken…), info = gold (price changed, finalising…)
    text: string;
    action?: { label: string; onPress: () => void };   // e.g. "Choose Other Dates"
};

/** A short message above the Pay button, with an optional action link. */
const BookingNotice: React.FC<{ notice: Notice }> = ({ notice }) => {
    const { theme } = useTheme();
    const p = theme.palette;
    const color = notice.kind === 'error' ? p.error.main : p.accent.dark;

    return (
        <View
            style={{
                flexDirection: 'row',
                columnGap: spacing.sm,
                padding: spacing.md,
                marginBottom: spacing.md,
                borderRadius: radius.md,
                borderWidth: borderWidth.thin,
                borderColor: withAlpha(color, 0.4),
                backgroundColor: withAlpha(color, 0.08),
            }}
        >
            <Icon name={notice.kind === 'error' ? 'alert' : 'info'} size={16} color={color} />
            <View style={{ flex: 1 }}>
                <Text style={[typography.caption, { color: p.text.primary }]}>{notice.text}</Text>
                {notice.action && (
                    <TouchableOpacity onPress={notice.action.onPress} hitSlop={8} style={{ marginTop: spacing.xs }}>
                        <Text style={[typography.caption, { color, fontWeight: '600', textDecorationLine: 'underline' }]}>
                            {notice.action.label}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default BookingNotice;
