
import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import COLORS from '../constants/Colors'

const ThemedHeader = ({ title, subtitle, ...props }) => {
    return (
        <View style={styles.header}>
            <View style={styles.logoContainer}>
                <View style={styles.walletIcon}>
                <Ionicons name='wallet' size={32} color='#ff4133' />
                </View>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
    )
}

export default ThemedHeader

const styles = StyleSheet.create({
    header: {
    alignItems: 'center',
    marginBottom: 20
    },
    logoContainer: {
        marginBottom: 12
    }, 
    walletIcon: {
        width: 80,
        height: 80, 
        borderRadius: 20, 
        backgroundColor: COLORS.background, 
        justifyContent: 'center',
        alignItems: 'center', 
        shadownColor: COLORS.shadow,
        shadowOffset: {
        width: 0,
        height: 2
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
        textAlign: 'center'
    }, 
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24
    },
})
