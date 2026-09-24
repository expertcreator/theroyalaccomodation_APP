import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, radius, borderWidth } from '../../../theme';
import Text from '../../../components/Text/Text';
import { formatMonthShort, nightsBetween } from '../../../utils/date';
import type { Property } from '../../../interfaces/property';
import type { BookingDraft } from '../../../navigation/types';

type Props = { property: Property; booking: BookingDraft };

const StaySummary: React.FC<Props> = ({ property, booking }) => {
    const { theme } = useTheme();
    const p = theme.palette;

    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const nights = nightsBetween(checkIn, checkOut);
    const guests = booking.adults + booking.children;

    // "18–21 Jun" if same month, else "30 Jun – 2 Jul"
    const sameMonth = checkIn.getMonth() === checkOut.getMonth();
    const dateRange = sameMonth
        ? `${checkIn.getDate()}–${checkOut.getDate()} ${formatMonthShort(checkIn)}`
        : `${checkIn.getDate()} ${formatMonthShort(checkIn)} – ${checkOut.getDate()} ${formatMonthShort(checkOut)}`;

    return (
        <View style={[styles.card, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
            <View style={styles.topRow}>
                <Image source={property.image} style={styles.thumb} resizeMode="cover" />
                <View style={{ flex: 1 }}>
                    <Text style={[typography.overline, { color: p.accent.dark }]}>YOUR STAY</Text>
                    <Text style={[typography.title, { color: p.text.primary, marginTop: spacing.xxs }]}>
                        {property.name}
                    </Text>
                </View>
            </View>

            <View style={[styles.bottomRow, { borderTopColor: p.divider }]}>
                <View>
                    <Text style={[typography.overline, { color: p.text.placeHolder }]}>DATES</Text>
                    <Text style={[typography.bodySmall, { color: p.text.primary, fontWeight: '600', marginTop: spacing.xxs }]}>
                        {dateRange} · {nights} {nights === 1 ? 'Night' : 'Nights'}
                    </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[typography.overline, { color: p.text.placeHolder }]}>GUESTS</Text>
                    <Text style={[typography.bodySmall, { color: p.text.primary, fontWeight: '600', marginTop: spacing.xxs }]}>
                        {guests} {guests === 1 ? 'guest' : 'guests'}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: { borderRadius: radius.lg, borderWidth: borderWidth.thin, padding: spacing.lg, marginBottom: spacing.xl },
    topRow: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.md },
    thumb: { width: moderateScale(52), height: moderateScale(52), borderRadius: radius.sm },
    bottomRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: borderWidth.thin,
    },
});

export default StaySummary;