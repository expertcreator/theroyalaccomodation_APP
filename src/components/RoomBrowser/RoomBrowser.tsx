import React, { useState } from 'react';
import { View, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radius, borderWidth } from '../../theme';
import Text from '../Text/Text';
import type { Room } from '../../interfaces/property';

type Props = { rooms: Room[] };

const RoomBrowser: React.FC<Props> = ({ rooms }) => {
    const { theme } = useTheme();
    const p = theme.palette;

    const [roomIndex, setRoomIndex] = useState(0);
    const [thumbIndex, setThumbIndex] = useState(0);

    const room = rooms[roomIndex];
    const mainImage = room.gallery[thumbIndex] ?? room.image;

    // Switching room resets the gallery back to its first photo.
    const selectRoom = (index: number) => {
        setRoomIndex(index);
        setThumbIndex(0);
    };

    return (
        <View>
            {/* Heading */}
            <View style={styles.headingRow}>
                <Text style={[typography.overline, { color: p.primary.main }]}>THE RESIDENCE</Text>
                <View style={[styles.dot, { backgroundColor: p.accent.main }]} />
            </View>
            <Text style={[typography.caption, { color: p.text.placeHolder, marginBottom: spacing.md }]}>
                Explore bedrooms and living spaces
            </Text>

            {/* Room tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[styles.tabs, { borderBottomColor: p.borderColor }]}
                contentContainerStyle={styles.tabsContent}
            >
                {rooms.map((r, i) => {
                    const active = i === roomIndex;
                    return (
                        <TouchableOpacity key={r.id} onPress={() => selectRoom(i)} activeOpacity={0.7} style={styles.tab}>
                            <Text style={[typography.overline, { color: active ? p.primary.main : p.text.placeHolder }]}>
                                {r.name}
                            </Text>
                            {active && <View style={[styles.tabUnderline, { backgroundColor: p.accent.main }]} />}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Selected room card */}
            <View style={[styles.card, { backgroundColor: p.background.card, borderColor: p.borderColor }]}>
                <Image source={mainImage} style={styles.mainImage} resizeMode="cover" />

                <Text style={[typography.title, { color: p.primary.main, marginTop: spacing.md }]}>
                    {room.name}
                </Text>

                {/* Gallery thumbnails */}
                <View style={[styles.galleryWrap, { borderTopColor: p.divider }]}>
                    <Text style={[typography.overline, { color: p.text.placeHolder, marginBottom: spacing.sm }]}>
                        GALLERY
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {room.gallery.map((img, i) => {
                            const active = i === thumbIndex;
                            return (
                                <TouchableOpacity
                                    key={i}
                                    onPress={() => setThumbIndex(i)}
                                    activeOpacity={0.8}
                                    style={{ marginRight: spacing.sm }}
                                >
                                    <Image
                                        source={img}
                                        resizeMode="cover"
                                        style={[
                                            styles.thumb,
                                            { opacity: active ? 1 : 0.6, borderColor: active ? p.accent.main : 'transparent' },
                                        ]}
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headingRow: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: moderateScale(6), height: moderateScale(6), borderRadius: radius.pill, marginLeft: spacing.sm },
    tabs: { borderBottomWidth: borderWidth.thin, marginBottom: spacing.md },
    tabsContent: { alignItems: 'flex-end' },
    tab: { marginRight: spacing.xl, paddingBottom: spacing.sm },
    tabUnderline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: moderateScale(2), borderRadius: radius.pill },
    card: { borderRadius: radius.lg, borderWidth: borderWidth.thin, padding: spacing.md },
    mainImage: { width: '100%', height: verticalScale(200), borderRadius: radius.md },
    galleryWrap: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: borderWidth.thin },
    thumb: { width: moderateScale(80), height: moderateScale(56), borderRadius: radius.sm, borderWidth: moderateScale(2) },
});

export default RoomBrowser;