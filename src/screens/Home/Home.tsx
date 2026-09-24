import React from 'react';
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