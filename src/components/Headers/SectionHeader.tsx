import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderWidth } from '../../theme';
import Text from '../Text/Text';

type Props = {
    title: string;       // e.g. "ESTATE AMENITIES"
    rightText?: string;  // e.g. "CONCIERGE SERVICED"
};

const SectionHeader: React.FC<Props> = ({ title, rightText }) => {
    const { theme } = useTheme();
    const p = theme.palette;

    return (
        <View style={styles.row}>
            <View style={styles.left}>
                <View style={[styles.line, { backgroundColor: p.accent.main }]} />
                <Text style={[typography.overline, { color: p.text.primary }]}>{title}</Text>
            </View>

            {!!rightText && (
                <Text style={[typography.overline, { color: p.accent.dark }]}>{rightText}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    left: { flexDirection: 'row', alignItems: 'center' },
    line: { width: spacing.xl, height: borderWidth.thin, marginRight: spacing.sm },
});

export default SectionHeader;