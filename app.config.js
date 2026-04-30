
require('dotenv').config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const APPWRITE_COLLECTION_LISTINGS_ID = process.env.APPWRITE_COLLECTION_LISTINGS_ID || process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_LISTINGS_ID;
const APPWRITE_COLLECTION_NOTES_ID = process.env.APPWRITE_COLLECTION_NOTES_ID || process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_NOTES_ID;
const APPWRITE_COLLECTION_SAVED_EVENTS_ID = process.env.APPWRITE_COLLECTION_SAVED_EVENTS_ID || process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_SAVED_EVENTS_ID;
const APPWRITE_COLLECTION_REPORTS_ID = process.env.APPWRITE_COLLECTION_REPORTS_ID || process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_REPORTS_ID;
const APPWRITE_COLLECTION_BLOCKED_USERS_ID = process.env.APPWRITE_COLLECTION_BLOCKED_USERS_ID || process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_BLOCKED_USERS_ID;
const APPWRITE_COLLECTION_NOTIFICATION_PREFERENCES_ID = process.env.APPWRITE_COLLECTION_NOTIFICATION_PREFERENCES_ID || process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_NOTIFICATION_PREFERENCES_ID;
const APPWRITE_BUCKET_ID = process.env.APPWRITE_BUCKET_ID || process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID;


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
            package: 'com.smashingwallets.app',
            permissions: [
                'ACCESS_COARSE_LOCATION',
                'ACCESS_FINE_LOCATION',
                'READ_CALENDAR',
                'WRITE_CALENDAR'
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
            ],
            [
                'expo-image-picker',
                {
                    photosPermission: 'Allow Smashing Wallets to access your photos so you can upload images to your listings.'
                }
            ],
            [
                'expo-notifications',
                {
                    icon: './assets/notification-icon.png',
                    color: '#FF5747'
                }
            ],
            [
                './plugins/with-adi-registration.js',
                { snippet: 'CSTWNZAHXRZ5QAAAAAAAAAAAAA' }
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
            appwriteCollectionReportsId: APPWRITE_COLLECTION_REPORTS_ID,
            appwriteCollectionBlockedUsersId: APPWRITE_COLLECTION_BLOCKED_USERS_ID,
            appwriteCollectionNotificationPreferencesId: APPWRITE_COLLECTION_NOTIFICATION_PREFERENCES_ID,
            appwriteBucketId: APPWRITE_BUCKET_ID,
            googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        },
    };
};