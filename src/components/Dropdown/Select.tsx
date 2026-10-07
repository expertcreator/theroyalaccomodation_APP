import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, Modal, StyleSheet, Pressable, TextInput, FlatList } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radius, borderWidth } from '../../theme';
import Text from '../Text/Text';
import Icon from '../Icon/Icon';

type Props = {
    label: string;
    value: string;
    options: string[];
    onSelect: (option: string) => void;
    searchable?: boolean;    // adds a search box + scrollable list (for long lists like countries)
    placeholder?: string;    // shown when value is empty
    error?: string | null;   // red border + message, matching the Input component
};

const Select: React.FC<Props> = ({ label, value, options, onSelect, searchable = false, placeholder, error }) => {
    const { theme } = useTheme();
    const p = theme.palette;
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    // Case-insensitive filter — only when searchable and the user typed something.
    const visibleOptions = useMemo(() => {
        if (!searchable || !query.trim()) return options;
        const q = query.trim().toLowerCase();
        return options.filter((o) => o.toLowerCase().includes(q));
    }, [options, query, searchable]);

    const openSheet = () => { setQuery(''); setOpen(true); }; // reset search each open
    const choose = (option: string) => {
        onSelect(option);
        setOpen(false);
    };

    // Red border when there's an error, same as Input.
    const fieldBorder = error ? p.error.main : p.borderColor;

    // One option row (shared by both the short list and the searchable list).
    const renderOption = (option: string) => {
        const selected = option === value;
        return (
            <TouchableOpacity key={option} activeOpacity={0.7} onPress={() => choose(option)} style={styles.option}>
                <Text style={[typography.body, { color: p.text.primary, fontWeight: selected ? '600' : '400' }]}>
                    {option}
                </Text>
                {selected && <Icon name="chevron-right" size={16} color={p.accent.main} />}
            </TouchableOpacity>
        );
    };

    return (
        <View>
            <Text style={[typography.overline, { color: p.text.placeHolder, marginBottom: spacing.xs }]}>
                {label}
            </Text>

            {/* The closed field */}
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={openSheet}
                style={[styles.field, { backgroundColor: p.background.default, borderColor: fieldBorder }]}
            >
                <Text style={[typography.bodySmall, { color: value ? p.text.primary : p.text.placeHolder }]}>
                    {value || placeholder || 'Select'}
                </Text>
                <Icon name="chevron-down" size={16} color={p.accent.main} />
            </TouchableOpacity>

            {/* Error message under the field */}
            {!!error && (
                <Text style={[typography.caption, { color: p.error.main, marginTop: spacing.xs }]}>
                    {error}
                </Text>
            )}

            {/* The options popup */}
            <Modal visible={open} transparent animationType="slide" supportedOrientations={['portrait', 'landscape']} onRequestClose={() => setOpen(false)}>
                <Pressable style={[styles.backdrop, { backgroundColor: p.modalBackDrop }]} onPress={() => setOpen(false)}>
                    {/* Inner Pressable swallows taps so touching the sheet/search doesn't close it */}
                    <Pressable
                        style={[
                            styles.sheet,
                            { backgroundColor: p.background.card, borderColor: p.borderColor },
                            searchable && styles.sheetSearchable,
                        ]}
                        onPress={() => { }}
                    >
                        {searchable ? (
                            <>
                                {/* Search box */}
                                <View style={[styles.searchRow, { borderColor: p.borderColor, backgroundColor: p.background.default }]}>
                                    <Icon name="search" size={16} color={p.text.placeHolder} />
                                    <TextInput
                                        value={query}
                                        onChangeText={setQuery}
                                        placeholder="Search…"
                                        placeholderTextColor={p.text.placeHolder}
                                        autoCorrect={false}
                                        style={[styles.searchInput, typography.bodySmall, { color: p.text.primary }]}
                                    />
                                </View>

                                {/* Scrollable, virtualized list (safe here — not nested in a ScrollView) */}
                                <FlatList
                                    data={visibleOptions}
                                    keyExtractor={(item) => item}
                                    renderItem={({ item }) => renderOption(item)}
                                    keyboardShouldPersistTaps="handled"
                                    style={styles.list}
                                    ListEmptyComponent={
                                        <Text style={[typography.bodySmall, { color: p.text.placeHolder, textAlign: 'center', padding: spacing.lg }]}>
                                            No matches
                                        </Text>
                                    }
                                />
                            </>
                        ) : (
                            // Short list — simple, no search or scroll needed.
                            options.map((option) => renderOption(option))
                        )}
                    </Pressable>
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
    sheetSearchable: { maxHeight: '70%', paddingVertical: spacing.sm, overflow: 'hidden' }, // cap height for long lists
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: spacing.sm,
        borderWidth: borderWidth.thin,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        marginHorizontal: spacing.md,
        marginBottom: spacing.xs,
    },
    searchInput: { flex: 1, paddingVertical: spacing.sm },
    list: { flexGrow: 0 },
    option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
});

export default Select;