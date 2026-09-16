import { createDrawerNavigator } from '@react-navigation/drawer';
import type { DrawerParamList } from './types';
import PlaceholderScreen from '../screens/_Placeholder';
import { DRAWER_ROUTES } from './routes';

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function DrawerNavigator() {
    return (
        <Drawer.Navigator initialRouteName={DRAWER_ROUTES.Home}>
            <Drawer.Screen name={DRAWER_ROUTES.Home} component={PlaceholderScreen} />
            <Drawer.Screen name={DRAWER_ROUTES.ThingsToDo} component={PlaceholderScreen} options={{ title: 'Things to Do' }} />
            <Drawer.Screen name={DRAWER_ROUTES.Contact} component={PlaceholderScreen} />
            <Drawer.Screen name={DRAWER_ROUTES.MyBookings} component={PlaceholderScreen} options={{ title: 'My Bookings' }} />
            <Drawer.Screen name={DRAWER_ROUTES.MyProfile} component={PlaceholderScreen} options={{ title: 'My Profile' }} />
        </Drawer.Navigator>
    );
}