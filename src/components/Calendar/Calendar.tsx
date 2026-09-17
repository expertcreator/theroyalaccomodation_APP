import React, { useCallback, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radius, borderWidth, IThemePalette } from '../../theme';
import { withAlpha } from '../../utils/color';
import { buildMonthGrid, toISO, isSameDay, startOfDay, formatMonthLabel } from '../../utils/date';
import Text from '../Text/Text';
import Icon from '../Icon/Icon';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const COL = `${100 / 7}%`; // 7 equal columns

type Props = {
    month: Date;                 // first day of the visible month
    checkIn: Date | null;
    checkOut: Date | null;
    occupiedDates: string[];     // ISO 'YYYY-MM-DD'
    onSelectDay: (date: Date) => void;
    onChangeMonth: (direction: -1 | 1) => void;
};

/* ============================================================
   One day cell. Memoised: React skips re-rendering a cell whose
   props haven't changed, so tapping a date only re-renders the
   handful of cells that actually change state.
   ============================================================ */
type DayProps = {
    date: Date;
    isCheckIn: boolean;
    isCheckOut: boolean;
    isInRange: boolean;
    isOccupied: boolean;
    isPast: boolean;
    rangeComplete: boolean;      // both check-in AND check-out chosen
    palette: IThemePalette;      // stable ref, so memo stays effective
    onPress: (date: Date) => void;
};

const Day = React.memo(function Day({
    date, isCheckIn, isCheckOut, isInRange, isOccupied, isPast, rangeComplete, palette: p, onPress,
}: DayProps) {
    const isEnd = isCheckIn || isCheckOut;         // the green pill days
    const disabled = isOccupied || isPast;
    const gold = withAlpha(p.accent.main, 0.22);   // soft gold range fill

    // Text colour depends on the day's state.
    let textColor = p.text.primary;
    if (isEnd) textColor = p.primary.contrastText;
    else if (isOccupied) textColor = p.text.placeHolder;
    else if (isPast) textColor = withAlpha(p.text.placeHolder, 0.5);
    else if (isInRange) textColor = p.primary.main;

    return (
        <View style={styles.cell}>
            {/* Gold band behind the range. In-range = full width; the two
                ends show a half-band pointing toward the range so it connects. */}
            {isInRange && <View style={[StyleSheet.absoluteFill, { backgroundColor: gold }]} />}
            {isCheckIn && rangeComplete && <View style={[styles.halfRight, { backgroundColor: gold }]} />}
            {isCheckOut && <View style={[styles.halfLeft, { backgroundColor: gold }]} />}

            <TouchableOpacity
                disabled={disabled}
                activeOpacity={0.7}
                onPress={() => onPress(date)}
                style={[styles.dayTouch, isEnd && { backgroundColor: p.primary.main, borderRadius: radius.pill }]}
            >
                <Text
                    style={[
                        typography.bodySmall,
                        {
                            color: textColor,
                            fontWeight: isEnd || isInRange ? '600' : '400',
                            textDecorationLine: isOccupied ? 'line-through' : 'none',
                        },
                    ]}
                >
                    {date.getDate()}
                </Text>
            </TouchableOpacity>
        </View>
    );
});

/* Small legend row item. */
const LegendItem = ({ color, label, border, p }: { color: string; label: string; border?: string; p: IThemePalette }) => (
    <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: color, borderWidth: border ? borderWidth.thin : 0, borderColor: border }]} />
        <Text style={[typography.caption, { color: p.primary.main }]}>{label}</Text>
    </View>
);

/* ============================================================ */
const Calendar: React.FC<Props> = ({ month, checkIn, checkOut, occupiedDates, onSelectDay, onChangeMonth }) => {
    const { theme } = useTheme();
    const p = theme.palette;

    const today = useMemo(() => startOfDay(new Date()), []);
    const year = month.getFullYear();
    const monthIdx = month.getMonth();

    // Rebuilt only when the visible month changes.
    const grid = useMemo(() => buildMonthGrid(year, monthIdx), [year, monthIdx]);
    // O(1) occupied lookups instead of scanning an array per cell.
    const occupiedSet = useMemo(() => new Set(occupiedDates), [occupiedDates]);

    const rangeComplete = !!(checkIn && checkOut);

    // Can't browse to months before the current one.
    const canGoPrev =
        year > today.getFullYear() || (year === today.getFullYear() && monthIdx > today.getMonth());

    // Stable so memoised Day cells don't re-render just because the parent did.
    const handlePress = useCallback((date: Date) => onSelectDay(date), [onSelectDay]);

    return (
        <View style={[styles.card, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
            {/* Month navigation */}
            <View style={styles.navRow}>
                <TouchableOpacity disabled={!canGoPrev} onPress={() => onChangeMonth(-1)} hitSlop={8} style={styles.navBtn}>
                    <Icon name="back" size={18} color={canGoPrev ? p.primary.main : withAlpha(p.text.placeHolder, 0.4)} />
                </TouchableOpacity>
                <Text style={[typography.title, { color: p.primary.main }]}>{formatMonthLabel(month)}</Text>
                <TouchableOpacity onPress={() => onChangeMonth(1)} hitSlop={8} style={styles.navBtn}>
                    <Icon name="chevron-right" size={18} color={p.primary.main} />
                </TouchableOpacity>
            </View>

            {/* Weekday header */}
            <View style={styles.weekRow}>
                {WEEKDAYS.map((d, i) => (
                    <Text key={i} style={[typography.overline, styles.weekday, { color: p.text.placeHolder }]}>{d}</Text>
                ))}
            </View>

            {/* Day grid */}
            <View style={styles.grid}>
                {grid.map((date, i) => {
                    if (!date) return <View key={`blank-${i}`} style={styles.cell} />; // padding

                    const iso = toISO(date);
                    return (
                        <Day
                            key={iso}
                            date={date}
                            isCheckIn={!!checkIn && isSameDay(date, checkIn)}
                            isCheckOut={!!checkOut && isSameDay(date, checkOut)}
                            isInRange={rangeComplete && date > checkIn! && date < checkOut!}
                            isOccupied={occupiedSet.has(iso)}
                            isPast={date < today}
                            rangeComplete={rangeComplete}
                            palette={p}
                            onPress={handlePress}
                        />
                    );
                })}
            </View>

            {/* Legend */}
            <View style={[styles.legend, { borderTopColor: p.divider }]}>
                <LegendItem color={p.primary.main} label="Selected" p={p} />
                <LegendItem color={withAlpha(p.accent.main, 0.3)} border={p.accent.main} label="In Range" p={p} />
                <View style={[styles.occupiedTag, { backgroundColor: p.background.default, borderColor: p.borderColor }]}>
                    <View style={[styles.legendDot, { backgroundColor: p.text.placeHolder }]} />
                    <Text style={[typography.overline, { color: p.text.placeHolder }]}>Occupied</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: { borderRadius: radius.xl, borderWidth: borderWidth.thin, padding: spacing.lg },

    navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md, paddingHorizontal: spacing.xs },
    navBtn: { width: moderateScale(32), height: moderateScale(32), alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },

    weekRow: { flexDirection: 'row', marginBottom: spacing.sm },
    weekday: { width: COL, textAlign: 'center' },

    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { width: COL, height: verticalScale(44), alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
    dayTouch: { width: moderateScale(36), height: moderateScale(36), alignItems: 'center', justifyContent: 'center' },

    // Half gold bands for the two range ends.
    halfRight: { position: 'absolute', top: 0, bottom: 0, right: 0, left: '50%' },
    halfLeft: { position: 'absolute', top: 0, bottom: 0, left: 0, right: '50%' },

    legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', columnGap: spacing.lg, marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: borderWidth.thin },
    legendItem: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.xs },
    legendDot: { width: moderateScale(12), height: moderateScale(12), borderRadius: radius.pill },
    occupiedTag: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.pill, borderWidth: borderWidth.thin },
});

export default Calendar;