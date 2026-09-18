import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing } from '../../../theme';
import { withAlpha } from '../../../utils/color';
import { formatGBP } from '../../../utils/format';
import { formatDateRange, nightsBetween } from '../../../utils/date';
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
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const nights = nightsBetween(checkIn, checkOut);
    const guests = booking.adults + booking.children;
    const isUpcoming = booking.status === 'upcoming';

    // Status-driven badge + footer copy.
    const badgeColor = isUpcoming ? p.success.main : p.text.placeHolder;
    const badgeLabel = isUpcoming ? 'UPCOMING' : 'PAST STAY';
    const footerText = isUpcoming ? 'Payment settled' : 'Completed stay';

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
                        <Text style={[typography.caption, { color: p.text.placeHolder }]}>{booking.ref}</Text>
                    </View>

                    <Text style={[typography.title, { color: p.primary.main }]} numberOfLines={1}>
                        {property.name}
                    </Text>

                    <View style={styles.locationRow}>
                        <Icon name="map-pin" size={12} color={p.accent.main} />
                        <Text style={[typography.caption, { color: p.text.placeHolder }]}>{property.location}, Berkshire</Text>
                    </View>

                    {/* divider */}
                    <View style={[styles.metaDivider, { backgroundColor: p.divider }]} />

                    <View style={styles.metaRow}>
                        <View>
                            <Text style={[typography.caption, { color: p.text.primary }]}>
                                {formatDateRange(checkIn, checkOut)} · {nights} {nights === 1 ? 'Night' : 'Nights'}
                            </Text>
                            <Text style={[typography.caption, { color: p.text.placeHolder, marginTop: spacing.xxs }]}>
                                {guests} {guests === 1 ? 'guest' : 'guests'}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[typography.overline, { color: p.text.placeHolder }]}>TOTAL PAID</Text>
                            <Text style={[typography.title, { color: p.primary.main, marginTop: spacing.xxs }]}>
                                {formatGBP(booking.totalPaid)}
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
                    <Text style={[typography.overline, { color: p.primary.main }]}>VIEW SUMMARY</Text>
                    <Icon name="arrow-right" size={13} color={p.accent.main} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default BookingCard;