import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);


/*
    Para lanzar el frontend solo
    npx expo start

    Para lanzar el frontend para movil
    $env:REACT_NATIVE_PACKAGER_HOSTNAME="192.168.1.23"; npx expo start --lan

    Para lanzar el backend solo
    php artisan serve --host=0.0.0.0 --port=8000

    Para lanzarlo a movil
    php artisan serve --host=192.168.1.23 --port=8000
*/