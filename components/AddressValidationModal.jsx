import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SPACING, RADIUS } from '../constants/Colors'

/**
 * AddressValidationModal - Shows validation results and suggestions
 * 
 * @param {boolean} visible - Modal visibility
 * @param {function} onClose - Close handler
 * @param {object} validationResult - Result from address validation API
 * @param {string} originalAddress - The address user entered
 * @param {function} onUseSuggested - Use the suggested address
 * @param {function} onKeepOriginal - Keep the original address
 * @param {boolean} isValidating - Show loading state
 */
const AddressValidationModal = ({
    visible,
    onClose,
    validationResult,
    originalAddress,
    onUseSuggested,
    onKeepOriginal,
    isValidating = false,
}) => {
    const hasSuggestion = validationResult?.suggestedAddress && 
        validationResult.suggestedAddress !== originalAddress

    const getStatusIcon = () => {
        if (validationResult?.isValid) {
            return { name: 'checkmark-circle', color: COLORS.success || '#22C55E' }
        }
        if (hasSuggestion) {
            return { name: 'alert-circle', color: COLORS.warning || '#F59E0B' }
        }
        return { name: 'close-circle', color: COLORS.error || '#EF4444' }
    }

    const getStatusMessage = () => {
        if (validationResult?.isValid) {
            return 'Address verified successfully!'
        }
        if (hasSuggestion) {
            return 'We found a similar address. Would you like to use our suggestion?'
        }
        if (validationResult?.hasUnconfirmedComponents) {
            return 'Some parts of this address could not be verified.'
        }
        return 'We couldn\'t verify this address. Please check and try again.'
    }

    const statusIcon = getStatusIcon()

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {isValidating ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text style={styles.loadingText}>Validating address...</Text>
                        </View>
                    ) : (
                        <>
                            {/* Header */}
                            <View style={styles.header}>
                                <Ionicons 
                                    name={statusIcon.name} 
                                    size={48} 
                                    color={statusIcon.color} 
                                />
                                <Text style={styles.title}>Address Validation</Text>
                                <Text style={styles.message}>{getStatusMessage()}</Text>
                            </View>

                            {/* Address Comparison */}
                            <View style={styles.addressSection}>
                                {/* Original Address */}
                                <View style={styles.addressBox}>
                                    <Text style={styles.addressLabel}>You entered:</Text>
                                    <Text style={styles.addressText}>{originalAddress}</Text>
                                </View>

                                {/* Suggested Address */}
                                {hasSuggestion && (
                                    <View style={[styles.addressBox, styles.suggestedBox]}>
                                        <View style={styles.suggestedLabel}>
                                            <Ionicons name="bulb" size={16} color={COLORS.primary} />
                                            <Text style={styles.addressLabelSuggested}>Suggested:</Text>
                                        </View>
                                        <Text style={styles.addressTextSuggested}>
                                            {validationResult.suggestedAddress}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Actions */}
                            <View style={styles.actions}>
                                {validationResult?.isValid ? (
                                    // Valid address - just close
                                    <TouchableOpacity
                                        style={styles.primaryButton}
                                        onPress={onClose}
                                    >
                                        <Text style={styles.primaryButtonText}>Continue</Text>
                                    </TouchableOpacity>
                                ) : hasSuggestion ? (
                                    // Has suggestion - show both options
                                    <>
                                        <TouchableOpacity
                                            style={styles.primaryButton}
                                            onPress={onUseSuggested}
                                        >
                                            <Text style={styles.primaryButtonText}>
                                                Use Suggested Address
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.secondaryButton}
                                            onPress={onKeepOriginal}
                                        >
                                            <Text style={styles.secondaryButtonText}>
                                                Keep My Address
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    // No suggestion - let them keep or edit
                                    <>
                                        <TouchableOpacity
                                            style={styles.secondaryButton}
                                            onPress={onKeepOriginal}
                                        >
                                            <Text style={styles.secondaryButtonText}>
                                                Use Anyway
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.primaryButton}
                                            onPress={onClose}
                                        >
                                            <Text style={styles.primaryButtonText}>
                                                Edit Address
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    )
}

export default AddressValidationModal

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    modal: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },
    loadingContainer: {
        alignItems: 'center',
        padding: SPACING.xl,
    },
    loadingText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: SPACING.md,
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: SPACING.md,
    },
    message: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.sm,
        lineHeight: 20,
    },
    addressSection: {
        marginBottom: SPACING.lg,
    },
    addressBox: {
        backgroundColor: COLORS.surfaceSecondary,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
    },
    suggestedBox: {
        backgroundColor: 'rgba(37, 99, 235, 0.1)', // Light blue tint
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    addressLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    addressLabelSuggested: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
        textTransform: 'uppercase',
    },
    suggestedLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    addressText: {
        fontSize: 15,
        color: COLORS.text,
        lineHeight: 22,
    },
    addressTextSuggested: {
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '500',
        lineHeight: 22,
    },
    actions: {
        gap: SPACING.sm,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.md,
        alignItems: 'center',
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.buttonPrimaryText,
    },
    secondaryButton: {
        backgroundColor: COLORS.surfaceSecondary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
})