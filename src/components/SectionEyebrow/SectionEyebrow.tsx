import React from 'react';
import { View, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { typography } from '../../theme';
import { withAlpha } from '../../utils/color';
import Text from '../Text/Text';

const SectionEyebrow: React.FC<{ label: string }> = ({ label }) => {
    const { theme } = useTheme();
    const p = theme.palette;
    const line = { width: moderateScale(24), height: 1, backgroundColor: withAlpha(p.accent.main, 0.5) };
    return (
        <View style={styles.row}>
            <View style={line} />
            <Text style={[typography.overline, { color: p.accent.main, marginHorizontal: moderateScale(8) }]}>{label}</Text>
            <View style={line} />
        </View>
    );
};

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' } });
export default SectionEyebrow;