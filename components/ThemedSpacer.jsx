import { StyleSheet, View } from 'react-native'

const ThemedSpacer = ({size}) => {
    let spacerStyle = styles.medium

    if (size === 'small') {
        spacerStyle = styles.small
    } else if (size === 'large') {
        spaceStyle = styles.large
    } 

    return <View style={spacerStyle} />
}

export default ThemedSpacer

const styles = StyleSheet.create({
    small: {
        marginBottom: 10
    },
    medium: {
        marginBottom: 20
    },
    large: {
        marginBottom: 30
    }
})