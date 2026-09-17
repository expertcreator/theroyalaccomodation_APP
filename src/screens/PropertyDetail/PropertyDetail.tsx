import React, { useState } from 'react';
import { View, ScrollView, Share } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { verticalScale } from 'react-native-size-matters';

import { useTheme } from '../../context/ThemeContext';
import { getPropertyById } from '../../constants/data';
import type { RootStackParamList } from '../../navigation/types';
import { STACK_ROUTES } from '../../navigation/routes';

import Header from '../../components/Headers/Header';
import RoomBrowser from '../../components/RoomBrowser/RoomBrowser';

import Hero from './components/Hero';
import StatsBar from './components/StatsBar';
import Narrative from './components/Narrative';
import AmenitiesGrid from './components/AmenitiesGrid';
import AttractionsList from './components/AttractionsList';
import BottomBar from './components/BottomBar';
import { styles } from './styles';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DetailRoute = RouteProp<RootStackParamList, typeof STACK_ROUTES.PropertyDetail>;

const PropertyDetail: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const route = useRoute<DetailRoute>();
    const { theme } = useTheme();
    const p = theme.palette;

    const property = getPropertyById(route.params.propertyId);
    const [saved, setSaved] = useState(false);

    const goCheck = () => navigation.navigate(STACK_ROUTES.CheckAvailability, { propertyId: property.id });
    const onShare = () => Share.share({ message: `${property.name} — The Royal Accommodation` }).catch(() => { });

    return (
        <View style={[styles.container, { backgroundColor: p.background.default }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: verticalScale(96) }}>
                <Hero property={property} onBook={goCheck} />

                <View style={styles.content}>
                    <StatsBar property={property} />
                    <Narrative property={property} />
                    <RoomBrowser rooms={property.rooms} />
                    <AmenitiesGrid property={property} />
                    <AttractionsList property={property} />
                </View>
            </ScrollView>

            {/* Floating header over the hero */}
            <Header
                variant="overlay"
                onBack={() => navigation.goBack()}
                rightActions={[
                    { icon: 'share', onPress: onShare, label: 'Share' },
                    { icon: 'bookmark', onPress: () => setSaved(!saved), label: 'Save' },
                ]}
            />

            <BottomBar property={property} onCheck={goCheck} />
        </View>
    );
};

export default PropertyDetail;