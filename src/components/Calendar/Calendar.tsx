import React, { useCallback, useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radius, borderWidth, IThemePalette } from '../../theme';
import { withAlpha } from '../../utils/color';
import { buildMonthGrid, toISO, isSameDay, startOfDay, formatMonthLabel } from '../../utils/date';
import Text from '../Text/Text';
import Icon from '../Icon/Icon';
import type { AvailabilityStatus } from '../../hooks/useOccupiedDates';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const COL = `${100 / 7}%`; // 7 equal columns
const CELL_HEIGHT = verticalScale(44);
const SWATCH = moderateScale(12); // legend swatch size

// Soft pink for booked days (the site's calendar uses the same idea).
const bookedColor = (p: IThemePalette) => withAlpha(p.error.main, 0.22);

/* ------------------------------------------------------------
   Half-day triangles, drawn like the website's calendar.
   Each day is split corner-to-corner:
     top-left half     = the morning   → booked if a guest LEAVES that day
     bottom-right half = the afternoon → booked if a guest ARRIVES that day
   Drawn with the classic "border triangle" trick: a 0×0 box whose two
   borders meet on the diagonal; one border is coloured, the other clear.
   ------------------------------------------------------------ */
const morningTriangle = (width: number, height: number, color: string): ViewStyle => ({
    position: 'absolute', top: 0, left: 0, width: 0, height: 0,
    borderTopWidth: height, borderTopColor: color,
    borderRightWidth: width, borderRightColor: 'transparent',
});

const afternoonTriangle = (width: number, height: number, color: string): ViewStyle => ({
    position: 'absolute', bottom: 0, right: 0, width: 0, height: 0,
    borderBottomWidth: height, borderBottomColor: color,
    borderLeftWidth: width, borderLeftColor: 'transparent',
});

type Props = {
    month: Date;                 // first day of the visible month
    checkIn: Date | null;
    checkOut: Date | null;
    occupiedDates: string[];     // ISO 'YYYY-MM-DD'
    minNights?: number;          // shortest allowed stay (default 1)
    onSelectDay: (date: Date) => void;
    onChangeMonth: (direction: -1 | 1) => void;
    // Are this month's booked dates known yet? (default 'ready')
    //   'loading' / 'error' → the days are faded and can't be tapped, with a message on top.
    status?: AvailabilityStatus;
    updating?: boolean;          // refreshing dates we already have → small spinner by the month name
    onRetry?: () => void;        // "Try Again" when status is 'error'
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
    bookedNight: boolean;        // tonight is booked (a guest arrives or is staying)
    bookedMorning: boolean;      // last night was booked (a guest leaves this morning)
    canCheckOutHere: boolean;    // booked tonight, but a valid check-out for the chosen check-in
    isPast: boolean;
    rangeComplete: boolean;      // both check-in AND check-out chosen
    cellWidth: number;           // measured, so the triangles fit the cell exactly
    palette: IThemePalette;      // stable ref, so memo stays effective
    onPress: (date: Date) => void;
};

const Day = React.memo(function Day({
    date, isCheckIn, isCheckOut, isInRange, bookedNight, bookedMorning, canCheckOutHere,
    isPast, rangeComplete, cellWidth, palette: p, onPress,
}: DayProps) {
    const isEnd = isCheckIn || isCheckOut;         // the selected check-in / check-out days
    const fullyBooked = bookedNight && bookedMorning;

    // Selected on a half-day → fill its FREE half with green instead of a circle.
    const checkInHalf = isCheckIn && bookedMorning;  // a guest leaves that morning, we arrive later
    const checkOutHalf = isCheckOut && bookedNight;  // we leave that morning, the next guest arrives later
    const halfDayEnd = checkInHalf || checkOutHalf;
    const isPill = isEnd && !halfDayEnd;             // every other selected day keeps the green circle
    // A booked night can't be tapped — unless it's the check-out day for the
    // chosen check-in (the guest leaves in the morning, the next one arrives later).
    const disabled = isPast || (bookedNight && !canCheckOutHere);
    const gold = withAlpha(p.accent.main, 0.22);   // soft gold range fill
    const pink = bookedColor(p);

    // Text colour depends on the day's state.
    let textColor = p.text.primary;
    if (isPill) textColor = p.primary.contrastText;
    else if (halfDayEnd) textColor = p.accent.main;   // gold reads on both the green and pink halves
    else if (isPast) textColor = withAlpha(p.text.placeHolder, 0.5);
    else if (disabled) textColor = p.text.placeHolder;

    return (
        <View style={styles.cell}>
            {/* Booked shading: the whole day, or just the morning / afternoon half. */}
            {fullyBooked && <View style={[StyleSheet.absoluteFill, { backgroundColor: pink }]} />}
            {!fullyBooked && bookedMorning && <View style={morningTriangle(cellWidth, CELL_HEIGHT, pink)} />}
            {!fullyBooked && bookedNight && <View style={afternoonTriangle(cellWidth, CELL_HEIGHT, pink)} />}

            {/* Gold band behind the range. In-range = full width; the two
                ends show a half-band pointing toward the range so it connects.
                (Half-day ends skip it — their green triangle already reaches that edge.) */}
            {isInRange && <View style={[StyleSheet.absoluteFill, { backgroundColor: gold }]} />}
            {isCheckIn && rangeComplete && !checkInHalf && <View style={[styles.halfRight, { backgroundColor: gold }]} />}
            {isCheckOut && !checkOutHalf && <View style={[styles.halfLeft, { backgroundColor: gold }]} />}

            {/* Selected half-day: green fills the half that's free for this guest. */}
            {checkInHalf && <View style={afternoonTriangle(cellWidth, CELL_HEIGHT, p.primary.main)} />}
            {checkOutHalf && <View style={morningTriangle(cellWidth, CELL_HEIGHT, p.primary.main)} />}

            <TouchableOpacity
                disabled={disabled}
                activeOpacity={0.7}
                onPress={() => onPress(date)}
                style={[
                    styles.dayTouch,
                    isPill && { backgroundColor: p.primary.main, borderRadius: radius.pill, borderWidth: borderWidth.thin, borderColor: p.accent.main },
                    // Dashed gold ring: "you can check out here" (next guest arrives this day).
                    !isEnd && canCheckOutHere && [styles.checkOutRing, { borderColor: p.accent.main }],
                ]}
            >
                <Text
                    style={[
                        typography.bodySmall,
                        {
                            color: textColor,
                            fontWeight: isEnd || isInRange || canCheckOutHere ? '600' : '400',
                            textDecorationLine: fullyBooked ? 'line-through' : 'none',
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
        <Text style={[typography.caption, { color: p.text.primary }]}>{label}</Text>
    </View>
);

/* Legend item for booked days: a small square, fully or half shaded. */
const LegendBooked = ({ shade, label, p }: { shade: 'full' | 'morning' | 'afternoon'; label: string; p: IThemePalette }) => {
    const pink = bookedColor(p);
    const inner = SWATCH - 2 * borderWidth.thin; // space inside the swatch's border
    return (
        <View style={styles.legendItem}>
            <View style={[styles.swatch, { borderColor: p.borderColor }]}>
                {shade === 'full' && <View style={[StyleSheet.absoluteFill, { backgroundColor: pink }]} />}
                {shade === 'morning' && <View style={morningTriangle(inner, inner, pink)} />}
                {shade === 'afternoon' && <View style={afternoonTriangle(inner, inner, pink)} />}
            </View>
            <Text style={[typography.caption, { color: p.text.primary }]}>{label}</Text>
        </View>
    );
};

/* ============================================================ */
const Calendar: React.FC<Props> = ({ month, checkIn, checkOut, occupiedDates, minNights = 1, onSelectDay, onChangeMonth, status = 'ready', updating = false, onRetry }) => {
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

    // Width of one day cell, measured from the grid, so the half-day triangles fit exactly.
    const [cellWidth, setCellWidth] = useState(0);
    const onGridLayout = (e: LayoutChangeEvent) => setCellWidth(e.nativeEvent.layout.width / 7);

    // While choosing a check-out: the first booked night after the check-in.
    // A guest arrives that day, but it's still a valid check-out day for this
    // stay (one leaves in the morning, the next arrives in the afternoon) —
    // as long as the stay would be at least the minimum number of nights.
    const nextBookedNight = useMemo(() => {
        if (!checkIn || checkOut) return null;
        const start = toISO(checkIn);
        let first: string | null = null;
        for (const iso of occupiedDates) {
            // 'YYYY-MM-DD' strings compare correctly as plain text.
            if (iso > start && (first === null || iso < first)) first = iso;
        }
        if (!first) return null;

        // Too short a stay (e.g. 1 night when the minimum is 2)? Then it can't be the check-out.
        const earliestCheckOut = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate() + minNights);
        return first >= toISO(earliestCheckOut) ? first : null;
    }, [checkIn, checkOut, occupiedDates, minNights]);

    // Can't browse to months before the current one.
    const canGoPrev =
        year > today.getFullYear() || (year === today.getFullYear() && monthIdx > today.getMonth());

    // Stable so memoised Day cells don't re-render just because the parent did.
    const handlePress = useCallback((date: Date) => onSelectDay(date), [onSelectDay]);

    // Booked dates not known yet (or couldn't be loaded) → don't let the guest pick days.
    const blocked = status !== 'ready';

    return (
        <View style={[styles.card, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
            {/* Month navigation */}
            <View style={styles.navRow}>
                <TouchableOpacity disabled={!canGoPrev} onPress={() => onChangeMonth(-1)} hitSlop={8} style={styles.navBtn}>
                    <Icon name="back" size={18} color={canGoPrev ? p.text.primary : withAlpha(p.text.placeHolder, 0.4)} />
                </TouchableOpacity>
                {/* Month name, with a small spinner while dates are being refreshed.
                    The empty slot on the left keeps the name centred. */}
                <View style={styles.monthTitle}>
                    <View style={styles.spinnerSlot} />
                    <Text style={[typography.title, { color: p.text.primary }]}>{formatMonthLabel(month)}</Text>
                    <View style={styles.spinnerSlot}>
                        {updating && <ActivityIndicator size="small" color={p.accent.main} />}
                    </View>
                </View>
                <TouchableOpacity onPress={() => onChangeMonth(1)} hitSlop={8} style={styles.navBtn}>
                    <Icon name="chevron-right" size={18} color={p.text.primary} />
                </TouchableOpacity>
            </View>

            {/* Weekday header */}
            <View style={styles.weekRow}>
                {WEEKDAYS.map((d, i) => (
                    <Text key={i} style={[typography.overline, styles.weekday, { color: p.text.placeHolder }]}>{d}</Text>
                ))}
            </View>

            {/* Day grid — faded and not tappable while the booked dates aren't known */}
            <View>
                <View
                    style={[styles.grid, blocked && styles.gridBlocked]}
                    pointerEvents={blocked ? 'none' : 'auto'}
                    onLayout={onGridLayout}
                >
                    {grid.map((date, i) => {
                        if (!date) return <View key={`blank-${i}`} style={styles.cell} />; // padding

                        const iso = toISO(date);
                        const isPast = date < today;
                        // The day before — if that night was booked, a guest leaves this morning.
                        const prevISO = toISO(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1));
                        return (
                            <Day
                                key={iso}
                                date={date}
                                isCheckIn={!!checkIn && isSameDay(date, checkIn)}
                                isCheckOut={!!checkOut && isSameDay(date, checkOut)}
                                isInRange={rangeComplete && date > checkIn! && date < checkOut!}
                                bookedNight={!isPast && occupiedSet.has(iso)}
                                bookedMorning={!isPast && occupiedSet.has(prevISO)}
                                canCheckOutHere={iso === nextBookedNight}
                                isPast={isPast}
                                rangeComplete={rangeComplete}
                                cellWidth={cellWidth}
                                palette={p}
                                onPress={handlePress}
                            />
                        );
                    })}
                </View>

                {blocked && (
                    <View style={styles.gridMessage} pointerEvents="box-none">
                        <View style={[styles.messagePill, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
                            {status === 'loading' ? (
                                <View style={styles.messageRow}>
                                    <ActivityIndicator size="small" color={p.accent.main} />
                                    <Text style={[typography.caption, { color: p.text.primary }]}>Checking availability…</Text>
                                </View>
                            ) : (
                                <>
                                    <View style={styles.messageRow}>
                                        <Icon name="alert" size={16} color={p.error.main} />
                                        <Text style={[typography.caption, { color: p.text.primary }]}>Couldn't check availability</Text>
                                    </View>
                                    {onRetry && (
                                        <TouchableOpacity onPress={onRetry} hitSlop={8} style={{ marginTop: spacing.xs }}>
                                            <Text style={[typography.caption, { color: p.primary.main, fontWeight: '600', textDecorationLine: 'underline' }]}>
                                                Try Again
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}
                        </View>
                    </View>
                )}
            </View>

            {/* Legend */}
            <View style={[styles.legend, { borderTopColor: p.divider }]}>
                <LegendItem color={p.primary.main} border={p.accent.main} label="Selected" p={p} />
                <LegendItem color={withAlpha(p.accent.main, 0.3)} border={p.accent.main} label="In Range" p={p} />
                <LegendBooked shade="full" label="Booked" p={p} />
                <LegendBooked shade="afternoon" label="Guest arrives" p={p} />
                <LegendBooked shade="morning" label="Guest leaves" p={p} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: { borderRadius: radius.xl, borderWidth: borderWidth.thin, padding: spacing.lg },

    navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md, paddingHorizontal: spacing.xs },
    monthTitle: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.xs },
    spinnerSlot: { width: moderateScale(18), alignItems: 'center' },
    navBtn: { width: moderateScale(32), height: moderateScale(32), alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },

    weekRow: { flexDirection: 'row', marginBottom: spacing.sm },
    weekday: { width: COL, textAlign: 'center' },

    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    gridBlocked: { opacity: 0.35 },
    gridMessage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
    messagePill: { alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: borderWidth.thin },
    messageRow: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.sm },
    cell: { width: COL, height: CELL_HEIGHT, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
    dayTouch: { width: moderateScale(36), height: moderateScale(36), alignItems: 'center', justifyContent: 'center' },
    checkOutRing: { borderRadius: radius.pill, borderWidth: borderWidth.thin, borderStyle: 'dashed' },

    // Half gold bands for the two range ends.
    halfRight: { position: 'absolute', top: 0, bottom: 0, right: 0, left: '50%' },
    halfLeft: { position: 'absolute', top: 0, bottom: 0, left: 0, right: '50%' },

    // Wraps onto two rows on narrow phones.
    legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: spacing.lg, rowGap: spacing.sm, marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: borderWidth.thin },
    legendItem: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.xs },
    legendDot: { width: SWATCH, height: SWATCH, borderRadius: radius.pill },
    swatch: { width: SWATCH, height: SWATCH, borderWidth: borderWidth.thin, overflow: 'hidden' },
});

export default Calendar;