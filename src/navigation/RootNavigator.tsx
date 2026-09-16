import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import DrawerNavigator from './DrawerNavigator';
import PlaceholderScreen from '../screens/_Placeholder';
import { STACK_ROUTES } from './routes';
import { StatusBar } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    const { theme, isDarkMode } = useTheme();
    const bg = theme.palette.background.default; // cream in light mode

    return (
        <>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            />
            {/* TEMP: booting into DrawerRoot until Splash is built.
                Switch initialRouteName back to STACK_ROUTES.Splash then. */}
            <Stack.Navigator initialRouteName={STACK_ROUTES.DrawerRoot}>
                <Stack.Screen name={STACK_ROUTES.Splash} component={PlaceholderScreen} options={{ headerShown: false }} />
                <Stack.Screen name={STACK_ROUTES.DrawerRoot} component={DrawerNavigator} options={{ headerShown: false }} />
                <Stack.Screen name={STACK_ROUTES.PropertyDetail} component={PlaceholderScreen} />
                <Stack.Screen name={STACK_ROUTES.CheckAvailability} component={PlaceholderScreen} options={{ title: 'Check Availability' }} />
                <Stack.Screen name={STACK_ROUTES.SearchResults} component={PlaceholderScreen} options={{ title: 'Search Results' }} />
                <Stack.Screen name={STACK_ROUTES.LoginRegister} component={PlaceholderScreen} options={{ title: 'Sign In' }} />
                <Stack.Screen name={STACK_ROUTES.PaymentReview} component={PlaceholderScreen} options={{ title: 'Payment' }} />
                <Stack.Screen name={STACK_ROUTES.BookingConfirmed} component={PlaceholderScreen} options={{ headerShown: false }} />
            </Stack.Navigator>
        </>
    );
}