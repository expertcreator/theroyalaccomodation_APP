import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing } from '../../../theme';
import { formatGBP } from '../../../utils/format';
import type { OwSummary } from '../../../api/owcal';
import Text from '../../../components/Text/Text';
import { styles } from '../styles';

type Props = {
    summary: OwSummary;   // the live OWcal price for the chosen stay
    nights: number;
    pets: number;
    updating?: boolean;   // a new price is loading → fade the old numbers
};

type Line = { label: string; amount: number };

// "Cleaning Fee" → "Cleaning fee" (matches the app's sentence-case labels).
const sentenceCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

// £ amount, with a minus sign for discounts (formatGBP only handles positives).
const money = (n: number) => (n < 0 ? `−${formatGBP(-n)}` : formatGBP(n));

/** Itemised price for the chosen stay: accommodation, pet fee, fees, total. */
const PriceBreakdown: React.FC<Props> = ({ summary, nights, pets, updating = false }) => {
    const { theme } = useTheme();
    const p = theme.palette;

    // OWcal didn't send a breakdown → show nothing (the total is still in the bottom bar).
    if (summary.accomPrice == null) return null;

    const lines: Line[] = [
        { label: `Accommodation · ${nights} ${nights === 1 ? 'night' : 'nights'}`, amount: summary.accomPrice },
    ];
    if (summary.extrasPrice) {
        const label = pets > 0 ? `Pet fee · ${pets} ${pets === 1 ? 'pet' : 'pets'}` : 'Extras';
        lines.push({ label, amount: summary.extrasPrice });
    }
    summary.fees.forEach((fee) => lines.push({ label: sentenceCase(fee.label), amount: fee.amount }));

    // If OWcal applied something we don't list (e.g. a discount), show the difference
    // so the lines always add up to the real total.
    const listed = lines.reduce((sum, line) => sum + line.amount, 0);
    const difference = Math.round((summary.total - listed) * 100) / 100;
    if (Math.abs(difference) >= 1) {
        lines.push({ label: difference < 0 ? 'Discount' : 'Other charges', amount: difference });
    }

    return (
        <View style={[styles.guestsCard, { backgroundColor: p.background.card, borderColor: p.accent.main, marginTop: spacing.lg, opacity: updating ? 0.4 : 1 }]}>
            <View style={[styles.guestsHeader, { borderBottomColor: p.divider }]}>
                <Text style={[typography.overline, { color: p.text.primary }]}>PRICE BREAKDOWN</Text>
            </View>

            {lines.map((line) => (
                <View key={line.label} style={styles.breakdownRow}>
                    <Text style={[typography.bodySmall, { color: p.text.primary, flex: 1 }]}>{line.label}</Text>
                    <Text style={[typography.bodySmall, { color: p.text.primary }]}>{money(line.amount)}</Text>
                </View>
            ))}

            {/* Total — always the real amount OWcal will charge */}
            <View style={[styles.breakdownRow, styles.breakdownTotal, { borderTopColor: p.divider }]}>
                <Text style={[typography.bodySmall, { color: p.primary.main, fontWeight: '600', flex: 1 }]}>Total</Text>
                <Text style={[typography.bodySmall, { color: p.primary.main, fontWeight: '600' }]}>{formatGBP(summary.total)}</Text>
            </View>
        </View>
    );
};

export default PriceBreakdown;
