import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

const MapLayout = () => {
    return (
        <>
            <StatusBar style="dark" />
            <Stack screenOptions={{ 
                headerShown: false,
                animation: 'slide_from_right',
            }} />
        </>
    )
}

export default MapLayout