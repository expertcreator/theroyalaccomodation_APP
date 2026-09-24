import React from 'react';
import { View, Image, ScrollView } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { typography, spacing, fontSizes } from '../../theme';
import { withAlpha } from '../../utils/color';
import { formatGBP } from '../../utils/format';
import { formatDayLabel, nightsBetween } from '../../utils/date';
import { getPropertyById } from '../../constants/data';
import { calculateStayPrice } from '../../utils/pricing';
import type { RootStackParamList } from '../../navigation/types';
import { STACK_ROUTES, DRAWER_ROUTES } from '../../navigation/routes';

import Text from '../../components/Text/Text';
import Button from '../../components/Buttons/Button';
import Icon from '../../components/Icon/Icon';
import SectionEyebrow from '../../components/SectionEyebrow/SectionEyebrow';
import DiamondDivider from '../../components/Dividers/DiamondDivider';
import { styles } from './styles';
import { moderateScale } from 'react-native-size-matters';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ScreenRoute = RouteProp<RootStackParamList, typeof STACK_ROUTES.BookingConfirmed>;

const STEPS = [
    'A full booking confirmation has been sent to your email.',
    'Your personal concierge will contact you 48 hours before arrival.',
    'Estate access gates and smart-key codes activate on your arrival morning.',
];

const BookingConfirmed: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const route = useRoute<ScreenRoute>();
    const { theme } = useTheme();
    const { user } = useAuth();
    const p = theme.palette;

    const { bookingRef, propertyId, checkIn, checkOut, adults, children, pets } = route.params;
    const property = getPropertyById(propertyId);
    const nights = nightsBetween(new Date(checkIn), new Date(checkOut));
    const guests = adults + children;
    const total = calculateStayPrice(property, nights, adults, pets).total;

    const goHome = () =>
        navigation.reset({ index: 0, routes: [{ name: STACK_ROUTES.DrawerRoot, params: { screen: DRAWER_ROUTES.Home } }] });
    const goMyBookings = () =>
        navigation.reset({ index: 0, routes: [{ name: STACK_ROUTES.DrawerRoot, params: { screen: DRAWER_ROUTES.MyBookings } }] });

    return (
        <View style={[styles.container, { backgroundColor: p.background.default }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Gold-ringed check crest */}
                <View style={[styles.crest, { backgroundColor: p.primary.main, borderColor: p.accent.main }]}>
                    <Icon name="check" size={28} color={p.accent.light} />
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <SectionEyebrow label="Reservation Confirmed" />
                    <Text style={[typography.h2, { color: p.text.primary, marginTop: spacing.sm, textAlign: 'center' }]}>
                        Booking Confirmed
                    </Text>
                    <View style={{ marginTop: spacing.sm }}>
                        <DiamondDivider />
                    </View>
                    <Text style={[typography.caption, styles.ref, { color: p.text.placeHolder }]}>
                        REFERENCE: <Text style={{ color: p.text.primary, fontWeight: '600' }}>{bookingRef}</Text>
                    </Text>
                </View>

                {/* Recap card */}
                <View style={[styles.card, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
                    <Image source={property.image} style={styles.thumb} resizeMode="cover" />
                    <View style={styles.cardBody}>
                        <Text style={[typography.overline, { color: p.accent.dark }]} numberOfLines={1}>{property.tag}</Text>
                        <Text style={[typography.title, { color: p.text.primary, marginTop: spacing.xxs }]} numberOfLines={1}>
                            {property.name}
                        </Text>
                        <Text style={[typography.caption, { color: p.text.placeHolder, marginTop: spacing.xxs }]}>
                            {formatDayLabel(new Date(checkIn))} - {formatDayLabel(new Date(checkOut))} · {nights} {nights === 1 ? 'night' : 'nights'}
                        </Text>
                        <Text style={[typography.caption, { color: p.text.placeHolder }]}>
                            {user?.name ?? 'Lead Guest'} · {guests} {guests === 1 ? 'guest' : 'guests'}
                            {pets > 0 ? ` · ${pets} ${pets === 1 ? 'pet' : 'pets'}` : ''}
                        </Text>
                        <View style={[styles.totalRow, { borderTopColor: p.divider }]}>
                            <Text style={[typography.overline, { color: p.text.placeHolder }]}>TOTAL PAID</Text>
                            <Text style={[typography.title, { color: p.text.primary }]}>{formatGBP(total)}</Text>
                        </View>
                    </View>
                </View>

                {/* Arrival prep */}
                <View style={[styles.stepsCard, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
                    <View style={[styles.stepsHeader, { borderBottomColor: p.divider }]}>
                        <Text style={[typography.overline, { color: p.text.primary }]}>ARRIVAL PREPARATION</Text>
                    </View>
                    {STEPS.map((step, i) => (
                        <View key={i} style={[styles.stepRow, i === STEPS.length - 1 && { marginBottom: 0 }]}>
                            <View style={[styles.stepNum, { backgroundColor: p.background.default, borderColor: withAlpha(p.accent.main, 0.5) }]}>
                                <Text style={{ color: p.accent.dark, fontSize: moderateScale(fontSizes.xxs), fontWeight: '600' }}>{i + 1}</Text>
                            </View>
                            <Text style={[typography.caption, { color: p.text.placeHolder, flex: 1 }]}>{step}</Text>
                        </View>
                    ))}
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <Button title="View My Bookings" rightIcon="arrow-right" onPress={goMyBookings} />
                    <Button title="Return to Home" variant="outline" onPress={goHome} />
                </View>
            </ScrollView>
        </View>
    );
};

export default BookingConfirmed;