/**
 * @format
 */

import './src/utils/silenceLogsInRelease'; // first: no console output in release builds (APP-10)
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
