import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../context/ThemeContext';
import { nightsBetween } from '../../utils/date';
import { getPropertyById, POLICY_URLS } from '../../constants/data';
import { calculateStayPrice } from '../../utils/pricing';
import type { RootStackParamList } from '../../navigation/types';
import { DRAWER_ROUTES, STACK_ROUTES } from '../../navigation/routes';
import { typography, spacing } from '../../theme';

import Text from '../../components/Text/Text';
import Icon from '../../components/Icon/Icon';
import EmptyState from '../../components/EmptyState/EmptyState';
import Header from '../../components/Headers/Header';
import Button from '../../components/Buttons/Button';
import ReservationSummary from './components/ReservationSummary';
import TermsCheckboxes from './components/TermsCheckboxes';
import { styles } from './styles';
import PaymentCard from './components/PaymentCard';
import WebViewModal from '../../components/Modals/WebViewModal';
import { useOwcalSummary } from '../../hooks/useOwcalSummary';
import { owVerifyCoupon } from '../../api/owcal';
import CouponCard from './components/CouponCard';
import { useCheckoutConfig } from '../../hooks/useCheckoutConfig';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ScreenRoute = RouteProp<RootStackParamList, typeof STACK_ROUTES.PaymentReview>;

const Payment: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const route = useRoute<ScreenRoute>();
    const { theme } = useTheme();
    const p = theme.palette;

    const booking = route.params;
    const property = getPropertyById(booking.propertyId);

    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const nights = nightsBetween(checkIn, checkOut);
    const guests = booking.adults + booking.children;

    // Coupon — checked with OWcal; once applied, its id goes into the price request below.
    const [coupon, setCoupon] = useState<{ code: string; id: string; label?: string } | null>(null);
    const [couponChecking, setCouponChecking] = useState<boolean>(false);
    const [couponError, setCouponError] = useState<string | null>(null);

    const priceState = useOwcalSummary({
        accomId: property.owAccomId,
        checkIn: booking.checkIn,     // already ISO strings from the nav params
        checkOut: booking.checkOut,
        adults: booking.adults,
        children: booking.children,
        pets: booking.pets,
        couponId: coupon?.id ?? null, // OWcal takes the coupon off the total itself
    });
    const total = priceState.summary?.total ?? 0;
    const priceReady = !priceState.loading && !!priceState.summary?.ok;

    // OWcal's coupon discount, and the price before it (shown crossed out).
    const couponAmount = coupon ? priceState.summary?.couponAmount ?? null : null;
    const originalTotal = couponAmount ? total + couponAmount : undefined;

    // "Apply": ask OWcal if the code is valid for this property and these dates.
    const onApplyCoupon = async (code: string) => {
        setCouponChecking(true);
        setCouponError(null);
        try {
            const result = await owVerifyCoupon({
                code,
                accomId: property.owAccomId,
                checkIn: booking.checkIn,
                checkOut: booking.checkOut,
            });
            if (result.valid && result.couponId) {
                setCoupon({ code: code.toUpperCase(), id: result.couponId, label: result.label });
            } else {
                setCouponError(result.message);
            }
        } finally {
            setCouponChecking(false);
        }
    };

    const [cardComplete, setCardComplete] = useState<boolean>(false);
    const [cardholderName, setCardholderName] = useState<string>('');
    const [policy, setPolicy] = useState<{ title: string; url: string } | null>(null);

    const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
    const [acceptPrivacy, setAcceptPrivacy] = useState<boolean>(false);

    // Is in-app booking on, and is Stripe ready (with the site's own key)?
    const { state: payment, retry: retryPayment } = useCheckoutConfig();

    const canBook = acceptTerms && acceptPrivacy && cardComplete && cardholderName.trim().length > 0 && priceReady // ← + priceReady
        && payment.status === 'ready';

    const goContact = () => navigation.navigate(STACK_ROUTES.DrawerRoot, { screen: DRAWER_ROUTES.Contact });

    const onBookNow = () => {
        if (!canBook) return;
        // Static phase: mock a booking reference. Later: Cloud Function → Stripe → confirm.
        const bookingRef = `RA-${Date.now().toString().slice(-8)}`;
        // Carry the REAL OWcal total through so BookingConfirmed shows the charged amount. ← CHANGED
        navigation.replace(STACK_ROUTES.BookingConfirmed, { ...booking, bookingRef, total });
    };

    return (
        <View style={[styles.container, { backgroundColor: p.background.default }]}>
            <Header title="Payment & Review" onBack={() => navigation.goBack()} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <ReservationSummary
                    property={property}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    nights={nights}
                    guests={guests}
                    pets={booking.pets}
                    total={total}
                    originalTotal={originalTotal}
                    loading={priceState.loading}   // ← new
                />

                <CouponCard
                    applied={coupon}
                    discount={couponAmount}
                    checking={couponChecking}
                    error={couponError}
                    onApply={onApplyCoupon}
                    onRemove={() => setCoupon(null)}
                    onCodeChange={() => setCouponError(null)}
                />

                {/* Payment — shown only once the site says booking is on and Stripe is ready */}
                {payment.status === 'loading' && (
                    <View style={styles.paymentLoading}>
                        <ActivityIndicator color={p.primary.main} />
                        <Text style={[typography.caption, { color: p.text.placeHolder, marginTop: spacing.sm }]}>
                            Preparing secure payment…
                        </Text>
                    </View>
                )}

                {payment.status === 'off' && (
                    <EmptyState
                        icon="calendar"
                        title="Coming Soon to the App"
                        message="Booking and paying in the app isn't available just yet. Our concierge will be happy to book these dates for you."
                        actionLabel="Contact Concierge"
                        onAction={goContact}
                    />
                )}

                {payment.status === 'error' && (
                    <EmptyState
                        icon="alert"
                        title="Couldn't Load Payment"
                        message="Please check your connection and try again."
                        actionLabel="Try Again"
                        onAction={retryPayment}
                        helpText="Need assistance?"
                        helpActionLabel="Contact Concierge"
                        onHelp={goContact}
                    />
                )}

                {payment.status === 'ready' && (
                    <>
                        {/* Test mode (site switch = 'test'): only Stripe test cards work */}
                        {payment.mode === 'test' && (
                            <View style={[styles.stripeNote, styles.testModeNote]}>
                                <Icon name="info" size={14} color={p.warning.main} />
                                <Text style={[typography.caption, { color: p.warning.main, flexShrink: 1 }]}>
                                    Test mode — use a Stripe test card (e.g. 4242 4242 4242 4242). No real money is taken.
                                </Text>
                            </View>
                        )}

                        <PaymentCard
                            cardholderName={cardholderName}
                            onCardholderNameChange={setCardholderName}
                            onCardChange={setCardComplete}
                        />

                        <TermsCheckboxes
                            acceptTerms={acceptTerms}
                            acceptPrivacy={acceptPrivacy}
                            onToggleTerms={() => setAcceptTerms((v) => !v)}
                            onTogglePrivacy={() => setAcceptPrivacy((v) => !v)}
                            onOpenTerms={() => setPolicy({ title: 'Terms & Conditions', url: POLICY_URLS.terms })}
                            onOpenPrivacy={() => setPolicy({ title: 'Privacy Policy', url: POLICY_URLS.privacy })}
                        />

                        <Button title="Book Now" rightIcon="arrow-right" disabled={!canBook} onPress={onBookNow} />
                    </>
                )}
            </ScrollView>

            <WebViewModal
                visible={!!policy}
                title={policy?.title ?? ''}
                url={policy?.url ?? null}
                onClose={() => setPolicy(null)}
            />
        </View>
    );
};

export default Payment;