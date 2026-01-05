
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Link } from 'expo-router'
import COLORS from '../constants/Colors'

const ThemedLink = ({ inputText, link, linkText, loading,...props }) => {
    return (
        <View style={styles.linkContainer}>
            <Text style={styles.inputText}>{inputText}</Text>
            <Link href={link} asChild>
                <TouchableOpacity disabled={loading}>
                    <Text style={styles.linkText}>{linkText}</Text>
                </TouchableOpacity>
            </Link>
        </View>
    )
} 

export default ThemedLink

const styles = StyleSheet.create({
    linkContainer: { 
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5, 
    },
    inputText: {
        fontSize: 14,
        color: COLORS.text
    },
    linkText: {
        fontSize: 14,
        color: COLORS.linkPrimaryText,
        fontWeight: '600'
    },
})
