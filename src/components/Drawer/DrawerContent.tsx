import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Linking } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { typography } from '../../theme';
import { withAlpha } from '../../utils/color';
import { PROPERTIES, CONTACT } from '../../constants/data';
import { DRAWER_ROUTES, STACK_ROUTES } from '../../navigation/routes';
import Text from '../Text/Text';
import Icon from '../Icon/Icon';

type NavItem = { label: string; onPress: () => void; emphasized?: boolean; chevron?: boolean };

const DrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
    const { theme } = useTheme();
    const { user, isLoggedIn, signOut } = useAuth();
    const insets = useSafeAreaInsets();
    const p = theme.palette;
    const nav: any = props.navigation;

    const white = (a: number) => withAlpha(p.primary.contrastText, a);
    const go = (name: string, params?: object) => { nav.navigate(name, params); nav.closeDrawer(); };

    const items: NavItem[] = [
        { label: 'Home', onPress: () => go(DRAWER_ROUTES.Home), emphasized: true },
        { label: PROPERTIES[0].name, onPress: () => go(STACK_ROUTES.PropertyDetail, { propertyId: PROPERTIES[0].id }) },
        { label: PROPERTIES[1].name, onPress: () => go(STACK_ROUTES.PropertyDetail, { propertyId: PROPERTIES[1].id }) },
        { label: 'Windsor & Ascot', onPress: () => go(DRAWER_ROUTES.ThingsToDo) },
        ...(isLoggedIn
            ? [
                { label: 'My Bookings', onPress: () => go(DRAWER_ROUTES.MyBookings), },
                { label: 'My Profile', onPress: () => go(DRAWER_ROUTES.MyProfile) },
                { label: 'Contact', onPress: () => go(DRAWER_ROUTES.Contact) },
            ]
            : [
                { label: 'Contact', onPress: () => go(DRAWER_ROUTES.Contact) },
                { label: 'Sign In', onPress: () => go(STACK_ROUTES.LoginRegister, { entry: 'drawer' }), chevron: true },
            ]),
    ];

    return (
        <View style={[styles.root, { backgroundColor: p.primary.dark }]}>
            {/* Left champagne-gold accent */}
            <LinearGradient
                colors={['transparent', p.accent.main, 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                style={styles.leftAccent}
                pointerEvents="none"
            />

            {/* Close button */}
            <View style={[styles.top, { paddingTop: insets.top + verticalScale(12) }]}>
                <Pressable
                    onPress={() => nav.closeDrawer()}
                    hitSlop={8}
                    accessibilityLabel="Close menu"
                    style={[styles.closeBtn, { backgroundColor: white(0.1), borderColor: white(0.15) }]}
                >
                    <Icon name="close" color={white(0.9)} size={16} />
                </Pressable>
            </View>

            {/* Wordmark */}
            <View style={styles.wordmark}>
                <View style={{ marginBottom: verticalScale(12) }}>
                    <Icon name="crown" size={26} color={p.accent.main} />
                </View>
                <Text style={[typography.title, { color: p.primary.contrastText, letterSpacing: moderateScale(2.5) }]}>
                    The Royal Accommodation
                </Text>
                <Text style={[typography.overline, { color: p.accent.main, marginTop: verticalScale(4), letterSpacing: moderateScale(4) }]}>
                    Luxury Living
                </Text>
            </View>

            {/* Nav */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.navContent} showsVerticalScrollIndicator={false}>
                {items.map((it, i) => (
                    <Pressable key={i} onPress={it.onPress} style={styles.navRow}>
                        <Text
                            style={[
                                typography.label,
                                {
                                    color: it.emphasized ? p.primary.contrastText : white(0.85),
                                    fontWeight: it.emphasized ? '600' : '300',
                                    letterSpacing: moderateScale(2.5),
                                    textTransform: 'uppercase',
                                },
                            ]}
                        >
                            {it.label}
                        </Text>
                        {it.chevron && (
                            <View style={{ marginLeft: moderateScale(8) }}>
                                <Icon name="chevron-right" color={p.accent.main} size={14} />
                            </View>
                        )}
                    </Pressable>
                ))}

                {isLoggedIn && (
                    <View style={[styles.account, { borderTopColor: white(0.1) }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[typography.overline, { color: p.accent.main, marginBottom: verticalScale(3) }]}>Account</Text>
                            <Text style={[typography.label, { color: p.primary.contrastText }]}>{user?.name}</Text>
                        </View>
                        <Pressable onPress={() => signOut()}>
                            <Text style={[typography.caption, { color: white(0.5), textDecorationLine: 'underline' }]}>Sign out</Text>
                        </Pressable>
                    </View>
                )}
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + verticalScale(16) }]}>
                <LinearGradient
                    colors={['transparent', withAlpha(p.accent.main, 0.4), 'transparent']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.hairline}
                />
                <View style={styles.contact}>
                    <Pressable onPress={() => Linking.openURL(`tel:${CONTACT.phone}`)}>
                        <Text style={[typography.bodySmall, { color: white(0.6) }]}>{CONTACT.phoneDisplay}</Text>
                    </Pressable>
                    <Pressable onPress={() => Linking.openURL(`mailto:${CONTACT.email}`)}>
                        <Text style={[typography.caption, { color: white(0.5), marginTop: verticalScale(4) }]}>{CONTACT.email}</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, overflow: 'hidden' },
    leftAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 1.5, opacity: 0.8 },
    top: { paddingHorizontal: moderateScale(28), alignItems: 'flex-end', marginBottom: verticalScale(20) },
    closeBtn: {
        width: moderateScale(40), height: moderateScale(40), borderRadius: moderateScale(20),
        borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    },
    wordmark: { paddingHorizontal: moderateScale(28), marginBottom: verticalScale(28) },
    navContent: { paddingHorizontal: moderateScale(28), paddingVertical: verticalScale(4) },
    navRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: verticalScale(9) },
    account: {
        flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
        marginTop: verticalScale(24), paddingTop: verticalScale(18), borderTopWidth: StyleSheet.hairlineWidth,
    },
    footer: { paddingHorizontal: moderateScale(28), paddingTop: verticalScale(16) },
    hairline: { height: 1, width: '100%', marginBottom: verticalScale(16) },
    contact: { alignItems: 'center' },
});

export default DrawerContent;