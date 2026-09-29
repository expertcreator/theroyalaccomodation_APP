import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';

import { useTheme } from '../../context/ThemeContext';
import { typography, spacing } from '../../theme';
import { getPropertyById } from '../../constants/data';
import { toISO, startOfDay, addMonths, nightsBetween } from '../../utils/date';
import type { RootStackParamList } from '../../navigation/types';
import { STACK_ROUTES } from '../../navigation/routes';

import Text from '../../components/Text/Text';
import Header from '../../components/Headers/Header';
import Icon from '../../components/Icon/Icon';
import Calendar from '../../components/Calendar/Calendar';
import DateSummary from './components/DateSummary';
import GuestStepper from './components/GuestStepper';
import BottomBar from './components/BottomBar';
import { styles } from './styles';
import { useAuth } from '../../context/AuthContext';
import { useOwcalSummary } from '../../hooks/useOwcalSummary';
import { useOccupiedDates } from '../../hooks/useOccupiedDates';
import { getOccupiedDatesAPI } from '../../api/raApi';   // ← NEW: fresh re-check on Proceed
import { showToast } from '../../utils/ToastNotifier';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ScreenRoute = RouteProp<RootStackParamList, typeof STACK_ROUTES.CheckAvailability>;

const firstOfThisMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const CheckAvailability: React.FC = () => {

  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const { isLoggedIn } = useAuth();
  const { theme } = useTheme();
  const p = theme.palette;

  const property = getPropertyById(route.params.propertyId);
  const maxGuests = property.stats.guests;
  const minNights = property.pricing.minNights;

  // State
  const [month, setMonth] = useState<Date>(firstOfThisMonth());
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [pets, setPets] = useState<number>(0);
  const [checking, setChecking] = useState<boolean>(false);   // ← NEW: Proceed re-check in flight

  // Real occupied dates — loaded for the viewed month and extended as the user
  // pages the calendar, so far-future bookings (2027, 2028…) show correctly
  // without loading years of data up front.
  const { occupied: occupiedDates } = useOccupiedDates(
    property.owAccomId,
    month
  );

  // O(1) occupied lookups for the rule checks.
  const occupiedSet = useMemo(() => new Set(occupiedDates), [occupiedDates]);

  // True if any night in [start, end) is already booked (can't span it).
  const hasOccupiedInRange = (start: Date, end: Date): boolean => {
    const d = new Date(start);
    while (d < end) {
      if (occupiedSet.has(toISO(d))) return true;
      d.setDate(d.getDate() + 1);
    }
    return false;
  };

  // When occupied data lands, reconcile any selection made before it arrived.
  useEffect(() => {
    if (!checkIn) return;

    // The start day itself is booked → drop the whole selection.
    if (occupiedSet.has(toISO(checkIn))) {
      setCheckIn(null);
      setCheckOut(null);
      showToast('warning', 'That date is already booked — please pick again.');
      return;
    }

    // Start is fine, but the span hits a booked night → drop just the end.
    if (checkOut && hasOccupiedInRange(checkIn, checkOut)) {
      setCheckOut(null);
      showToast('warning', 'Some of those nights are booked — please pick an earlier checkout.');
    }
  }, [occupiedDates]);   // eslint may want checkIn/checkOut/occupiedSet — safe to add

  // Booking rules for tapping a day.
  const handleSelectDay = (date: Date) => {
    const day = startOfDay(date);

    // Start a new range if none started, or if a full range already exists.
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(day);
      setCheckOut(null);
      return;
    }

    // A start exists, choosing the end:
    if (day <= checkIn) {
      setCheckIn(day);          // tapped on/before start → restart here
      setCheckOut(null);
      return;
    }
    if (nightsBetween(checkIn, day) < minNights) return;   // too short → ignore
    if (hasOccupiedInRange(checkIn, day)) {                 // would span a booked night
      setCheckIn(day);          // restart from the tapped day instead
      setCheckOut(null);
      return;
    }
    setCheckOut(day);             // valid end
  };

  const rangeComplete = !!(checkIn && checkOut);
  const nights = rangeComplete ? nightsBetween(checkIn!, checkOut!) : 0;

  // Real price from OWcal (accommodation + fees like the £295 cleaning fee)
  const priceState = useOwcalSummary({
    accomId: property.owAccomId,
    checkIn: checkIn ? toISO(checkIn) : null,
    checkOut: checkOut ? toISO(checkOut) : null,
    adults,
    children,
    pets,                    // ← the pets stepper value
    enabled: rangeComplete,
  });
  const total = priceState.summary?.total ?? 0;
  const priceReady = rangeComplete && !priceState.loading && !!priceState.summary?.ok;

  const totalGuests = adults + children;

  const onProceed = async () => {
    if (!checkIn || !checkOut || checking) return;   // ignore taps while a check is running

    setChecking(true);   // ← button shows the loader from here
    try {
      // Fresh, authoritative-enough re-check for THIS exact range: covers stale or
      // not-yet-loaded calendar data, and anything booked by someone else meanwhile.
      const freshOccupied = await getOccupiedDatesAPI(
        property.owAccomId,
        toISO(checkIn),
        toISO(checkOut),
      );
      const set = new Set(freshOccupied);
      let spansBooked = false;
      const d = new Date(checkIn);
      while (d < checkOut) {
        if (set.has(toISO(d))) { spansBooked = true; break; }
        d.setDate(d.getDate() + 1);
      }
      if (spansBooked) {
        setCheckOut(null);   // those nights are taken — make the user re-pick
        showToast('warning', 'Those dates were just booked — please pick again.');
        return;
      }

      const booking = {
        propertyId: property.id,
        checkIn: toISO(checkIn),
        checkOut: toISO(checkOut),
        adults,
        children,
        pets,
      };

      if (isLoggedIn) {
        navigation.navigate(STACK_ROUTES.PaymentReview, booking);
      } else {
        navigation.navigate(STACK_ROUTES.LoginRegister, { entry: 'booking', booking });
      }
    } finally {
      setChecking(false);   // clear the loader (screen stays mounted under Payment)
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: p.background.default }]}>
      <Header title={property.name} onClose={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Title block */}
        <View style={styles.titleBlock}>
          <Text style={[typography.overline, { color: p.accent.main }]}>RESIDENCE RESERVATION</Text>
          <Text style={[typography.h2, { color: p.text.primary, marginTop: spacing.xs }]}>CHECK AVAILABILITY</Text>
          <LinearGradient
            colors={['transparent', p.accent.main, 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.goldDivider}
          />
        </View>

        <DateSummary checkIn={checkIn} checkOut={checkOut} nights={nights} />

        <Calendar
          month={month}
          checkIn={checkIn}
          checkOut={checkOut}
          occupiedDates={occupiedDates}
          onSelectDay={handleSelectDay}
          onChangeMonth={(dir) => setMonth(addMonths(month, dir))}
        />

        {/* Min-stay notice */}
        <View style={styles.minStay}>
          <Icon name="info" size={14} color={p.accent.main} />
          <Text style={[typography.overline, { color: p.text.placeHolder }]}>
            MINIMUM STAY {minNights} NIGHTS
          </Text>
        </View>

        {/* Guests */}
        <View style={[styles.guestsCard, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
          <View style={[styles.guestsHeader, { borderBottomColor: p.divider }]}>
            <Text style={[typography.overline, { color: p.text.primary }]}>GUESTS</Text>
            <Text style={[typography.caption, { color: p.text.placeHolder }]}>Up to {maxGuests} guests allowed</Text>
          </View>

          <GuestStepper
            label="Adults"
            sublabel="Ages 13 and above"
            value={adults}
            onDecrement={() => setAdults((n) => Math.max(1, n - 1))}
            onIncrement={() => setAdults((n) => n + 1)}
            canDecrement={adults > 1}
            canIncrement={totalGuests < maxGuests}
          />

          <GuestStepper
            label="Children"
            sublabel="Ages 2 to 12 years"
            value={children}
            onDecrement={() => setChildren((n) => Math.max(0, n - 1))}
            onIncrement={() => setChildren((n) => n + 1)}
            canDecrement={children > 0}
            canIncrement={totalGuests < maxGuests}
          />
        </View>

        {/* Pets — separate card; not counted in guests, max 2, flat £295 each */}
        <View style={[styles.guestsCard, { backgroundColor: p.background.card, borderColor: p.borderColor, marginTop: spacing.lg }]}>
          <View style={[styles.guestsHeader, { borderBottomColor: p.divider }]}>
            <Text style={[typography.overline, { color: p.text.primary }]}>PETS</Text>
            <Text style={[typography.caption, { color: p.text.placeHolder }]}>£295 per pet · max 2</Text>
          </View>

          <GuestStepper
            label="Pets"
            sublabel="Charged £295 each"
            value={pets}
            onDecrement={() => setPets((n) => Math.max(0, n - 1))}
            onIncrement={() => setPets((n) => Math.min(2, n + 1))}
            canDecrement={pets > 0}
            canIncrement={pets < 2}
          />
        </View>

      </ScrollView>

      <BottomBar
        total={total}
        nights={nights}
        rangeComplete={rangeComplete}
        loading={priceState.loading}   // ← price only again (not combined with checking)
        priceReady={priceReady}
        submitting={checking}          // ← NEW: drives the Proceed button's loader
        onProceed={onProceed}
      />
    </View>
  );
};

export default CheckAvailability;