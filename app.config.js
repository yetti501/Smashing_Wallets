require('dotenv').config();

console.log('--- Config Environment Check ---');
console.log('Google Maps Key Found:', !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);
console.log('Appwrite Endpoint Found:', !!process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT);
console.log('-------------------------------');

export default ({ config }) => {
    return {
        ...config,
        name: 'Smashing Wallets App',
        slug: 'smashing-wallets-app',
        version: '1.0.0',
        scheme: 'smashingwallets',
        owner: 'smashing-wallets',
        orientation: 'portrait',
        icon: './assets/icon.png',
        userInterfaceStyle: 'light',
        newArchEnabled: true,
        splash: {
            image: './assets/splash-icon.png',
            resizeMode: 'contain',
            backgroundColor: '#ffffff',
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: 'com.smashingwallets.app',
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false,
            },
            config: {
                googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
            },
        },
        android: {
            adaptiveIcon: {
                foregroundImage: './assets/adaptive-icon.png',
                backgroundColor: '#ffffff',
            },
            edgeToEdgeEnabled: true,
            package: 'com.smashingwallets.Smashing_Wallets',
            permissions: [
                'ACCESS_COARSE_LOCATION',
                'ACCESS_FINE_LOCATION'
            ],
            config: {
                googleMaps: {
                    apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
                },
            },
        },
        web: {
            favicon: './assets/favicon.png',
        },
        plugins: [
            'expo-router',
            [
                'expo-location',
                {
                    locationAlwaysAndWhenInUsePermission: 'Allow Smashing Wallets to use your location to show nearby events.'
                }
            ],
            [
                'expo-calendar',
                {
                    calendarPermission: 'Allow Smashing Wallets to add events to your calendar.'
                }
            ]
        ],
        extra: {
            router: {},
            eas: {
                projectId: '192078dc-8f13-40ce-80f4-d5ab1f8506ed',
            },
        },
    };
};