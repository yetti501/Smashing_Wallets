import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SPACING, RADIUS } from '../constants/Colors'

/**
 * Reusable empty state component
 * 
 * @param {string} icon - Ionicons icon name
 * @param {string} title - Main heading
 * @param {string} subtitle - Secondary text
 * @param {string} actionText - Button text (optional)
 * @param {function} onAction - Button press handler (optional)
 * @param {string} actionIcon - Icon for the action button (optional)
 * @param {string} variant - 'default' | 'compact' | 'card'
 */
const EmptyState = ({ 
    icon = 'document-outline',
    title = 'Nothing here yet',
    subtitle = '',
    actionText = '',
    onAction = null,
    actionIcon = null,
    variant = 'default',
    style = {}
}) => {
    const isCompact = variant === 'compact'
    const isCard = variant === 'card'

    return (
        <View style={[
            styles.container,
            isCompact && styles.containerCompact,
            isCard && styles.containerCard,
            style
        ]}>
            <View style={[
                styles.iconContainer,
                isCompact && styles.iconContainerCompact
            ]}>
                <Ionicons 
                    name={icon} 
                    size={isCompact ? 40 : 64} 
                    color={COLORS.textTertiary} 
                />
            </View>
            
            <Text style={[
                styles.title,
                isCompact && styles.titleCompact
            ]}>
                {title}
            </Text>
            
            {subtitle ? (
                <Text style={[
                    styles.subtitle,
                    isCompact && styles.subtitleCompact
                ]}>
                    {subtitle}
                </Text>
            ) : null}
            
            {actionText && onAction ? (
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={onAction}
                    activeOpacity={0.7}
                >
                    {actionIcon && (
                        <Ionicons 
                            name={actionIcon} 
                            size={20} 
                            color={COLORS.buttonPrimaryText} 
                        />
                    )}
                    <Text style={styles.actionButtonText}>{actionText}</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    )
}

export default EmptyState

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.xl * 2,
    },
    containerCompact: {
        paddingVertical: SPACING.xl,
    },
    containerCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        marginHorizontal: SPACING.lg,
        marginVertical: SPACING.md,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.surfaceSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    iconContainerCompact: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: SPACING.md,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    titleCompact: {
        fontSize: 16,
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 280,
    },
    subtitleCompact: {
        fontSize: 13,
        maxWidth: 240,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
        marginTop: SPACING.xl,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.buttonPrimaryText,
    },
})