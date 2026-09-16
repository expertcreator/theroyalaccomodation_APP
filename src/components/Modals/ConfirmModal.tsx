import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radius } from '../../theme';
import Text from '../Text/Text';
import { ITheme } from '../../theme/theme.types';

interface ConfirmModalProps {
    visible: boolean;
    title?: string;
    message?: string;
    onCancel: () => void;
    onConfirm: () => void;
    cancelBtnText?: string;
    confirmBtnText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    visible,
    title = 'Confirm Delete',
    message = 'Are you sure you want to delete this item?',
    onCancel,
    onConfirm,
    cancelBtnText,
    confirmBtnText,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <Modal
            supportedOrientations={['portrait', 'landscape']}
            visible={visible}
            transparent
            animationType="slide"
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={[styles.button, styles.cancelBtn]} onPress={onCancel} activeOpacity={0.85}>
                            <Text style={styles.cancelText}>{cancelBtnText ? cancelBtnText : `Cancel`}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.confirmBtn]} onPress={onConfirm} activeOpacity={0.85}>
                            <Text style={styles.confirmText}>{confirmBtnText ? confirmBtnText : `Delete`}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default ConfirmModal;

const createStyles = (theme: ITheme) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: theme.palette.modalBackDrop,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '80%',
        backgroundColor: theme.palette.background.card,
        borderRadius: radius.md,
        padding: spacing.xl2,
    },
    title: {
        ...typography.subtitle,
        color: theme.palette.text.primary,
        marginBottom: spacing.sm,
    },
    message: {
        ...typography.body,
        color: theme.palette.text.primary,
        marginBottom: spacing.xl2,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    button: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.md,
        marginLeft: spacing.sm,
    },
    cancelBtn: {
        backgroundColor: theme.palette.divider,
    },
    confirmBtn: {
        backgroundColor: theme.palette.error.main,
    },
    cancelText: {
        ...typography.label,
        color: theme.palette.text.primary,
    },
    confirmText: {
        ...typography.label,
        color: theme.palette.text.secondary,
    },
});