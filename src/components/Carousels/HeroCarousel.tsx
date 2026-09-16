import React, { useEffect, useRef, useState } from 'react';
import {
    View, Image, FlatList, Pressable, StyleSheet, useWindowDimensions,
    NativeSyntheticEvent, NativeScrollEvent, ImageSourcePropType,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { typography } from '../../theme';
import { withAlpha } from '../../utils/color';
import Text from '../Text/Text';

type Slide = { image: ImageSourcePropType; caption: string };
type Props = { slides: Slide[]; height?: number; interval?: number };

const HeroCarousel: React.FC<Props> = ({ slides, height = 320, interval = 4500 }) => {
    const { theme } = useTheme();
    const p = theme.palette;
    const { width } = useWindowDimensions();
    const listRef = useRef<FlatList<Slide>>(null);
    const indexRef = useRef(0);
    const [index, setIndex] = useState(0);
    const H = verticalScale(height);

    const scrollTo = (i: number) => {
        listRef.current?.scrollToOffset({ offset: i * width, animated: true });
        indexRef.current = i;
        setIndex(i);
    };

    // Auto-advance (ref avoids the stale-closure interval bug)
    useEffect(() => {
        if (slides.length <= 1) return;
        const t = setInterval(() => scrollTo((indexRef.current + 1) % slides.length), interval);
        return () => clearInterval(t);
    }, [slides.length, width, interval]);

    const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const i = Math.round(e.nativeEvent.contentOffset.x / width);
        indexRef.current = i;
        setIndex(i);
    };

    return (
        <View style={{ width, height: H, backgroundColor: p.primary.dark }}>
            <FlatList
                ref={listRef}
                data={slides}
                keyExtractor={(_, i) => String(i)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onMomentumEnd}
                getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
                renderItem={({ item }) => <Image source={item.image} style={{ width, height: H }} resizeMode="cover" />}
            />

            {/* Bottom scrim for text legibility (brand green, via token) */}
            <LinearGradient
                colors={['transparent', 'transparent', withAlpha(p.primary.main, 0.85)]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />

            <View style={styles.overlayRow} pointerEvents="box-none">
                {/* Caption pill */}
                <View style={[styles.glassPill, styles.captionPill]}>
                    <View style={[styles.goldDot, { backgroundColor: p.accent.main }]} />
                    <Text style={[typography.overline, { color: 'rgba(255,255,255,0.9)', flexShrink: 1 }]} numberOfLines={1}>
                        {slides[index]?.caption}
                    </Text>
                </View>

                {/* Dot indicators */}
                <View style={[styles.glassPill, styles.dotsPill]}>
                    {slides.map((_, i) => (
                        <Pressable key={i} onPress={() => scrollTo(i)} hitSlop={6}>
                            <View
                                style={[
                                    styles.dash,
                                    i === index
                                        ? { width: moderateScale(24), backgroundColor: p.accent.main }
                                        : { width: moderateScale(8), backgroundColor: 'rgba(255,255,255,0.4)' },
                                ]}
                            />
                        </Pressable>
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlayRow: {
        position: 'absolute', left: moderateScale(20), right: moderateScale(20), bottom: verticalScale(16),
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    glassPill: {
        flexDirection: 'row', alignItems: 'center', borderRadius: 999, borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.30)', borderColor: 'rgba(255,255,255,0.15)',
    },
    captionPill: {
        paddingHorizontal: moderateScale(12),
        paddingVertical: verticalScale(5),
        flexShrink: 1,                    // ← give up width when space is tight
        marginRight: moderateScale(8),   // ← gap so it never touches the dots
    },
    goldDot: { width: moderateScale(6), height: moderateScale(6), borderRadius: 999, marginRight: moderateScale(8) },
    dotsPill: {
        paddingHorizontal: moderateScale(12),
        paddingVertical: verticalScale(6),
        flexShrink: 0,                    // ← keeps its full width, always visible
    },
    dash: { height: verticalScale(3), borderRadius: 999, marginHorizontal: moderateScale(3) },
});

export default HeroCarousel;