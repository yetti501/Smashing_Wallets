import { StyleSheet, ScrollView, Text, View } from 'react-native'
import ThemedText from '../components/ThemedText'
import { Redirect } from 'expo-router'
import OnboardingModal from '../components/OnBoardingModal'

const index = () => {
    return (
        <>
            <OnboardingModal onComplete={() => console.log('Onboarding complete')} />
            <Redirect href="/(map)/map" />
        </>
    )
}

export default index

const styles = StyleSheet.create({})