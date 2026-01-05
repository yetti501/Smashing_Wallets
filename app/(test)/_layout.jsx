import { StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

const TestLayout = () => {
    return (
        <>
            <StatusBar style="dark" />
            <Stack>
                <Stack.Screen name="testInput" />
                <Stack.Screen name="testRead" />
            </Stack>
        </>
    )
}

export default TestLayout

const styles = StyleSheet.create({})