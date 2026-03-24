
require('dotenv').config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const APPWRITE_COLLECTION_LISTINGS_ID = process.env.APPWRITE_COLLECTION_LISTINGS_ID || process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_LISTINGS_ID;
const APPWRITE_COLLECTION_NOTES_ID = process.env.APPWRITE_COLLECTION_NOTES_ID || process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_NOTES_ID;
const APPWRITE_COLLECTION_SAVED_EVENTS_ID = process.env.APPWRITE_COLLECTION_SAVED_EVENTS_ID || process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_SAVED_EVENTS_ID;
const APPWRITE_BUCKET_ID = process.env.APPWRITE_BUCKET_ID || process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID;

console.log('--- Config Environment Check ---');
console.log('Google Maps Key Found:', !!GOOGLE_MAPS_API_KEY);
console.log('Appwrite Endpoint Found:', !!APPWRITE_ENDPOINT);
console.log('Appwrite Project ID: ', !!APPWRITE_PROJECT_ID);
console.log('Appwrite Database ID: ', !!APPWRITE_DATABASE_ID);
console.log('Appwrite Collection Listings ID: ', !!APPWRITE_COLLECTION_LISTINGS_ID);
console.log('Appwrite Collection Notes ID: ', !!APPWRITE_COLLECTION_NOTES_ID);
console.log('Appwrite Collection Saved Events ID: ', !!APPWRITE_COLLECTION_SAVED_EVENTS_ID);
console.log('Appwrite Bucket ID:', !!APPWRITE_BUCKET_ID);
console.log('-------------------------------');

export default ({ config }) => {
    return {
        ...config,
        name: 'Smashing Wallets App',
        slug: 'smashing_wallets',
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
                googleMapsApiKey: GOOGLE_MAPS_API_KEY,
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
                    apiKey: GOOGLE_MAPS_API_KEY,
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
                projectId: 'c585dd89-e219-4beb-b1de-4b54fca12099',
            },
            appwriteEndpoint: APPWRITE_ENDPOINT,
            appwriteProjectId: APPWRITE_PROJECT_ID,
            appwriteDatabaseId: APPWRITE_DATABASE_ID,
            appwriteCollectionListingsId: APPWRITE_COLLECTION_LISTINGS_ID,
            appwriteCollectionNotesId: APPWRITE_COLLECTION_NOTES_ID,
            appwriteCollectionSavedEventsId: APPWRITE_COLLECTION_SAVED_EVENTS_ID,
            appwriteBucketId: APPWRITE_BUCKET_ID,
            googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        },
    };
};