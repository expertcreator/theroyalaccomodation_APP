import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing } from '../../../theme';
import { formatGBP } from '../../../utils/format';
import Text from '../../../components/Text/Text';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Buttons/Button';
import { styles } from '../styles';

type Props = {
    applied: { code: string; label?: string } | null;  // the coupon in use, if any
    discount: number | null;   // OWcal's coupon amount, once the new price has loaded
    checking: boolean;         // OWcal is checking the code
    error: string | null;      // e.g. "This coupon code is not valid."
    onApply: (code: string) => void;
    onRemove: () => void;
    onCodeChange: () => void;  // the guest is typing again → clear the old error
};

/** Optional coupon code: enter + Apply, or the applied coupon with its discount and Remove. */
const CouponCard: React.FC<Props> = ({ applied, discount, checking, error, onApply, onRemove, onCodeChange }) => {
    const { theme } = useTheme();
    const p = theme.palette;
    const [code, setCode] = useState('');

    return (
        <View style={[styles.card, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
            <View style={styles.couponHeader}>
                <Text style={[typography.overline, { color: p.accent.dark }]}>COUPON</Text>
                <Text style={[typography.caption, { color: p.text.placeHolder }]}>Optional</Text>
            </View>

            {applied ? (
                <>
                    {/* Applied: the code, what it's worth, and a way to take it off */}
                    <View style={styles.couponRow}>
                        <Text style={[typography.bodySmall, { color: p.success.main, flex: 1 }]}>
                            ✓ {applied.code}{applied.label ? ` · ${applied.label} off` : ''}
                        </Text>
                        <TouchableOpacity onPress={() => { setCode(''); onRemove(); }} hitSlop={8}>
                            <Text style={[typography.bodySmall, { color: p.accent.dark, textDecorationLine: 'underline' }]}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                    {!!discount && (
                        <View style={styles.couponRow}>
                            <Text style={[typography.bodySmall, { color: p.success.main, flex: 1 }]}>Discount</Text>
                            <Text style={[typography.bodySmall, { color: p.success.main }]}>−{formatGBP(discount, true)}</Text>
                        </View>
                    )}
                </>
            ) : (
                <>
                    {/* Not applied yet: type a code and check it with OWcal */}
                    <Input
                        label="COUPON CODE"
                        value={code}
                        // Codes are shown in capitals (OWcal matches them in any case)
                        onChangeText={(text) => { setCode(text.toUpperCase()); if (error) onCodeChange(); }}
                        placeholder="e.g. SUMMER10"
                        autoCapitalize="characters"
                        autoCorrect={false}
                        error={error}
                    />
                    <Button
                        title="Apply"
                        variant="outline"
                        size="sm"
                        disabled={!code.trim()}
                        loading={checking}
                        loadingTitle="Checking…"
                        onPress={() => onApply(code.trim())}
                        style={{ marginTop: spacing.md }}
                    />
                </>
            )}
        </View>
    );
};

export default CouponCard;
