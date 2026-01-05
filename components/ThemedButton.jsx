
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import Colors, { COLORS } from '../constants/Colors'

const ThemedButton = ({ buttonText, action, loading, disabled, ...props }) => {
    return(
        <TouchableOpacity
            style={[styles.buttonContainer, (loading || disabled) && styles.buttonDisabled]}
            onPress={action}
            disabled={disabled || loading}
        >
            <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
    )
} 

export default ThemedButton

const styles = StyleSheet.create({
    buttonContainer: { 
        backgroundColor: COLORS.buttonPrimary,
        borderRadius: 8,
        paddingVertical: 16, 
        alignItems: 'center',
        marginBottom: 5
    },
    buttonDisabled: {
        backgroundColor: COLORS.buttonDisabled
    },
    buttonText: {
        color: COLORS.buttonPrimaryText,
        fontSize: 18,
        fontWeight: '600'
    },
})
