import { StyleSheet, Text } from 'react-native'
import COLORS from '../constants/Colors'

const ThemedText = ({ inputText, style, ...props }) => {
    return(
        <Text style={[styles.textContainer, style]} {...props}>
            {inputText}
        </Text>
    )
}

export default ThemedText 

const styles = StyleSheet.create({
    textContainer: {
        color: COLORS.text,
        paddoing: 8,
        marginBottom: 8,
        marginTop: 20,
        position: 'relative'
    }
})