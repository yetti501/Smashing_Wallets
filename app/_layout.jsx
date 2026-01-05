import { StyleSheet } from 'react-native'
import { Tabs } from 'expo-router'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { AuthProvider } from '../contexts/AuthContext' 
import { ListingsProvider } from '../contexts/ListingsContext' 
import { SavedEventsProvider } from '../contexts/SavedEventsContext'

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
            
            {/* <Tabs.Screen
                name='(tabs)'
                options={{
                    title:'Listings',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="list-outline" size={size} color={color} />
                    )
                }}
            /> */}

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

            <Tabs.Screen
                name='(test)'
                options={{
                    href: null,
                    headerShown: false
                }}
            />

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

const RootLayout = () => {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <SavedEventsProvider>
                    <ListingsProvider> 
                        <TabsLayout />
                    </ListingsProvider>
                </SavedEventsProvider>
            </AuthProvider>
        </SafeAreaProvider>
    )
}

export default RootLayout

const styles = StyleSheet.create({})
