import React, { useCallback, useState } from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { typography, spacing } from '../../theme';
import { DRAWER_ROUTES, STACK_ROUTES } from '../../navigation/routes';
import type { DrawerParamList } from '../../navigation/types';
import type { Booking, BookingStatus } from '../../interfaces/booking';
import { loadMyBookings } from '../../firebase/bookings';
import { authErrorMessage } from '../../firebase/authErrors';
import { showToast } from '../../utils/ToastNotifier';

import Text from '../../components/Text/Text';
import Header from '../../components/Headers/Header';
import DiamondDivider from '../../components/Dividers/DiamondDivider';
import EmptyState from '../../components/EmptyState/EmptyState';
import BookingSummaryModal from '../../components/Modals/BookingSummaryModal';
import BookingCard from './components/BookingCard';
import { styles } from './styles';

type Nav = DrawerNavigationProp<DrawerParamList>;
type Filter = 'all' | BookingStatus;

// What the screen is showing right now.
type ScreenState = 'loading' | 'ready' | 'not-verified' | 'failed';
const MyBookings: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const { theme } = useTheme();
    const { profile, resendVerification, reloadEmailVerified } = useAuth();
    const p = theme.palette;

    const [filter, setFilter] = useState<Filter>('all');
    const [selected, setSelected] = useState<Booking | null>(null);

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [screenState, setScreenState] = useState<ScreenState>('loading');
    const [refreshing, setRefreshing] = useState(false);

    // Fetch the guest's bookings (via the plugin's /me/bookings route) and update the screen.
    const load = useCallback(async () => {
        const result = await loadMyBookings();
        console.log("result - ", result)
        if (result.ok) {
            setBookings(result.bookings);
            setScreenState('ready');
        } else {
            setScreenState(result.reason === 'email-not-verified' ? 'not-verified' : 'failed');
        }
    }, []);

    // Reload every time the screen comes into view (e.g. right after a new booking).
    useFocusEffect(
        useCallback(() => {
            setScreenState("loading")
            load();
        }, [load])
    );

    // Pull-to-refresh.
    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    // "Try Again" after an error.
    const retry = async () => {
        setScreenState('loading');
        await load();
    };

    // "I've Verified" — refresh the verified flag, then try loading again.
    const onIveVerified = async () => {
        setScreenState('loading');
        await reloadEmailVerified().catch(() => { }); // also updates the badge on My Profile
        await load();
    };

    // "Resend" — send the verification email again.
    const onResend = async () => {
        try {
            await resendVerification();
            showToast('success', 'Verification email sent. Check your inbox.');
        } catch (error) {
            showToast('danger', authErrorMessage(error));
        }
    };

    // Counts for the tab labels.
    const upcoming = bookings.filter((b) => b.status === 'upcoming');
    const past = bookings.filter((b) => b.status === 'past');

    const tabs: { key: Filter; label: string; count: number }[] = [
        { key: 'all', label: 'All Stays', count: bookings.length },
        { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
        { key: 'past', label: 'Past', count: past.length },
    ];

    const visible = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

    const goHome = () =>
        navigation.reset({ index: 0, routes: [{ name: DRAWER_ROUTES.Home }] });
    // Contact on top (root stack), so Back returns here, not to the drawer's Home.
    const goContact = () => navigation.getParent()?.navigate(STACK_ROUTES.ContactStack);

    // Main content for each screen state.
    const renderContent = () => {
        if (screenState === 'loading') {
            return <ActivityIndicator size="large" color={p.primary.main} style={{ marginTop: spacing.xxxl }} />;
        }

        if (screenState === 'not-verified') {
            const emailText = profile?.email ? ` (${profile.email})` : '';
            return (
                <EmptyState
                    icon="mail"
                    title="Verify Your Email"
                    message={`To keep your bookings private, please verify your email address${emailText} using the link we sent you.`}
                    actionLabel="I've Verified"
                    onAction={onIveVerified}
                    helpText="Didn't get the email?"
                    helpActionLabel="Resend"
                    onHelp={onResend}
                />
            );
        }

        if (screenState === 'failed') {
            return (
                <EmptyState
                    icon="alert"
                    title="Couldn't Load Bookings"
                    message="Please check your connection and try again."
                    actionLabel="Try Again"
                    onAction={retry}
                    helpText="Need assistance?"
                    helpActionLabel="Contact Concierge"
                    onHelp={goContact}
                />
            );
        }

        return (
            <>
                {/* Filter tabs */}
                <View style={[styles.tabs, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
                    {tabs.map((t) => {
                        const active = t.key === filter;
                        return (
                            <View
                                key={t.key}
                                style={[styles.tab, active && { backgroundColor: p.primary.main }]}
                                onTouchEnd={() => setFilter(t.key)}
                            >
                                <Text style={[typography.overline, { color: active ? p.accent.light : p.text.placeHolder }]}>
                                    {t.label} ({t.count})
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* List or empty state */}
                {visible.length > 0 ? (
                    visible.map((b) => (
                        <BookingCard key={b.ref} booking={b} onViewSummary={() => setSelected(b)} />
                    ))
                ) : (
                    <EmptyState
                        icon="calendar"
                        title="No Bookings Yet"
                        message="When you reserve a stay at our royal estates in Windsor or Ascot, your reservation details will appear here."
                        actionLabel="Browse Properties"
                        onAction={goHome}
                        helpText="Need assistance?"
                        helpActionLabel="Contact Concierge"
                        onHelp={goContact}
                    />
                )}
            </>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: p.background.default }]}>
            <Header title="My Bookings" onBack={() => navigation.goBack()} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={p.accent.main}      // iOS spinner
                        colors={[p.primary.main]}      // Android spinner
                    />
                }
            >
                {renderContent()}
            </ScrollView>

            {/* Summary modal */}
            <BookingSummaryModal
                booking={selected}
                onClose={() => setSelected(null)}
                onContact={() => { setSelected(null); goContact(); }}
            />
        </View>
    );
};

export default MyBookings;
