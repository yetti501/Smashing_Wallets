import { View, StyleSheet, Modal, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../constants/Colors'

/**
 * ThemedModal - Standardized modal component for the app
 *
 * Usage:
 *   <ThemedModal
 *       visible={showModal}
 *       onClose={() => setShowModal(false)}
 *       icon="alert-circle-outline"
 *       iconColor={COLORS.error}
 *       title="Something Went Wrong"
 *       message="Please try again later."
 *       buttons={[
 *           { text: 'Cancel', style: 'cancel', onPress: () => setShowModal(false) },
 *           { text: 'Retry', style: 'primary', onPress: handleRetry },
 *       ]}
 *   />
 *
 * Button styles: 'primary', 'destructive', 'cancel'
 * You can also pass `children` for custom content (forms, lists, etc.)
 */
export default function ThemedModal({
    visible = false,
    onClose,
    icon,
    iconColor = COLORS.primary,
    title,
    message,
    buttons = [],
    children,
}) {
    // Derive icon circle background from iconColor
    const getIconBackground = (color) => {
        switch (color) {
            case COLORS.error:
                return '#FEE2E2'
            case COLORS.success:
                return '#D1FAE5'
            case COLORS.warning:
                return '#FEF3C7'
            case COLORS.info:
                return '#DBEAFE'
            case COLORS.primary:
            default:
                return '#FFF1F0'
        }
    }

    const getButtonStyle = (style) => {
        switch (style) {
            case 'destructive':
                return { backgroundColor: COLORS.error }
            case 'cancel':
                return {
                    backgroundColor: COLORS.surfaceSecondary,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                }
            case 'primary':
            default:
                return { backgroundColor: COLORS.primary }
        }
    }

    const getButtonTextStyle = (style) => {
        switch (style) {
            case 'cancel':
                return { color: COLORS.text }
            case 'destructive':
            case 'primary':
            default:
                return { color: COLORS.textInverse }
        }
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.content}>
                    {icon && (
                        <View style={[styles.iconCircle, { backgroundColor: getIconBackground(iconColor) }]}>
                            <Ionicons name={icon} size={48} color={iconColor} />
                        </View>
                    )}

                    {title && <Text style={styles.title}>{title}</Text>}

                    {message && <Text style={styles.message}>{message}</Text>}

                    {children}

                    {buttons.length > 0 && (
                        <View style={styles.buttonRow}>
                            {buttons.map((btn, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.button, getButtonStyle(btn.style)]}
                                    onPress={btn.onPress}
                                    disabled={btn.disabled}
                                >
                                    {btn.icon && (
                                        <Ionicons
                                            name={btn.icon}
                                            size={18}
                                            color={btn.style === 'cancel' ? COLORS.text : COLORS.textInverse}
                                            style={{ marginRight: 8 }}
                                        />
                                    )}
                                    <Text style={[
                                        styles.buttonText,
                                        getButtonTextStyle(btn.style),
                                        btn.disabled && styles.buttonTextDisabled,
                                    ]}>
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        backgroundColor: COLORS.modalBackground,
        borderRadius: 16,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    buttonTextDisabled: {
        opacity: 0.5,
    },
})
