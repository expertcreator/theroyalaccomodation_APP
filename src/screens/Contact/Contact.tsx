import React, { useState } from 'react';
import { View, ScrollView, Image, TouchableOpacity, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';

import { useTheme } from '../../context/ThemeContext';
import { typography, spacing } from '../../theme';
import { withAlpha } from '../../utils/color';
import { CONTACT } from '../../constants/data';
import imagePath from '../../constants/imagePath';
import type { DrawerParamList } from '../../navigation/types';

import Text from '../../components/Text/Text';
import Header from '../../components/Headers/Header';
import DiamondDivider from '../../components/Dividers/DiamondDivider';
import Button from '../../components/Buttons/Button';
import Input from '../../components/Input/Input';
import Select from '../../components/Dropdown/Select';
import ConfirmModal from '../../components/Modals/ConfirmModal';
import ContactRow from './components/ContactRow';
import { styles } from './styles';

type Nav = DrawerNavigationProp<DrawerParamList>;

const PROPERTY_OPTIONS = ['Not specified', 'Luxury Ascot Retreat', 'Royal Windsor Residence'];

const Contact: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const { theme } = useTheme();
    const p = theme.palette;

    // Form state — one object keeps it tidy.
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [property, setProperty] = useState(PROPERTY_OPTIONS[0]);
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

    useFocusEffect(
        React.useCallback(() => {
            // Clear the form whenever the screen loses focus
            // (back button, hardware back, drawer switch, swipe — all covered).
            return () => resetForm();
        }, [])
    );

    // Static-data phase: just show a confirmation. Later this calls Firebase / email.
    const submitEnquiry = () => {
        // Check required fields; collect messages.
        const nextErrors: { name?: string; email?: string } = {};
        if (!name.trim()) nextErrors.name = 'Please enter your name';
        if (!email.trim()) nextErrors.email = 'Please enter your email address';

        setErrors(nextErrors);

        // Stop if anything is missing.
        if (nextErrors.name || nextErrors.email) return;

        setSent(true);
    };

    const resetForm = () => {
        setName('');
        setPhone('');
        setEmail('');
        setProperty(PROPERTY_OPTIONS[0]);
        setMessage('');
        setErrors({});
        setSent(false);
    };

    const onBackPress = () => {
        navigation.goBack();
    }

    const openMaps = () => Linking.openURL('https://maps.google.com/?q=Windsor,Berkshire,England').catch(() => { });

    return (
        <View style={[styles.container, { backgroundColor: p.background.default }]}>
            <Header title="Contact" onBack={() => onBackPress()} />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    {/* Intro */}
                    <View style={styles.intro}>
                        <DiamondDivider />
                        <Text style={[typography.body, styles.introText, { color: p.text.placeHolder }]}>
                            We're here to help with your booking or any questions.
                        </Text>
                    </View>

                    {/* Map card — tap to open maps */}
                    <TouchableOpacity activeOpacity={0.9} onPress={openMaps} style={[styles.mapCard, { borderColor: p.borderColor }]}>
                        <Image source={imagePath.map} style={styles.mapImage} resizeMode="cover" />
                        <View style={[styles.mapTag, { backgroundColor: withAlpha(p.background.card, 0.95), borderColor: p.borderColor }]}>
                            <View style={[styles.mapTagDot, { backgroundColor: p.accent.main }]} />
                            <Text style={[typography.overline, { color: p.primary.main }]}>WINDSOR & ASCOT ESTATES</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Get in touch */}
                    <Text style={[typography.overline, { color: p.primary.main, marginBottom: spacing.sm }]}>GET IN TOUCH</Text>
                    <View style={[styles.contactCard, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
                        <ContactRow icon="mail" label="EMAIL US" onPress={() => Linking.openURL(`mailto:${CONTACT.email}`)}>
                            <Text style={[typography.bodySmall, { color: p.text.primary }]}>{CONTACT.email}</Text>
                        </ContactRow>

                        <View style={[styles.rowDivider, { backgroundColor: p.divider }]} />

                        <ContactRow icon="phone" label="PHONE">
                            <TouchableOpacity onPress={() => Linking.openURL(`tel:${CONTACT.phone}`)}>
                                <Text style={[typography.bodySmall, { color: p.text.primary }]}>{CONTACT.phoneDisplay}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => Linking.openURL(`tel:${CONTACT.phone2}`)}>
                                <Text style={[typography.bodySmall, { color: p.text.primary, marginTop: spacing.xxs }]}>{CONTACT.phone2Display}</Text>
                            </TouchableOpacity>
                        </ContactRow>

                        <View style={[styles.rowDivider, { backgroundColor: p.divider }]} />

                        <ContactRow icon="map-pin" label="ADDRESS" onPress={openMaps}>
                            {CONTACT.address.map((line, i) => (
                                <Text key={i} style={[typography.bodySmall, { color: p.text.primary }]}>{line}</Text>
                            ))}
                        </ContactRow>
                    </View>

                    {/* Enquiry form */}
                    <View style={[styles.formCard, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
                        <View style={[styles.formHeader, { borderBottomColor: p.divider }]}>
                            <Text style={[typography.overline, { color: p.primary.main }]}>SEND AN ENQUIRY</Text>
                            <Text style={[typography.caption, { color: p.text.placeHolder, marginTop: spacing.xxs }]}>
                                We'll get back to you as soon as possible.
                            </Text>
                        </View>

                        <View style={styles.formFields}>
                            <Input
                                label="YOUR FULL NAME"
                                value={name}
                                onChangeText={(text) => { setName(text); if (errors.name) setErrors((e) => ({ ...e, name: undefined })); }}
                                placeholder="e.g. Alexander Wright"
                                error={errors.name}
                            />
                            <Input
                                label="TELEPHONE NUMBER"
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="+44 7000 000000"
                                keyboardType="phone-pad"
                            />
                            <Input
                                label="EMAIL ADDRESS"
                                value={email}
                                onChangeText={(text) => { setEmail(text); if (errors.email) setErrors((e) => ({ ...e, email: undefined })); }}
                                placeholder="name@domain.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                error={errors.email}
                            />
                            <Select label="INTERESTED PROPERTY" value={property} options={PROPERTY_OPTIONS} onSelect={setProperty} />
                            <Input label="MESSAGE / REQUIREMENTS" value={message} onChangeText={setMessage} placeholder="Your dates, questions or any special requests..." multiline />

                            <View style={{ marginTop: spacing.sm }}>
                                <Button title="Send Enquiry" rightIcon="arrow-right" onPress={submitEnquiry} />
                            </View>
                        </View>

                        <Text style={[typography.caption, styles.privacyNote, { color: p.text.placeHolder }]}>
                            Your details are kept private.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Success confirmation */}
            <ConfirmModal
                visible={sent}
                title="Enquiry Received"
                message="Thank you. Your enquiry has been received by our estate concierge."
                cancelBtnText="Close"
                confirmBtnText="Done"
                onCancel={() => setSent(false)}
                onConfirm={() => setSent(false)}
            />
        </View>
    );
};

export default Contact;