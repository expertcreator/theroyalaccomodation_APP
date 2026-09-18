import React from 'react';
import { Modal, View, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radius, borderWidth } from '../../theme';
import { formatGBP } from '../../utils/format';
import { formatDateRange, nightsBetween } from '../../utils/date';
import { getPropertyById } from '../../constants/data';
import Text from '../Text/Text';
import Icon from '../Icon/Icon';
import Button from '../Buttons/Button';
import type { Booking } from '../../interfaces/booking';

type Props = {
    booking: Booking | null;     // null = hidden
    onClose: () => void;
    onContact: () => void;
};

const BookingSummaryModal: React.FC<Props> = ({ booking, onClose, onContact }) => {
    const { theme } = useTheme();
    const p = theme.palette;

    if (!booking) return null;

    const property = getPropertyById(booking.propertyId);
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const nights = nightsBetween(checkIn, checkOut);
    const guests = booking.adults + booking.children;
    const isUpcoming = booking.status === 'upcoming';

    const Row = ({ label, value }: { label: string; value: string }) => (
        <View style={styles.row}>
            <Text style={[typography.caption, { color: p.text.placeHolder }]}>{label}</Text>
            <Text style={[typography.bodySmall, { color: p.text.primary, fontWeight: '600' }]}>{value}</Text>
        </View>
    );

    return (
        <Modal visible transparent animationType="fade" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
            <ScrollView
                style={[styles.overlay, { backgroundColor: p.modalBackDrop }]}
                contentContainerStyle={styles.overlayContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={[styles.card, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
                    {/* Close */}
                    <TouchableOpacity onPress={onClose} hitSlop={8} style={[styles.close, { borderColor: p.borderColor }]}>
                        <Icon name="close" size={16} color={p.primary.main} />
                    </TouchableOpacity>

                    {/* Crest */}
                    <View style={[styles.crest, { backgroundColor: p.background.default, borderColor: p.accent.main }]}>
                        <Icon name="check" size={22} color={p.accent.main} />
                    </View>

                    <Text style={[typography.overline, { color: p.accent.dark, textAlign: 'center', marginTop: spacing.md }]}>
                        {isUpcoming ? 'RESERVATION CONFIRMED' : 'COMPLETED STAY'}
                    </Text>
                    <Text style={[typography.h2, { color: p.primary.main, textAlign: 'center', marginTop: spacing.xxs }]}>
                        Booking Summary
                    </Text>
                    <Text style={[typography.caption, { color: p.text.placeHolder, textAlign: 'center', marginTop: spacing.xs }]}>
                        Ref: {booking.ref}
                    </Text>

                    {/* Property */}
                    <View style={[styles.propRow, { borderTopColor: p.divider, borderBottomColor: p.divider }]}>
                        <Image source={property.image} style={styles.thumb} resizeMode="cover" />
                        <View style={{ flex: 1 }}>
                            <Text style={[typography.title, { color: p.primary.main }]} numberOfLines={2}>{property.name}</Text>
                            <Text style={[typography.caption, { color: p.text.placeHolder, marginTop: spacing.xxs }]}>
                                {property.location}, Berkshire
                            </Text>
                            <Text style={[typography.caption, { color: isUpcoming ? p.success.main : p.text.placeHolder, marginTop: spacing.xxs }]}>
                                {isUpcoming ? '● Confirmed & Guaranteed' : '● Completed'}
                            </Text>
                        </View>
                    </View>

                    {/* Rows */}
                    <Row label="Dates of stay" value={`${formatDateRange(checkIn, checkOut)} · ${nights} ${nights === 1 ? 'night' : 'nights'}`} />
                    <Row label="Guests" value={`${guests} ${guests === 1 ? 'guest' : 'guests'}`} />
                    <View style={[styles.totalRow, { borderTopColor: p.divider }]}>
                        <Text style={[typography.label, { color: p.primary.main }]}>Total Paid (VAT incl.)</Text>
                        <Text style={[typography.h2, { color: p.primary.main }]}>{formatGBP(booking.totalPaid)}</Text>
                    </View>

                    {/* Actions */}
                    <View style={{ marginTop: spacing.lg, rowGap: spacing.sm }}>
                        <Button title="Close Summary" onPress={onClose} />
                        <Button title="Contact Concierge" variant="outline" onPress={onContact} />
                    </View>
                </View>
            </ScrollView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1 },
    overlayContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.xl2,
        paddingVertical: spacing.xl,   // breathing room top/bottom when it scrolls
    },
    card: { borderRadius: radius.xl, borderWidth: borderWidth.thin, padding: spacing.xl },
    close: {
        position: 'absolute', top: spacing.md, right: spacing.md, zIndex: 2,
        width: moderateScale(32), height: moderateScale(32), borderRadius: radius.pill,
        borderWidth: borderWidth.thin, alignItems: 'center', justifyContent: 'center',
    },
    crest: {
        width: moderateScale(52), height: moderateScale(52), borderRadius: radius.pill,
        borderWidth: borderWidth.thin, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: spacing.sm,
    },
    propRow: {
        flexDirection: 'row', columnGap: spacing.md, alignItems: 'center',
        marginTop: spacing.lg, paddingVertical: spacing.md, borderTopWidth: borderWidth.thin, borderBottomWidth: borderWidth.thin,
    },
    thumb: { width: moderateScale(52), height: moderateScale(52), borderRadius: radius.md },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs, paddingTop: spacing.md, borderTopWidth: borderWidth.thin },
});

export default BookingSummaryModal;