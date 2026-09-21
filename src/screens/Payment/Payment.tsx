import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../context/ThemeContext';
import { nightsBetween } from '../../utils/date';
import { getPropertyById, POLICY_URLS } from '../../constants/data';
import { calculateStayPrice } from '../../utils/pricing';
import type { RootStackParamList } from '../../navigation/types';
import { STACK_ROUTES } from '../../navigation/routes';

import Header from '../../components/Headers/Header';
import Button from '../../components/Buttons/Button';
import ReservationSummary from './components/ReservationSummary';
import TermsCheckboxes from './components/TermsCheckboxes';
import { styles } from './styles';
import PaymentCard from './components/PaymentCard';
import WebViewModal from '../../components/Modals/WebViewModal';

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
    const price = calculateStayPrice(property, nights, booking.adults, booking.pets);

    const [cardComplete, setCardComplete] = useState<boolean>(false);
    const [cardholderName, setCardholderName] = useState<string>('');
    const [policy, setPolicy] = useState<{ title: string; url: string } | null>(null);

    const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
    const [acceptPrivacy, setAcceptPrivacy] = useState<boolean>(false);
    const canBook = acceptTerms && acceptPrivacy && cardComplete && cardholderName.trim().length > 0;

    const onBookNow = () => {
        if (!canBook) return;
        // Static phase: mock a booking reference. Later: Cloud Function → Stripe → confirm.
        const bookingRef = `RA-${Date.now().toString().slice(-8)}`;
        navigation.replace(STACK_ROUTES.BookingConfirmed, { ...booking, bookingRef });
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
                    total={price.total}
                />

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