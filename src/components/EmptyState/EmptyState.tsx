import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radius, borderWidth } from '../../theme';
import { withAlpha } from '../../utils/color';
import Text from '../Text/Text';
import Icon, { IconName } from '../Icon/Icon';
import Button from '../Buttons/Button';
import DiamondDivider from '../Dividers/DiamondDivider';

type Props = {
    icon: IconName;
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    helpText?: string;
    helpActionLabel?: string;
    onHelp?: () => void;
};

const EmptyState: React.FC<Props> = ({
    icon, title, message, actionLabel, onAction, helpText, helpActionLabel, onHelp,
}) => {
    const { theme } = useTheme();
    const p = theme.palette;

    return (
        <View style={styles.wrap}>
            <View style={[styles.iconRing, { backgroundColor: p.background.default, borderColor: p.accent.main }]}>
                <Icon name={icon} size={26} color={p.accent.main} />
            </View>

            <View style={{ marginTop: spacing.md }}>
                <DiamondDivider />
            </View>

            <Text style={[typography.h2, { color: p.text.primary, marginTop: spacing.md, textAlign: 'center' }]}>
                {title}
            </Text>
            <Text style={[typography.bodySmall, { color: p.text.placeHolder, marginTop: spacing.sm, textAlign: 'center' }]}>
                {message}
            </Text>

            {!!actionLabel && onAction && (
                <View style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}>
                    <Button title={actionLabel} rightIcon="arrow-right" onPress={onAction} />
                </View>
            )}

            {!!helpText && (
                <View style={styles.helpRow}>
                    <Text style={[typography.caption, { color: p.text.placeHolder }]}>{helpText} </Text>
                    {!!helpActionLabel && onHelp && (
                        <TouchableOpacity onPress={onHelp}>
                            <Text style={[typography.caption, { color: p.accent.dark, textDecorationLine: 'underline' }]}>
                                {helpActionLabel}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
    iconRing: {
        width: moderateScale(64), height: moderateScale(64), borderRadius: radius.pill,
        borderWidth: borderWidth.thin, alignItems: 'center', justifyContent: 'center',
    },
    helpRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
});

export default EmptyState;