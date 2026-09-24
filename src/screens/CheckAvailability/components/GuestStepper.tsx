import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing } from '../../../theme';
import { withAlpha } from '../../../utils/color';
import Text from '../../../components/Text/Text';
import Icon from '../../../components/Icon/Icon';
import { styles } from '../styles';

type Props = {
    label: string;
    sublabel: string;
    value: number;
    onDecrement: () => void;
    onIncrement: () => void;
    canDecrement: boolean;
    canIncrement: boolean;
};

const GuestStepper: React.FC<Props> = ({ label, sublabel, value, onDecrement, onIncrement, canDecrement, canIncrement }) => {
    const { theme } = useTheme();
    const p = theme.palette;

    return (
        <View style={styles.stepperRow}>
            <View>
                <Text style={[typography.label, { color: p.text.primary, textTransform: 'uppercase' }]}>{label}</Text>
                <Text style={[typography.caption, { color: p.text.placeHolder, marginTop: spacing.xxs }]}>{sublabel}</Text>
            </View>

            <View style={styles.stepperControls}>
                {/* Minus — subtle border */}
                <TouchableOpacity
                    onPress={onDecrement}
                    disabled={!canDecrement}
                    activeOpacity={0.7}
                    style={[styles.stepperBtn, { borderColor: p.borderColor, opacity: canDecrement ? 1 : 0.4 }]}
                >
                    <Icon name="minus" size={14} color={p.text.placeHolder} />
                </TouchableOpacity>

                <Text style={[typography.subtitle, styles.stepperValue, { color: p.text.primary }]}>{value}</Text>

                {/* Plus — green border */}
                <TouchableOpacity
                    onPress={onIncrement}
                    disabled={!canIncrement}
                    activeOpacity={0.7}
                    style={[styles.stepperBtn, { borderColor: p.borderColor, opacity: canIncrement ? 1 : 0.4 }]}
                >
                    <Icon name="plus" size={14} color={p.text.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default GuestStepper;