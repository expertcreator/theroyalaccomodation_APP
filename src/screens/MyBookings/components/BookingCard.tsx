import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing } from '../../../theme';
import { withAlpha } from '../../../utils/color';
import { formatGBP, bookingNumber } from '../../../utils/format';
import { formatDateRange, fromISO, nightsBetween } from '../../../utils/date';
import { getPropertyById } from '../../../constants/data';
import Text from '../../../components/Text/Text';
import Icon from '../../../components/Icon/Icon';
import type { Booking } from '../../../interfaces/booking';
import { styles } from '../styles';

type Props = { booking: Booking; onViewSummary: () => void };

const BookingCard: React.FC<Props> = ({ booking, onViewSummary }) => {
    const { theme } = useTheme();
    const p = theme.palette;

    const property = getPropertyById(booking.propertyId);
    const checkIn = fromISO(booking.checkIn);
    const checkOut = fromISO(booking.checkOut);
    const nights = nightsBetween(checkIn, checkOut);
    const guests = booking.adults + booking.children;
    const isUpcoming = booking.status === 'upcoming';

    // Status-driven badge + footer copy.
    const badgeColor = isUpcoming ? p.success.main : p.text.placeHolder;
    const badgeLabel = isUpcoming ? 'UPCOMING' : 'PAST STAY';
    // Upcoming stays show whether anything is still owed.
    const upcomingText = booking.amountToPay > 0 ? `Balance due ${formatGBP(booking.amountToPay)}` : 'Payment settled';
    const footerText = isUpcoming ? upcomingText : 'Completed stay';

    return (
        <View style={[styles.card, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
            <View style={styles.cardTop}>
                <Image source={property.image} style={styles.thumb} resizeMode="cover" />

                <View style={styles.cardBody}>
                    <View style={styles.badgeRow}>
                        <View style={[styles.badge, { backgroundColor: withAlpha(badgeColor, 0.12) }]}>
                            <View style={[styles.badgeDot, { backgroundColor: badgeColor }]} />
                            <Text style={[typography.overline, { color: badgeColor }]}>{badgeLabel}</Text>
                        </View>
                        <Text style={[typography.caption, { color: p.text.placeHolder }]}>{bookingNumber(booking)}</Text>
                    </View>

                    <Text style={[typography.title, { color: p.text.primary }]} numberOfLines={1}>
                        {property.name}
                    </Text>

                    <View style={styles.locationRow}>
                        <Icon name="map-pin" size={12} color={p.accent.main} />
                        <Text style={[typography.caption, { color: p.text.placeHolder }]}>{property.location}, Berkshire</Text>
                    </View>

                    {/* divider */}
                    <View style={[styles.metaDivider, { backgroundColor: p.divider }]} />

                    <View style={styles.metaRow}>
                        {/* Dates on their own line so long ranges ("16–18 Jun 2027") leave room for the total.
                            flex: 1 lets this side shrink/wrap; the total never gets pushed off the card. */}
                        <View style={{ flex: 1, marginRight: spacing.sm }}>
                            <Text style={[typography.caption, { color: p.text.primary }]}>
                                {formatDateRange(checkIn, checkOut)}
                            </Text>
                            <Text style={[typography.caption, { color: p.text.placeHolder, marginTop: spacing.xxs }]}>
                                {nights} {nights === 1 ? 'Night' : 'Nights'} · {guests} {guests === 1 ? 'guest' : 'guests'}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                            <Text style={[typography.overline, { color: p.text.placeHolder }]}>TOTAL PAID</Text>
                            <Text style={[typography.title, { color: p.text.primary, marginTop: spacing.xxs }]}>
                                {formatGBP(booking.paid)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Footer strip */}
            <View style={[styles.footer, { borderTopColor: p.divider }]}>
                <View style={styles.footerLeft}>
                    <Icon name={isUpcoming ? 'check' : 'calendar'} size={13} color={p.accent.main} />
                    <Text style={[typography.caption, { color: p.text.placeHolder }]} numberOfLines={1}>{footerText}</Text>
                </View>
                <TouchableOpacity style={styles.viewSummary} onPress={onViewSummary} activeOpacity={0.7}>
                    <Text style={[typography.overline, { color: p.text.primary }]}>VIEW SUMMARY</Text>
                    <Icon name="arrow-right" size={13} color={p.accent.main} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default BookingCard;