export default {
    expo: {
        scheme: "smashingwallets",
        name: "Smashing Wallets App",
        slug: "smashing-wallets-app",
        owner: "smashing-wallets",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        newArchEnabled: true,
        splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        },
        ios: {
        supportsTablet: true,
        bundleIdentifier: "com.smashingwallets.app",
        infoPlist: {
            ITSAppUsesNonExemptEncryption: false,
        },
        config: {
            googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
        },
        android: {
        adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon.png",
            backgroundColor: "#ffffff",
        },
        edgeToEdgeEnabled: true,
        package: "com.smashingwallets.Smashing_Wallets",
        config: {
            googleMaps: {
            apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
            },
        },
        },
        web: {
        favicon: "./assets/favicon.png",
        },
        plugins: ["expo-router"],
        extra: {
        router: {},
        eas: {
            projectId: "192078dc-8f13-40ce-80f4-d5ab1f8506ed",
        },
        },
    },
};