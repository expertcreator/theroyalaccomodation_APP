import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing } from '../../../theme';
import { formatDayLabel } from '../../../utils/date';
import Text from '../../../components/Text/Text';
import Icon from '../../../components/Icon/Icon';
import { styles } from '../styles';

type Props = { checkIn: Date | null; checkOut: Date | null; nights: number };

const DateSummary: React.FC<Props> = ({ checkIn, checkOut, nights }) => {
    const { theme } = useTheme();
    const p = theme.palette;

    const label = (d: Date | null) => (d ? formatDayLabel(d) : 'Select date');

    return (
        <View style={[styles.summaryCard, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
            {/* Check-in */}
            <View style={styles.summaryCol}>
                <Text style={[typography.overline, { color: p.text.placeHolder }]}>CHECK-IN</Text>
                <Text style={[typography.subtitle, { color: p.text.primary, marginTop: spacing.xxs }]}>{label(checkIn)}</Text>
            </View>

            {/* Nights + arrow */}
            <View style={styles.summaryCenter}>
                <View style={[styles.nightsPill, { borderColor: p.accent.main, backgroundColor: p.background.default }]}>
                    <Text style={[typography.overline, { color: p.accent.dark }]}>{nights} {nights === 1 ? 'NIGHT' : 'NIGHTS'}</Text>
                </View>
                <View style={{ marginTop: spacing.xs }}>
                    <Icon name="arrow-right" size={16} color={p.accent.main} />
                </View>
            </View>

            {/* Check-out */}
            <View style={[styles.summaryCol, { alignItems: 'flex-end' }]}>
                <Text style={[typography.overline, { color: p.text.placeHolder }]}>CHECK-OUT</Text>
                <Text style={[typography.subtitle, { color: p.text.primary, marginTop: spacing.xxs }]}>{label(checkOut)}</Text>
            </View>
        </View>
    );
};

export default DateSummary;