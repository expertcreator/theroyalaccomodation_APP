import React from 'react';
import { TouchableOpacity, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { typography, radius, spacing, borderWidth } from '../../theme';
import Text from '../Text/Text';
import Icon, { IconName } from '../Icon/Icon';

type Variant = 'primary' | 'outline';
type Size = 'md' | 'sm';

type Props = {
    title: string;
    onPress: () => void;
    variant?: Variant;
    size?: Size;               // 'md' (default) or 'sm'
    rightIcon?: IconName;
    fullWidth?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
};

const Button: React.FC<Props> = ({
    title, onPress, variant = 'primary', size = 'md', rightIcon, fullWidth = true, disabled, style,
}) => {
    const { theme } = useTheme();
    const p = theme.palette;
    const isOutline = variant === 'outline';
    const isSmall = size === 'sm';

    const bg = isOutline ? p.transparent : p.primary.main;
    const textColor = isOutline ? p.text.primary : p.accent.light;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={title}
            style={[
                styles.base,
                isSmall ? styles.sizeSm : styles.sizeMd,
                {
                    backgroundColor: bg, borderWidth: isOutline ? borderWidth.thin : 0,
                    borderColor: isOutline ? p.text.primary : p.primary.main,
                },
                fullWidth && { alignSelf: 'stretch' },
                disabled && { opacity: 0.5 },
                style,
            ]}
        >
            <Text style={[isSmall ? typography.buttonSmall : typography.button, { color: textColor }]}>{title}</Text>
            {rightIcon && (
                <View style={{ marginLeft: spacing.sm }}>
                    <Icon name={rightIcon} size={isSmall ? 14 : 16} color={p.accent.main} />
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
    },
    sizeMd: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
    sizeSm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
});

export default Button;