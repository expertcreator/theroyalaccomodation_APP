import React from 'react';
import { View, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import Text from '../Text/Text';

const DiamondDivider: React.FC = () => {
    const { theme } = useTheme();
    const p = theme.palette;
    const line = { width: moderateScale(48), height: 1, backgroundColor: p.divider };
    return (
        <View style={styles.row}>
            <View style={line} />
            <Text style={{ color: p.accent.main, fontSize: moderateScale(8), marginHorizontal: moderateScale(12), transform: [{ rotate: '45deg' }] }}>◆</Text>
            <View style={line} />
        </View>
    );
};

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' } });
export default DiamondDivider;