import React from 'react';
import { TouchableOpacity, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { typography, radius, spacing, borderWidth } from '../../theme';
import Text from '../Text/Text';
import Icon, { IconName } from '../Icon/Icon';

type Variant = 'primary' | 'outline';

type Props = {
    title: string;
    onPress: () => void;
    variant?: Variant;
    rightIcon?: IconName;      // e.g. 'arrow-right' (rendered gold)
    fullWidth?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
};

const Button: React.FC<Props> = ({
    title, onPress, variant = 'primary', rightIcon, fullWidth = true, disabled, style,
}) => {
    const { theme } = useTheme();
    const p = theme.palette;
    const isOutline = variant === 'outline';

    const bg = isOutline ? p.transparent : p.primary.main;
    const textColor = isOutline ? p.primary.main : p.primary.contrastText;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={title}
            style={[
                styles.base,
                { backgroundColor: bg, borderWidth: isOutline ? borderWidth.thin : 0, borderColor: p.primary.main },
                fullWidth && { alignSelf: 'stretch' },
                disabled && { opacity: 0.5 },
                style,
            ]}
        >
            <Text style={[typography.button, { color: textColor }]}>{title}</Text>
            {rightIcon && (
                <View style={{ marginLeft: spacing.sm }}>
                    <Icon name={rightIcon} size={16} color={p.accent.main} />
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.pill,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
    },
});

export default Button;