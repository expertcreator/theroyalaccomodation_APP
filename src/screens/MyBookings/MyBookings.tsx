import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';

import { useTheme } from '../../context/ThemeContext';
import { typography, spacing } from '../../theme';
import { BOOKINGS } from '../../constants/data';
import { DRAWER_ROUTES, STACK_ROUTES } from '../../navigation/routes';
import type { DrawerParamList } from '../../navigation/types';
import type { Booking, BookingStatus } from '../../interfaces/booking';

import Text from '../../components/Text/Text';
import Header from '../../components/Headers/Header';
import DiamondDivider from '../../components/Dividers/DiamondDivider';
import EmptyState from '../../components/EmptyState/EmptyState';
import BookingSummaryModal from '../../components/Modals/BookingSummaryModal';
import BookingCard from './components/BookingCard';
import { styles } from './styles';

type Nav = DrawerNavigationProp<DrawerParamList>;
type Filter = 'all' | BookingStatus;

const MyBookings: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const { theme } = useTheme();
    const p = theme.palette;

    const [filter, setFilter] = useState<Filter>('all');
    const [selected, setSelected] = useState<Booking | null>(null);

    // Counts for the tab labels.
    const upcoming = BOOKINGS.filter((b) => b.status === 'upcoming');
    const past = BOOKINGS.filter((b) => b.status === 'past');

    const tabs: { key: Filter; label: string; count: number }[] = [
        { key: 'all', label: 'All Stays', count: BOOKINGS.length },
        { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
        { key: 'past', label: 'Past', count: past.length },
    ];

    const visible = filter === 'all' ? BOOKINGS : BOOKINGS.filter((b) => b.status === filter);

    const goHome = () =>
        navigation.reset({ index: 0, routes: [{ name: DRAWER_ROUTES.Home }] });
    const goContact = () => navigation.navigate(DRAWER_ROUTES.Contact);

    return (
        <View style={[styles.container, { backgroundColor: p.background.default }]}>
            <Header title="My Bookings" onBack={() => navigation.goBack()} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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