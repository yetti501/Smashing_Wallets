// import { useState, useEffect } from 'react'
// import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { Tabs } from 'expo-router'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
// import * as Location from 'expo-location'
import { AuthProvider } from '../contexts/AuthContext'
import { ListingsProvider } from '../contexts/ListingsContext'
import { SavedEventsProvider } from '../contexts/SavedEventsContext'
// import OnboardingScreen from '../components/OnboardingScreen'

const TabsLayout = () => {
    const insets = useSafeAreaInsets()

    return (
        <Tabs
            screenOptions={{
                headerShown: false, 
                tabBarActiveTintColor: '#ff4133',
                tabBarInactiveTintColor: '#8e8e93',
                tabBarStyle: {
                    backgroundColor: '#f8f9fa',
                    borderTopWidth: 1, 
                    borderTopColor: '#6c757d',
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
                    paddingTop: 5, 
                    height: 60 + (insets.bottom > 0 ? insets.bottom : 10)
                },
                animation: 'shift',
                animationEnabled: true,
                tabBarHideOnKeyboard: true
            }}
        >
            <Tabs.Screen 
                name='(map)'
                options={{
                    title: 'Map',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="map-outline" size={size} color={color} />
                    )
                }}
            />
            <Tabs.Screen 
                name='(auth)'
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    )
                }}
            />

            <Tabs.Screen
                name='(tabs)'
                options={{
                    title:'Listings',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="list-outline" size={size} color={color} />
                    )
                }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        e.preventDefault()
                        navigation.reset({
                            index: 0,
                            routes: [{ name: '(tabs)', state: { routes: [{ name: 'viewListings' }] } }],
                        })
                    }
                })}
            />

            {/* <Tabs.Screen
                name='(test)'
                // options={{
                //     href: null,
                //     headerShown: false
                // }}
                options={{
                    title:'Testing',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="bug-outline" size={size} color={color} />
                    )
                }}
            /> */}

            <Tabs.Screen
                name="index"
                options={{
                    href: null, 
                    headerShown: false
                }}
            />
        </Tabs>
    )
}

const AppContent = () => {
    // ── Onboarding commented out for deadline ──
    // const [isLoading, setIsLoading] = useState(true)
    // const [showSplash, setShowSplash] = useState(false)
    // // Key to force TabsLayout to re-mount after onboarding
    // const [appKey, setAppKey] = useState(0)

    // useEffect(() => {
    //     checkLocationPermission()
    // }, [])

    // const checkLocationPermission = async () => {
    //     try {
    //         const { status } = await Location.getForegroundPermissionsAsync()

    //         // If the user has granted persistent location permission,
    //         // go straight to the app. Otherwise show the splash screen
    //         // every time until they grant it.
    //         setShowSplash(status !== 'granted')
    //     } catch (error) {
    //         console.error('Error checking location permission:', error)
    //         setShowSplash(false)
    //     } finally {
    //         setIsLoading(false)
    //     }
    // }

    // const handleSplashComplete = () => {
    //     // Increment the key to force TabsLayout to fully re-mount
    //     // so the Map screen picks up the new location permission
    //     setAppKey(prevKey => prevKey + 1)
    //     setShowSplash(false)
    // }

    // if (isLoading) {
    //     return (
    //         <View style={styles.loadingContainer}>
    //             <ActivityIndicator size="large" color="#ff4133" />
    //         </View>
    //     )
    // }

    // if (showSplash) {
    //     return <OnboardingScreen onComplete={handleSplashComplete} />
    // }

    // return <TabsLayout key={appKey} />
    return <TabsLayout />
}

const RootLayout = () => {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <SavedEventsProvider>
                    <ListingsProvider> 
                        <AppContent />
                    </ListingsProvider>
                </SavedEventsProvider>
            </AuthProvider>
        </SafeAreaProvider>
    )
}

export default RootLayout

// const styles = StyleSheet.create({
//     loadingContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#f8f9fa',
//     },
// })