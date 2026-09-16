import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../components/Headers/Header';

export default function PlaceholderScreen() {
    const route = useRoute();
    const navigation: any = useNavigation();
    return (
        <View style={styles.container}>
            <Header showBrand subtitle="Ascot · Windsor" onMenu={() => navigation.openDrawer()} />
            <View style={styles.content}>
                <Text style={styles.label}>{route.name}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },                                   // stack, full width, top-aligned
    content: { flex: 1, alignItems: 'center', justifyContent: 'center' }, // center the label only
    label: { fontSize: 18 },
});