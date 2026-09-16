import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { ITheme, typography } from '../../theme';
import { PROPERTIES, HERO_SLIDES } from '../../constants/data';
import type { RootStackParamList } from '../../navigation/types';
import { STACK_ROUTES } from '../../navigation/routes';

import Text from '../../components/Text/Text';
import Header from '../../components/Headers/Header';
import HeroCarousel from '../../components/Carousels/HeroCarousel';
import SectionEyebrow from '../../components/SectionEyebrow/SectionEyebrow';
import DiamondDivider from '../../components/Dividers/DiamondDivider';
import PropertyCard from '../../components/Cards/PropertyCard';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const Home: React.FC = () => {

    const navigation = useNavigation<Nav>();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const p = theme.palette;

    return (
        <View style={styles.container}>
            {/* Sticky header, outside the scroll view */}
            <Header
                showBrand
                subtitle="Ascot · Windsor"
                onMenu={() => navigation.dispatch(DrawerActions.openDrawer())}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: verticalScale(32) }}
            >
                <HeroCarousel slides={HERO_SLIDES} />

                {/* Intro */}
                <View style={styles.intro}>
                    <SectionEyebrow label="Curated Sanctuary" />
                    <Text style={[typography.h2, styles.heading, { color: p.primary.main }]}>
                        Luxury Holiday Homes{'\n'}In Ascot & Windsor
                    </Text>
                    <Text style={[typography.body, styles.subtitle, { color: p.text.placeHolder }]}>
                        Exclusive private residences with pools and gardens near London.
                    </Text>
                    <View style={{ marginTop: verticalScale(20) }}>
                        <DiamondDivider />
                    </View>
                </View>

                {/* Property cards */}
                <View style={styles.cards}>
                    {PROPERTIES.map((property) => (
                        <PropertyCard
                            key={property.id}
                            property={property}
                            onPress={() => navigation.navigate(STACK_ROUTES.PropertyDetail, { propertyId: property.id })}
                        />
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const createStyles = (theme: ITheme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.palette.background.default
    },
    intro: {
        paddingHorizontal: moderateScale(20),
        paddingTop: verticalScale(24),
        paddingBottom: verticalScale(20),
        alignItems: 'center',
    },
    heading: { textAlign: 'center', marginTop: verticalScale(10), marginBottom: verticalScale(10) },
    subtitle: { textAlign: 'center', maxWidth: moderateScale(300) },
    cards: { paddingHorizontal: moderateScale(20), rowGap: verticalScale(24) },
});

export default Home;