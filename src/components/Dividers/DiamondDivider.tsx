import React from 'react';
import { View, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { spacing, borderWidth } from '../../theme';
import Text from '../Text/Text';

const DiamondDivider: React.FC = () => {
    const { theme } = useTheme();
    const p = theme.palette;
    const line = { width: spacing.xxxl, height: borderWidth.thin, backgroundColor: p.divider };
    return (
        <View style={styles.row}>
            <View style={line} />
            <Text style={{ color: p.accent.main, fontSize: moderateScale(8), marginHorizontal: spacing.md, transform: [{ rotate: '45deg' }] }}>◆</Text>
            <View style={line} />
        </View>
    );
};

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' } });
export default DiamondDivider;