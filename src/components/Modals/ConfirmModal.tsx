import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radius, borderWidth } from '../../theme';
import Text from '../Text/Text';
import Icon from '../Icon/Icon';
import { ITheme } from '../../theme/theme.types';

interface ConfirmModalProps {
    visible: boolean;
    title?: string;
    message?: string;
    onCancel: () => void;
    onConfirm: () => void;
    cancelBtnText?: string;
    confirmBtnText?: string;
    destructive?: boolean;   // optional — red confirm (default) vs green confirm
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    visible,
    title = 'Confirm Delete',
    message = 'Are you sure you want to delete this item?',
    onCancel,
    onConfirm,
    cancelBtnText,
    confirmBtnText,
    destructive = true,
}) => {
    const { theme } = useTheme();
    const p = theme.palette;
    const styles = createStyles(theme);

    const confirmBg = destructive ? p.error.main : p.primary.main;
    const confirmTextColor = destructive ? p.primary.contrastText : p.accent.light;

    return (
        <Modal
            supportedOrientations={['portrait', 'landscape']}
            visible={visible}
            transparent
            animationType="fade"
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Gold-ringed icon */}
                    <View style={styles.iconRing}>
                        <Icon name={destructive ? 'alert' : 'info'} size={24} color={p.accent.main} />
                    </View>

                    {/* Diamond accent */}
                    <View style={styles.diamondRow}>
                        <View style={styles.diamondLine} />
                        <View style={styles.diamond} />
                        <View style={styles.diamondLine} />
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={[styles.button, styles.cancelBtn]} onPress={onCancel} activeOpacity={0.85}>
                            <Text style={styles.cancelText}>{cancelBtnText ? cancelBtnText : 'Cancel'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, { backgroundColor: confirmBg }]} onPress={onConfirm} activeOpacity={0.85}>
                            <Text style={[styles.confirmText, { color: confirmTextColor }]}>{confirmBtnText ? confirmBtnText : 'Delete'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default ConfirmModal;

const createStyles = (theme: ITheme) => {
    const p = theme.palette;
    return StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: p.modalBackDrop,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: spacing.xl2,
        },
        container: {
            width: '100%',
            maxWidth: moderateScale(320),
            backgroundColor: p.background.card,
            borderRadius: radius.xl,
            borderWidth: borderWidth.thin,
            borderColor: p.borderColor,
            paddingVertical: spacing.xl2,
            paddingHorizontal: spacing.xl,
            alignItems: 'center',
        },

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

        buttonRow: {
            flexDirection: 'row',
            columnGap: spacing.sm,
            alignSelf: 'stretch',
        },
        button: {
            flex: 1,
            paddingVertical: spacing.md,
            borderRadius: radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
        },
        cancelBtn: {
            borderWidth: borderWidth.thin,
            borderColor: p.text.primary,
        },
        cancelText: {
            ...typography.button,
            color: p.text.primary,
        },
        confirmText: {
            ...typography.button,
        },
    });
};