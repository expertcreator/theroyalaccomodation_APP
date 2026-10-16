import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Linking } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { confirmPayment, handleURLCallback, PaymentIntent } from '@stripe/stripe-react-native';

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
import { useAuth } from '../../context/AuthContext';
import DetailsCard, { detailsComplete } from './components/DetailsCard';
import BookingNotice, { Notice } from './components/BookingNotice';
import { startCheckout, confirmCheckout, cancelCheckout, StartedCheckout, ConfirmResult } from '../../firebase/checkout';
import { isoForCountry } from '../../constants/countries';
import { formatGBP } from '../../utils/format';

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

    // The guest's details (from My Profile, editable on this screen).
    const { profile } = useAuth();
    const [editingDetails, setEditingDetails] = useState<boolean>(false);
    const detailsReady = detailsComplete(profile) && !editingDetails; // loaded, complete and saved

    const canBook = acceptTerms && acceptPrivacy && cardComplete && cardholderName.trim().length > 0 && priceReady // ← + priceReady
        && payment.status === 'ready' && detailsReady;

    const goContact = () => navigation.navigate(STACK_ROUTES.DrawerRoot, { screen: DRAWER_ROUTES.Contact });
    const goMyBookings = () => navigation.reset({
        index: 0,
        routes: [{ name: STACK_ROUTES.DrawerRoot, params: { screen: DRAWER_ROUTES.MyBookings } }],
    });

    /* ---------------- Book Now: hold the dates → take the card → confirm ---------------- */

    // The booking started on our plugin (dates held, Stripe payment created). Kept
    // between taps, so a declined card is retried on the SAME payment — no second
    // hold, no second coupon use. `couponCode` is what it was started with.
    type Active = StartedCheckout & { couponCode: string | null };
    const [active, setActive] = useState<Active | null>(null);
    const activeRef = useRef<Active | null>(null);   // for the leave-screen cleanup
    const paidRef = useRef<boolean>(false);          // once paid, never release the hold

    const [stage, setStage] = useState<string | null>(null);   // "Processing payment…" etc. (null = idle)
    const [notice, setNotice] = useState<Notice | null>(null);

    const rememberActive = (next: Active | null) => {
        activeRef.current = next;
        setActive(next);
    };

    // Leaving the screen without paying → free the held dates straight away.
    // (Safe even if it was paid: the plugin checks with Stripe first.)
    const releaseHold = () => {
        if (activeRef.current && !paidRef.current) {
            cancelCheckout(activeRef.current.paymentIntentId);
            activeRef.current = null;   // only once
        }
    };
    // Started the moment the guest leaves (before Check Availability is back in
    // view), so that screen can wait for it and then show those dates as free.
    useEffect(() => navigation.addListener('beforeRemove', releaseHold), [navigation]);
    useEffect(() => releaseHold, []);   // fallback: the screen closed some other way (e.g. sign-out)

    // iOS: the bank's 3-D Secure page sends the guest back with theroyalaccommodation://safepay.
    // Handing it to Stripe closes that page and lets confirmPayment finish. (Android does this itself.)
    useEffect(() => {
        const sub = Linking.addEventListener('url', ({ url }) => {
            handleURLCallback(url);
        });
        return () => sub.remove();
    }, []);

    // The amount the guest will pay. Once a booking has started, it's the plugin's
    // exact figure — what's shown is always what's charged.
    const couponCode = coupon?.code ?? null;
    const startedHere = !!active && active.couponCode === couponCode;
    const amountDue = startedHere ? active!.amount : total;

    // Paid and confirmed (or the bank is still finishing) → Booking Confirmed.
    const goConfirmed = (result: Exclude<ConfirmResult, { kind: 'error' }>, fallbackAmount: number) => {
        paidRef.current = true;
        rememberActive(null);
        navigation.replace(STACK_ROUTES.BookingConfirmed, {
            ...booking,
            bookingRef: result.ref,
            total: result.paid || fallbackAmount,
            paymentPending: result.kind === 'processing',
        });
    };

    // After Stripe took the card: ask the plugin to complete the booking.
    // A dropped connection is retried a few times before we give up.
    const finishBooking = async (paymentIntentId: string, amount: number) => {
        paidRef.current = true;   // the card was charged — never release this hold
        setStage('Confirming your booking…');
        for (let attempt = 1; attempt <= 3; attempt++) {
            const result = await confirmCheckout(paymentIntentId);
            if (result.kind !== 'error') {
                goConfirmed(result, amount);
                return;
            }
            if (result.code === 'not-paid') {
                // Stripe says the money didn't go through after all.
                paidRef.current = false;
                setStage(null);
                setNotice({ kind: 'error', text: result.message });
                return;
            }
            if (result.code !== 'network' && result.code !== 'unavailable') break;
            await new Promise<void>((resolve) => setTimeout(() => resolve(), 2000)); // wait 2 s, then try again
        }
        // Paid, but we couldn't confirm it from here. OWcal completes it on its own.
        setStage(null);
        setNotice({
            kind: 'info',
            text: "Your payment went through — we're finalising your booking. It will appear in My Bookings shortly, and we'll email your confirmation.",
            action: { label: 'Go to My Bookings', onPress: goMyBookings },
        });
    };

    const onBookNow = async () => {
        if (!canBook || stage || !profile) return;
        setNotice(null);

        // 1. Hold the dates and create the payment (or reuse the one started earlier).
        let checkout = startedHere ? active! : null;
        if (!checkout) {
            setStage('Holding your dates…');
            const result = await startCheckout({
                accomId: property.owAccomId,
                checkIn: booking.checkIn,
                checkOut: booking.checkOut,
                adults: booking.adults,
                children: booking.children,
                pets: booking.pets,
                couponCode,
                firstName: profile.firstName,
                lastName: profile.lastName,
                countryIso: isoForCountry(profile.address?.country) ?? '',
                phone: profile.phone,
                address1: profile.address?.line1,
                address2: profile.address?.line2,
                city: profile.address?.city,
                county: profile.address?.county,
                postCode: profile.address?.postCode,
            });

            if (result.kind === 'already-paid') {
                // An earlier attempt for this stay was paid — just complete it.
                await finishBooking(result.paymentIntentId, total);
                return;
            }
            if (result.kind === 'error') {
                setStage(null);
                if (result.code === 'dates-unavailable') {
                    setNotice({ kind: 'error', text: result.message, action: { label: 'Choose Other Dates', onPress: () => navigation.goBack() } });
                } else if (result.code === 'coupon-invalid') {
                    setCoupon(null);                // take it off — the price goes back to normal
                    setCouponError(result.message);
                    setNotice({ kind: 'error', text: `${result.message} Please check the new total and try again.` });
                } else if (result.code === 'checkout-off') {
                    retryPayment();                 // the screen switches to "Coming soon"
                } else {
                    setNotice({ kind: 'error', text: result.message });
                }
                return;
            }

            checkout = { ...result.checkout, couponCode };
            rememberActive(checkout);

            // 2. The price changed since this screen loaded → show the new amount and
            //    let the guest decide. Their next tap pays it (same hold, no new one).
            if (Math.abs(checkout.amount - total) >= 0.01) {
                setStage(null);
                setNotice({
                    kind: 'info',
                    text: `The price changed while you were here — it's now ${formatGBP(checkout.amount, true)}. Please check and tap Pay to continue.`,
                });
                return;
            }
        }

        // 3. Take the card with Stripe (it shows 3-D Secure itself if the bank asks).
        setStage('Processing payment…');
        const address = profile.address;
        const { paymentIntent, error } = await confirmPayment(checkout.clientSecret, {
            paymentMethodType: 'Card',
            paymentMethodData: {
                billingDetails: {
                    name: cardholderName.trim(),
                    email: profile.email,
                    phone: profile.phone ?? undefined,
                    address: {
                        line1: address?.line1 ?? undefined,
                        line2: address?.line2 ?? undefined,
                        city: address?.city ?? undefined,
                        postalCode: address?.postCode ?? undefined,
                        country: isoForCountry(address?.country),
                    },
                },
            },
        });

        if (error) {
            // Declined, cancelled 3-D Secure, etc. The hold stays — fix the card and tap again.
            setStage(null);
            setNotice({
                kind: 'error',
                text: error.code === 'Canceled'
                    ? "Payment cancelled — you haven't been charged."
                    : error.localizedMessage || error.message || 'Your payment could not be processed. Please try another card.',
            });
            return;
        }
        if (paymentIntent?.status !== PaymentIntent.Status.Succeeded && paymentIntent?.status !== PaymentIntent.Status.Processing) {
            setStage(null);
            setNotice({ kind: 'error', text: 'Your payment could not be completed. Please try again.' });
            return;
        }

        // 4. Paid — complete the booking.
        await finishBooking(checkout.paymentIntentId, checkout.amount);
    };

    return (
        <View style={[styles.container, { backgroundColor: p.background.default }]}>
            <Header title="Payment & Review" onBack={() => navigation.goBack()} />

            {/* Keyboard-aware, so the details and card fields are never hidden behind the keyboard */}
            <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                bottomOffset={spacing.xl}
            >
                <ReservationSummary
                    property={property}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    nights={nights}
                    guests={guests}
                    pets={booking.pets}
                    total={amountDue}
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

                        <DetailsCard onEditingChange={setEditingDetails} />

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

                        {notice && <BookingNotice notice={notice} />}

                        <Button
                            title={priceReady ? `Pay ${formatGBP(amountDue, true)}` : 'Book Now'}
                            rightIcon="arrow-right"
                            disabled={!canBook}
                            loading={!!stage}
                            loadingTitle={stage ?? undefined}
                            onPress={onBookNow}
                        />
                    </>
                )}
            </KeyboardAwareScrollView>

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