import React from 'react';
import { View, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderWidth } from '../../theme';
import { withAlpha } from '../../utils/color';
import Text from '../Text/Text';

const SectionEyebrow: React.FC<{ label: string }> = ({ label }) => {
    const { theme } = useTheme();
    const p = theme.palette;
    const line = { width: spacing.xl, height: borderWidth.thin, backgroundColor: withAlpha(p.accent.main, 0.5) };
    return (
        <View style={styles.row}>
            <View style={line} />
            <Text style={[typography.overline, { color: p.accent.main, marginHorizontal: spacing.sm }]}>{label}</Text>
            <View style={line} />
        </View>
    );
};

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' } });
export default SectionEyebrow;