import { StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import ThemedText from './ThemedText'
import { COLORS, SPACING } from '../constants/Colors'

/**
 * EmptyState - reuable empty state component
 * 
 * @param {string} icon - Icon Name
 * @param {string} title - Main title text
 * @param {string} subtitle - Subtitle text
 * @param {number} iconSize - Icon size (default: 80)
 * @param {object} style - custom container style
 */

const EmptyState = ({
    icon = 'alert-circle-outline',
    title, 
    subtitle, 
    iconSize = 80, 
    style
}) => {
    return (
        <View style={[styles.container, style]}>
            <Ionicons name={icon} size={iconSize} color={COLORS.textTertiary} />
            {title && (
                <ThemedText style={styles.title}>{title}</ThemedText>
            )}
            {subtitle && (
                <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
            )}
        </View>
    )
}

export default EmptyState

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: SPACING.xl,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: SPACING.lg,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
})