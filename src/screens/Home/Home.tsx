import React, { useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing } from '../../theme';
import { PROPERTIES, HERO_SLIDES } from '../../constants/data';
import type { RootStackParamList } from '../../navigation/types';
import { STACK_ROUTES } from '../../navigation/routes';

import Text from '../../components/Text/Text';
import Header from '../../components/Headers/Header';
import HeroCarousel from '../../components/Carousels/HeroCarousel';
import SectionEyebrow from '../../components/SectionEyebrow/SectionEyebrow';
import DiamondDivider from '../../components/Dividers/DiamondDivider';
import PropertyCard from '../../components/Cards/PropertyCard';
import { createStyles } from './styles';
import { showToast } from '../../utils/ToastNotifier';
import { Property } from '../../interfaces/property';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const Home: React.FC = () => {

    const navigation = useNavigation<Nav>();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const p = theme.palette;

    const onMenuPress = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    }

    const onPropertyCardPress = (item: Property) => {
        navigation.navigate(STACK_ROUTES.PropertyDetail, { propertyId: item.id })
    }

    useEffect(() => {
        // testCoupon()
    }, [])

    const testCoupon = async () => {
        const body = new URLSearchParams({
            action: 'ow_verify_coupon',
            coupon_code: 'TEST-SYS',
            accom_ids: '1680',
            check_in: '2026-10-10',
            check_out: '2026-10-13',
        }).toString();

        const res = await fetch('https://theroyalaccommodation.com/wp-admin/admin-ajax.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
                'Referer': 'https://theroyalaccommodation.com/book-online/',
                'Origin': 'https://theroyalaccommodation.com',
            },
            body,
        });

        console.log('Coupon status:', res.status);
        console.log('Coupon body:', await res.text());   // read ONCE
        console.log('res:', res);   // read ONCE
    };

    const testAvailability = async () => {
        const body = new URLSearchParams({
            action: 'ow_get_available_accom',
            check_in: '2026-10-10',
            check_out: '2026-10-13',
            adults: '2',
            children: '0',
            page_accom_id: '1680',
            current_page_id: '0',
            is_admin: 'no',
            exists_main_booking_form: 'yes',
            results_show_only_accom_id: '1680',
            force_display_thumb: 'no',
            force_display_desc: 'no',
            // REMOVED: admin_accom_id, admin_search_type, accom_people
        }).toString();

        const res = await fetch('https://theroyalaccommodation.com/wp-admin/admin-ajax.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
                'Referer': 'https://theroyalaccommodation.com/book-online/',
                'Origin': 'https://theroyalaccommodation.com',
            },
            body,
        });

        console.log('Availability status:', res.status);
        console.log('Availability body:', await res.text());   // read ONCE
        console.log('res:', res);   // read ONCE
    };

    const testOwcalPricing = async () => {
        const body = new URLSearchParams({
            action: 'ow_get_summary',
            'ow-details-accom-ids': '1680',        // Ascot
            'ow-details-check-in': '2026-10-10',   // use REAL available dates
            'ow-details-check-out': '2026-10-13',
            'ow-details-adults': '2',
            'ow-details-children': '0',
        }).toString();

        try {
            const res = await fetch(
                'https://theroyalaccommodation.com/wp-admin/admin-ajax.php',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Requested-With': 'XMLHttpRequest',
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
                        'Referer': 'https://theroyalaccommodation.com/book-online/',
                        'Origin': 'https://theroyalaccommodation.com',
                    },
                    body,
                }
            );

            console.log('Status:', res.status);           // 200 = good, 403 = WAF blocked
            const text = await res.text();
            console.log('Response:', res);               // the price JSON (or error)
        } catch (e) {
            console.log('Request failed:', e);
        }
    };

    return (
        <View style={styles.container}>
            {/* Sticky header, outside the scroll view */}
            <Header
                showBrand
                subtitle="Ascot · Windsor"
                onMenu={onMenuPress}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: spacing.xxl }}
            >
                <HeroCarousel slides={HERO_SLIDES} />

                {/* Intro */}
                <View style={styles.intro}>
                    <SectionEyebrow label="Curated Sanctuary" />
                    <Text style={[typography.h2, styles.heading, { color: p.text.primary }]}>
                        Luxury Holiday Homes{'\n'}In Ascot & Windsor
                    </Text>
                    <Text style={[typography.body, styles.subtitle, { color: p.text.placeHolder }]}>
                        Exclusive private residences with pools and gardens near London.
                    </Text>
                    <View style={{ marginTop: spacing.xl2 }}>
                        <DiamondDivider />
                    </View>
                </View>

                {/* Property cards */}
                <View style={styles.cards}>
                    {PROPERTIES.map((property) => (
                        <PropertyCard
                            key={property.id}
                            property={property}
                            onPress={() => onPropertyCardPress(property)}
                        />
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

export default Home;