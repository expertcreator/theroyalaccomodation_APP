import React from 'react';
import { View, Image } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing } from '../../../theme';
import Text from '../../../components/Text/Text';
import SectionHeader from '../../../components/Headers/SectionHeader';
import type { Property } from '../../../interfaces/property';
import { styles } from '../styles';

type Props = { property: Property };

const AttractionsList: React.FC<Props> = ({ property }) => {
    const { theme } = useTheme();
    const p = theme.palette;
    return (
        <View>
            <SectionHeader title="SURROUNDING ATTRACTIONS" />
            <View style={{ marginTop: spacing.md, rowGap: spacing.sm }}>
                {property.attractions.map((a, i) => (
                    <View key={i} style={[styles.attractionRow, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
                        <Image source={a.image} style={styles.attractionImg} resizeMode="cover" />
                        <View style={{ flex: 1 }}>
                            <Text style={[typography.overline, { color: p.primary.main }]} numberOfLines={1}>{a.name}</Text>
                            <Text style={[typography.caption, { color: p.text.placeHolder, marginTop: spacing.xxs }]} numberOfLines={2}>
                                {a.subtitle}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            <View style={[styles.narrativeCard, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
                <Text style={[typography.bodySmall, { color: p.text.placeHolder, textAlign: 'justify' }]}>
                    {property.attractionsNarrative}
                </Text>
            </View>
        </View>
    );
};

export default AttractionsList;