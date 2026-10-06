import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radius, borderWidth } from '../../theme';
import Text from '../Text/Text';
import Icon from '../Icon/Icon';
import Input from '../Input/Input';
import { ITheme } from '../../theme/theme.types';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

interface Props {
    visible: boolean;
    title?: string;
    message?: string;
    confirmBtnText?: string;
    cancelBtnText?: string;
    destructive?: boolean;
    loading?: boolean;
    error?: string;
    onCancel: () => void;
    onConfirm: (password: string) => void;
}

const PasswordPromptModal: React.FC<Props> = ({
    visible, title = 'Confirm Password', message, confirmBtnText = 'Confirm',
    cancelBtnText = 'Cancel', destructive = true, loading = false, error, onCancel, onConfirm,
}) => {
    const { theme } = useTheme();
    const p = theme.palette;
    const styles = createStyles(theme);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Clear the field whenever the modal closes.
    useEffect(() => {
        if (!visible) { setPassword(''); setShowPassword(false); }
    }, [visible]);

    const confirmBg = destructive ? p.error.main : p.primary.main;
    const confirmTextColor = destructive ? p.primary.contrastText : p.accent.light;
    const canConfirm = !!password && !loading;

    return (
        <Modal visible={visible} transparent animationType="fade" supportedOrientations={['portrait', 'landscape']}>
            <KeyboardAvoidingView behavior={'padding'} style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.iconRing}>
                        <Icon name={destructive ? 'alert' : 'lock'} size={24} color={p.accent.main} />
                    </View>

                    {!!title && <Text style={styles.title}>{title}</Text>}
                    {!!message && <Text style={styles.message}>{message}</Text>}

                    <View style={{ alignSelf: 'stretch', marginBottom: spacing.lg }}>
                        <Input
                            label="PASSWORD"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            rightIcon={showPassword ? 'eye-off' : 'eye'}
                            onRightIconPress={() => setShowPassword((s) => !s)}
                            error={error}
                        />
                    </View>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={[styles.button, styles.cancelBtn]} onPress={onCancel} activeOpacity={0.85} disabled={loading}>
                            <Text style={styles.cancelText}>{cancelBtnText}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: confirmBg, opacity: canConfirm ? 1 : 0.6 }]}
                            onPress={() => onConfirm(password)}
                            activeOpacity={0.85}
                            disabled={!canConfirm}
                        >
                            {loading
                                ? <ActivityIndicator size="small" color={confirmTextColor} />
                                : <Text style={[styles.confirmText, { color: confirmTextColor }]}>{confirmBtnText}</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default PasswordPromptModal;

const createStyles = (theme: ITheme) => {
    const p = theme.palette;
    return StyleSheet.create({
        overlay: {
            flex: 1, backgroundColor: p.modalBackDrop,
            justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl2,
        },
        container: {
            width: '100%', maxWidth: moderateScale(320),
            backgroundColor: p.background.card, borderRadius: radius.xl,
            borderWidth: borderWidth.thin, borderColor: p.borderColor,
            paddingVertical: spacing.xl2, paddingHorizontal: spacing.xl, alignItems: 'center',
        },
        iconRing: {
            width: moderateScale(58), height: moderateScale(58), borderRadius: moderateScale(29),
            backgroundColor: p.background.default, borderWidth: borderWidth.thin, borderColor: p.accent.main,
            alignItems: 'center', justifyContent: 'center',
        },
        title: { ...typography.headerTitle, color: p.text.primary, marginTop: spacing.md, textAlign: 'center' },
        message: { ...typography.bodySmall, color: p.text.placeHolder, marginTop: spacing.sm, marginBottom: spacing.lg, textAlign: 'center' },
        buttonRow: { flexDirection: 'row', columnGap: spacing.sm, alignSelf: 'stretch' },
        button: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
        cancelBtn: { borderWidth: borderWidth.thin, borderColor: p.text.primary },
        cancelText: { ...typography.button, color: p.text.primary },
        confirmText: { ...typography.button },
    });
};