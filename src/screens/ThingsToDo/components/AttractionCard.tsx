import React from 'react';
import { View, Image, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing } from '../../../theme';
import { withAlpha } from '../../../utils/color';
import Text from '../../../components/Text/Text';
import Icon from '../../../components/Icon/Icon';
import type { AreaAttraction } from '../../../interfaces/attraction';
import { styles } from '../styles';

type Props = { attraction: AreaAttraction };

const AttractionCard: React.FC<Props> = ({ attraction }) => {
    const { theme } = useTheme();
    const p = theme.palette;

    const openWebsite = () => Linking.openURL(attraction.url).catch(() => { });

    return (
        <View style={[styles.card, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
            {/* Image + location pill */}
            <View style={styles.imageWrap}>
                <Image source={attraction.image} style={styles.image} resizeMode="cover" />
                <LinearGradient
                    colors={['rgba(0,0,0,0.10)', 'transparent', 'rgba(0,0,0,0.35)']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={[styles.pill, { backgroundColor: withAlpha(p.primary.main, 0.85), borderColor: withAlpha(p.accent.main, 0.3) }]}>
                    <Text style={[typography.overline, { color: p.accent.light }]} numberOfLines={1}>
                        {attraction.location.toUpperCase()}
                    </Text>
                </View>
            </View>

            {/* Content */}
            <View style={styles.body}>
                <Text style={[typography.title, { color: p.primary.main, marginBottom: spacing.sm }]}>
                    {attraction.name}
                </Text>
                <Text style={[typography.bodySmall, { color: p.text.placeHolder, marginBottom: spacing.md }]}>
                    {attraction.description}
                </Text>

                {/* Learn more → opens the official website */}
                <TouchableOpacity onPress={openWebsite} activeOpacity={0.7} style={styles.linkRow}>
                    <Text style={[typography.overline, { color: p.accent.dark }]}>LEARN MORE</Text>
                    <View style={{ marginLeft: spacing.xs }}>
                        <Icon name="arrow-right" size={14} color={p.accent.dark} />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default AttractionCard;