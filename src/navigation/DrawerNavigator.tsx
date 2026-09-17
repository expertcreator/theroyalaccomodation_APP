import { createDrawerNavigator } from '@react-navigation/drawer';
import type { DrawerParamList } from './types';
import { DRAWER_ROUTES } from './routes';
import { useTheme } from '../context/ThemeContext';
import DrawerContent from '../components/Drawer/DrawerContent';
import Home from '../screens/Home/Home';
import PlaceholderScreen from '../screens/_Placeholder';
import ThingsToDo from '../screens/ThingsToDo/ThingsToDo';

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function DrawerNavigator() {
    const { theme } = useTheme();
    return (
        <Drawer.Navigator
            initialRouteName={DRAWER_ROUTES.Home}
            drawerContent={(props) => <DrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerPosition: 'right',
                drawerType: 'front',
                overlayColor: 'rgba(0,0,0,0.55)',           // dims the home screen behind
                drawerStyle: { width: '84%', backgroundColor: theme.palette.primary.dark },
            }}
        >
            <Drawer.Screen name={DRAWER_ROUTES.Home} component={Home} />
            <Drawer.Screen name={DRAWER_ROUTES.ThingsToDo} component={ThingsToDo} />
            <Drawer.Screen name={DRAWER_ROUTES.Contact} component={PlaceholderScreen} />
            <Drawer.Screen name={DRAWER_ROUTES.MyBookings} component={PlaceholderScreen} />
            <Drawer.Screen name={DRAWER_ROUTES.MyProfile} component={PlaceholderScreen} />
        </Drawer.Navigator>
    );
}