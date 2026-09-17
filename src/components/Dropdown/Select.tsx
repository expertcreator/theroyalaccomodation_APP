import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radius, borderWidth } from '../../theme';
import Text from '../Text/Text';
import Icon from '../Icon/Icon';

type Props = {
    label: string;
    value: string;
    options: string[];
    onSelect: (option: string) => void;
};

const Select: React.FC<Props> = ({ label, value, options, onSelect }) => {
    const { theme } = useTheme();
    const p = theme.palette;
    const [open, setOpen] = useState(false);

    const choose = (option: string) => {
        onSelect(option);
        setOpen(false);
    };

    return (
        <View>
            <Text style={[typography.overline, { color: p.text.placeHolder, marginBottom: spacing.xs }]}>
                {label}
            </Text>

            {/* The closed field */}
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setOpen(true)}
                style={[styles.field, { backgroundColor: p.background.default, borderColor: p.borderColor }]}
            >
                <Text style={[typography.bodySmall, { color: p.text.primary }]}>{value}</Text>
                <Icon name="chevron-down" size={16} color={p.accent.main} />
            </TouchableOpacity>

            {/* The options popup */}
            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable style={[styles.backdrop, { backgroundColor: p.modalBackDrop }]} onPress={() => setOpen(false)}>
                    <View style={[styles.sheet, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
                        {options.map((option) => {
                            const selected = option === value;
                            return (
                                <TouchableOpacity key={option} activeOpacity={0.7} onPress={() => choose(option)} style={styles.option}>
                                    <Text style={[typography.body, { color: selected ? p.primary.main : p.text.primary, fontWeight: selected ? '600' : '400' }]}>
                                        {option}
                                    </Text>
                                    {selected && <Icon name="chevron-right" size={16} color={p.accent.main} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    field: {
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderWidth: borderWidth.thin, 
        borderRadius: radius.md,
        paddingHorizontal: spacing.md, 
        paddingVertical: spacing.md,
    },
    backdrop: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl2 },
    sheet: { borderRadius: radius.lg, borderWidth: borderWidth.thin, paddingVertical: spacing.xs },
    option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
});

export default Select;