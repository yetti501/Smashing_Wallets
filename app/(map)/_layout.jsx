import { StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

const MapLayout = () => {
    return (
        <>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="map" />
            </Stack>
        </>
    )
}

export default MapLayout

const styles = StyleSheet.create({})