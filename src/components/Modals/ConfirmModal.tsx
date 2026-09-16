import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
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
    confirmBtnText
}) => {

    const { theme } = useTheme(); // dynamically get theme (light or dark)
    const styles = createStyles(theme);

    return (
        <Modal
            supportedOrientations={['portrait', 'landscape']}
            visible={visible}
            transparent
            animationType='slide'
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={[styles.button, styles.cancelBtn]} onPress={onCancel}>
                            <Text style={styles.cancelText}>{cancelBtnText ? cancelBtnText : `Cancel`}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.confirmBtn]} onPress={onConfirm}>
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
        borderRadius: moderateScale(8),
        padding: moderateScale(20),
    },
    title: {
        fontSize: moderateScale(16),
        fontWeight: 'bold',
        color: theme.palette.text.primary,
        marginBottom: moderateScale(10),
    },
    message: {
        fontSize: moderateScale(14),
        color: theme.palette.text.primary,
        marginBottom: moderateScale(20),
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    button: {
        paddingVertical: moderateScale(8),
        paddingHorizontal: moderateScale(16),
        borderRadius: moderateScale(8),
        marginLeft: moderateScale(10),
    },
    cancelBtn: {
        backgroundColor: theme.palette.divider,
    },
    confirmBtn: {
        backgroundColor: theme.palette.error.main,
    },
    cancelText: {
        color: theme.palette.text.primary,
        fontSize: moderateScale(14),
    },
    confirmText: {
        color: theme.palette.text.secondary,
        fontWeight: 'bold',
        fontSize: moderateScale(14),
    },
});