import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radius, borderWidth } from '../../theme';
import Text from '../Text/Text';
import Icon from '../Icon/Icon';
import { ITheme } from '../../theme/theme.types';

interface UpdateModalProps {
    visible: boolean;
    force: boolean;          // true = "Update Required" (a new major version): no Later button, Back can't close it
    storeVersion?: string;   // the newer version in the store, if known (e.g. "1.1")
    onUpdate: () => void;
    onLater: () => void;     // only used when force is false
}

/**
 * "A new version is available" (or, when forced, "Update required").
 * Same look as ConfirmModal / OptionsModal.
 *
 * Unlike those, tapping Update does NOT close it: the guest goes to the store,
 * and if they come back without updating, a forced modal must still be there.
 * The hook that shows it (useAppUpdate) decides when it goes away.
 */
const UpdateModal: React.FC<UpdateModalProps> = ({ visible, force, storeVersion, onUpdate, onLater }) => {
    const { theme } = useTheme();
    const p = theme.palette;
    const styles = createStyles(theme);

    // Short screen (a phone in landscape): drop the icon and divider so the card fits.
    const { height } = useWindowDimensions();
    const compact = height < 500;

    const title = force ? 'Update Required' : 'A New Version Is Available';
    const version = storeVersion ? `Version ${storeVersion}` : 'A newer version';
    const message = force
        ? `${version} is a major update. Please update to keep booking and managing your stays.`
        : `${version} of The Royal Accommodation is ready, with the latest improvements.`;

    return (
        <Modal
            supportedOrientations={['portrait', 'landscape']}
            visible={visible}
            transparent
            animationType="fade"
            // Android Back: closes the optional prompt like "Later"; does nothing when forced.
            onRequestClose={force ? () => { } : onLater}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, compact && styles.containerCompact]}>
                    <ScrollView
                        bounces={false}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.content, compact && styles.contentCompact]}
                    >
                        {!compact && (
                            <>
                                {/* Gold-ringed icon */}
                                <View style={styles.iconRing}>
                                    <Icon name="download" size={24} color={p.accent.main} />
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
                        <Text style={[styles.message, compact && { marginBottom: spacing.lg }]}>{message}</Text>

                        <View style={styles.buttons}>
                            <TouchableOpacity style={[styles.button, styles.updateBtn]} onPress={onUpdate} activeOpacity={0.85}>
                                <Text style={[styles.buttonText, styles.updateText]}>Update Now</Text>
                            </TouchableOpacity>

                            {!force && (
                                <TouchableOpacity style={styles.laterBtn} onPress={onLater} activeOpacity={0.6} hitSlop={8}>
                                    <Text style={[styles.buttonText, styles.laterText]}>Later</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default UpdateModal;

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
        updateBtn: { backgroundColor: p.primary.main },
        laterBtn: {
            paddingVertical: spacing.sm,
            alignItems: 'center',
        },

        buttonText: { ...typography.button },
        updateText: { color: p.accent.light },   // gold on green, like the other modals' main button
        laterText: { color: p.text.primary },
    });
};
