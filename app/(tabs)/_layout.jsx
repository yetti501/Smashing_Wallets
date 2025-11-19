import { StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

const TabsLayout = () => {
    return (
        <>
            <StatusBar style="dark" />
            <Stack screenOptions={{ 
                    headerShown: false,
                    animation: 'slide_from_right',
                    animationEnabled: true
                }}>
                <Stack.Screen 
                    name="viewListings" 
                    options = {{ 
                        title: 'Events'
                    }}
                />
                <Stack.Screen 
                    name="listingDetails" 
                    options= {{
                        title: 'Event Details'
                    }}
                />
                <Stack.Screen
                    name="newListing"
                    options= {{
                        title: 'Create Event',
                        presentation: 'modal'
                    }}
                />
                <Stack.Screen
                    name="editListing"
                    options= {{
                        title: 'Edit Event',
                        presentation: 'modal'
                    }}
                />
            </Stack>
        </>
    )
}

export default TabsLayout

const styles = StyleSheet.create({

})