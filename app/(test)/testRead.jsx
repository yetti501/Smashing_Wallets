import { View, StyleSheet } from 'react-native'
import ThemedSafeArea from '../../components/ThemedSafeArea'
import ThemedText from '../../components/ThemedText'

export default function TestReadScreen() {
    return (
        <ThemedSafeArea centered>
            <ThemedText>Test Read Screen</ThemedText>
        </ThemedSafeArea>
    )
}

const styles = StyleSheet.create({})