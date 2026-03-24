import { StyleSheet } from 'react-native'
import { Redirect } from 'expo-router'

const index = () => {
    return <Redirect href="/(map)/map" />
}

export default index

const styles = StyleSheet.create({})
