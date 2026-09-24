import React from 'react';
import { View, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';

import { useTheme } from '../../context/ThemeContext';
import { typography, spacing } from '../../theme';
import { AREA_ATTRACTIONS } from '../../constants/data';
import type { DrawerParamList } from '../../navigation/types';

import Text from '../../components/Text/Text';
import Header from '../../components/Headers/Header';
import DiamondDivider from '../../components/Dividers/DiamondDivider';
import AttractionCard from './components/AttractionCard';
import { styles } from './styles';

type Nav = DrawerNavigationProp<DrawerParamList>;

const ThingsToDo: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const { theme } = useTheme();
    const p = theme.palette;

    return (
        <View style={[styles.container, { backgroundColor: p.background.default }]}>
            <Header title="Things to Do" onBack={() => navigation.goBack()} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Title block */}
                <View style={styles.titleBlock}>
                    <DiamondDivider />
                    <Text style={[typography.h2, { color: p.text.primary, marginTop: spacing.md, textAlign: 'center' }]}>
                        Windsor & Ascot
                    </Text>
                    <Text style={[typography.body, styles.subtitle, { color: p.text.placeHolder }]}>
                        Both properties are within easy reach of these destinations.
                    </Text>
                    <View style={{ marginTop: spacing.md }}>
                        <DiamondDivider />
                    </View>
                </View>

                {/* Attraction cards */}
                {AREA_ATTRACTIONS.map((attraction) => (
                    <AttractionCard key={attraction.id} attraction={attraction} />
                ))}
            </ScrollView>
        </View>
    );
};

export default ThingsToDo;