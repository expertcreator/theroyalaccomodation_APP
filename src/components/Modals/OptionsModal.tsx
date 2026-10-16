import React, { useRef } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Pressable, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radius, borderWidth } from '../../theme';
import Text from '../Text/Text';
import Icon, { IconName } from '../Icon/Icon';
import { ITheme } from '../../theme/theme.types';

// One choice in the list. 'primary' = green filled, 'destructive' = red outline,
// 'default' = dark outline.
export interface ModalOption {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'destructive' | 'default';
}

interface OptionsModalProps {
    visible: boolean;
    title: string;
    message?: string;
    icon?: IconName;
    options: ModalOption[];      // stacked top to bottom, Cancel always last
    onCancel: () => void;        // Cancel or Android Back
    cancelBtnText?: string;
}

/**
 * Same look as ConfirmModal, but for a choice between several actions
 * (e.g. Choose New Photo / Remove Photo / Cancel). The modal closes itself
 * before running the chosen action — on iOS only once it has fully gone, since
 * iOS can't open another screen (like the photo picker) over a closing modal.
 */
const OptionsModal: React.FC<OptionsModalProps> = ({
    visible,
    title,
    message,
    icon = 'info',
    options,
    onCancel,
    cancelBtnText = 'Cancel',
}) => {
    const { theme } = useTheme();
    const p = theme.palette;
    const styles = createStyles(theme);

    // Short screen (a phone in landscape): drop the icon and divider and tighten
    // the spacing so the card fits. It also scrolls rather than being cut off.
    const { height } = useWindowDimensions();
    const compact = height < 500;

    const pending = useRef<(() => void) | null>(null);

    const choose = (option: ModalOption) => {
        onCancel(); // close first
        if (Platform.OS === 'ios') pending.current = option.onPress; // run in onDismiss
        else option.onPress();
    };

    const onDismiss = () => {
        const action = pending.current;
        pending.current = null;
        action?.();
    };

    return (
        <Modal
            supportedOrientations={['portrait', 'landscape']}
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
            onDismiss={onDismiss}
        >
            <Pressable style={styles.overlay}>
                <Pressable style={[styles.container, compact && styles.containerCompact]} onPress={() => { }}>
                    <ScrollView
                        bounces={false}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.content, compact && styles.contentCompact]}
                    >
                        {!compact && (
                            <>
                                {/* Gold-ringed icon */}
                                <View style={styles.iconRing}>
                                    <Icon name={icon} size={24} color={p.accent.main} />
                                </View>

                                {/* Diamond accent */}
                                <View style={styles.diamondRow}>
                                    <View style={styles.diamondLine} />
                                    <View style={styles.diamond} />
                                    <View style={styles.diamondLine} />
                                </View>
                            </>
                        )}

                        <Text style={[styles.title, compact && { marginTop: 0 }]}>{title}</Text>
                        {!!message && <Text style={[styles.message, compact && { marginBottom: spacing.lg }]}>{message}</Text>}

                        <View style={[styles.buttons, !message && { marginTop: compact ? spacing.lg : spacing.xl }]}>
                            {options.map((option) => {
                                const variant = option.variant ?? 'default';
                                return (
                                    <TouchableOpacity
                                        key={option.label}
                                        style={[styles.button, variant === 'primary' ? styles.primaryBtn
                                            : variant === 'destructive' ? styles.destructiveBtn : styles.defaultBtn]}
                                        onPress={() => choose(option)}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={[styles.buttonText, variant === 'primary' ? styles.primaryText
                                            : variant === 'destructive' ? styles.destructiveText : styles.defaultText]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}

                            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.6} hitSlop={8}>
                                <Text style={[styles.buttonText, styles.defaultText]}>{cancelBtnText}</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

export default OptionsModal;

const createStyles = (theme: ITheme) => {
    const p = theme.palette;
    return StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: p.modalBackDrop,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: spacing.xl2,
            paddingVertical: spacing.lg,
        },
        container: {
            width: '100%',
            maxWidth: moderateScale(320),
            maxHeight: '100%',   // never taller than the screen; the content scrolls instead
            backgroundColor: p.background.card,
            borderRadius: radius.xl,
            borderWidth: borderWidth.thin,
            borderColor: p.borderColor,
            overflow: 'hidden',
        },
        containerCompact: { maxWidth: moderateScale(360) },
        content: {
            paddingVertical: spacing.xl2,
            paddingHorizontal: spacing.xl,
            alignItems: 'center',
        },
        contentCompact: { paddingVertical: spacing.lg },

        // Gold-ringed icon
        iconRing: {
            width: moderateScale(58),
            height: moderateScale(58),
            borderRadius: moderateScale(29),
            backgroundColor: p.background.default,
            borderWidth: borderWidth.thin,
            borderColor: p.accent.main,
            alignItems: 'center',
            justifyContent: 'center',
        },

        // Diamond accent
        diamondRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: spacing.lg,
            columnGap: spacing.sm,
        },
        diamondLine: { width: moderateScale(24), height: borderWidth.thin, backgroundColor: p.divider },
        diamond: { width: moderateScale(5), height: moderateScale(5), backgroundColor: p.accent.main, transform: [{ rotate: '45deg' }] },

        title: {
            ...typography.headerTitle,
            color: p.text.primary,
            marginTop: spacing.md,
            textAlign: 'center',
        },
        message: {
            ...typography.bodySmall,
            color: p.text.placeHolder,
            marginTop: spacing.sm,
            marginBottom: spacing.xl,
            textAlign: 'center',
        },

        buttons: {
            alignSelf: 'stretch',
            rowGap: spacing.sm,
        },
        button: {
            paddingVertical: spacing.md,
            borderRadius: radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
        },
        primaryBtn: { backgroundColor: p.primary.main },
        destructiveBtn: { borderWidth: borderWidth.thin, borderColor: p.error.main },
        defaultBtn: { borderWidth: borderWidth.thin, borderColor: p.text.primary },
        cancelBtn: {
            paddingVertical: spacing.sm,
            alignItems: 'center',
        },

        buttonText: { ...typography.button },
        primaryText: { color: p.accent.light },   // gold on green, like ConfirmModal's non-destructive confirm
        destructiveText: { color: p.error.main },
        defaultText: { color: p.text.primary },
    });
};
