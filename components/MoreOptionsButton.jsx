import { useState } from 'react'
import { TouchableOpacity, View, StyleSheet, Text, Modal, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useAuth } from '../contexts/AuthContext'
import { useBlockedUsers, blockedUsersService } from '../contexts/BlockedUsersContext'
import { sendReportEmail } from '../lib/reportEmailService'
import ThemedModal from './ThemedModal'
import { COLORS, SPACING, RADIUS } from '../constants/Colors'

const REPORT_TYPES = [
    { key: 'spam', label: 'Spam', icon: 'megaphone-outline' },
    { key: 'inappropriate', label: 'Inappropriate Content', icon: 'eye-off-outline' },
    { key: 'scam', label: 'Scam / Fraud', icon: 'warning-outline' },
    { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
]

const MoreOptionsButton = ({
    listing,
    size = 'medium',
    variant = 'icon',
    style = {},
}) => {
    const { user } = useAuth()
    const { reportListing, blockUser, isUserBlocked } = useBlockedUsers()
    const [menuVisible, setMenuVisible] = useState(false)
    const [reportVisible, setReportVisible] = useState(false)
    const [blockConfirmVisible, setBlockConfirmVisible] = useState(false)
    const [selectedReportType, setSelectedReportType] = useState(null)
    const [reportDescription, setReportDescription] = useState('')
    const [reporterEmail, setReporterEmail] = useState('')
    const [emailError, setEmailError] = useState('')
    const [reportTypeError, setReportTypeError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [resultModal, setResultModal] = useState({ visible: false, success: false, title: '', message: '', onDismiss: null })

    const sizes = {
        small: { icon: 20, button: 32 },
        medium: { icon: 24, button: 40 },
        large: { icon: 28, button: 48 },
    }

    const currentSize = sizes[size] || sizes.medium

    const handlePress = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        setMenuVisible(true)
    }

    const handleReport = () => {
        setMenuVisible(false)
        setSelectedReportType(null)
        setReportDescription('')
        setReporterEmail('')
        setEmailError('')
        setReportTypeError('')
        setReportVisible(true)
    }

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    }

    const handleBlock = () => {
        setMenuVisible(false)
        if (!user) {
            Alert.alert(
                'Login Required',
                'Create an account or log in to block users.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Log In', onPress: () => router.push('/login') },
                ]
            )
            return
        }
        setBlockConfirmVisible(true)
    }

    const submitReport = async () => {
        let hasError = false

        if (!selectedReportType) {
            setReportTypeError('Please select a reason for your report.')
            hasError = true
        } else {
            setReportTypeError('')
        }

        if (!user) {
            if (!reporterEmail.trim()) {
                setEmailError('Email is required so we can follow up if needed.')
                hasError = true
            } else if (!isValidEmail(reporterEmail)) {
                setEmailError('Please enter a valid email address.')
                hasError = true
            } else {
                setEmailError('')
            }
        }

        if (hasError) return

        setSubmitting(true)
        try {
            const reporterUserId = user?.$id || 'anonymous'
            await blockedUsersService.reportListing(reporterUserId, listing.$id, listing.userId, selectedReportType, reportDescription)

            sendReportEmail({
                reportType: selectedReportType,
                listingId: listing.$id,
                listingTitle: listing.title,
                reportedUserId: listing.userId,
                reporterUserId: user?.$id,
                reporterEmail: user?.email || reporterEmail.trim(),
                reporterAccountStatus: user ? 'Logged In' : 'Anonymous',
                description: reportDescription,
            })

            setReportVisible(false)
            setResultModal({
                visible: true,
                success: true,
                title: 'Report Submitted',
                message: 'Thank you for helping keep our community safe. We will review this report shortly.',
            })
        } catch (error) {
            setResultModal({
                visible: true,
                success: false,
                title: 'Error',
                message: 'Failed to submit report. Please try again.',
            })
        } finally {
            setSubmitting(false)
        }
    }

    const confirmBlock = async () => {
        setSubmitting(true)
        try {
            await blockUser(listing.userId)
            setBlockConfirmVisible(false)
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            setResultModal({
                visible: true,
                success: true,
                title: 'User Blocked',
                message: 'You will no longer see listings from this user. You can unblock them from your profile settings.',
                onDismiss: () => router.back(),
            })
        } catch (error) {
            setBlockConfirmVisible(false)
            setResultModal({
                visible: true,
                success: false,
                title: 'Error',
                message: 'Failed to block user. Please try again.',
                onDismiss: null,
            })
        } finally {
            setSubmitting(false)
        }
    }

    const getButtonStyle = () => {
        const baseStyle = {
            width: currentSize.button,
            height: currentSize.button,
            borderRadius: currentSize.button / 2,
            justifyContent: 'center',
            alignItems: 'center',
        }

        switch (variant) {
            case 'icon':
            default:
                return {
                    ...baseStyle,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                }
        }
    }

    const isOwner = user && listing && user.$id === listing.userId

    if (isOwner) return null

    return (
        <>
            <TouchableOpacity
                style={[getButtonStyle(), style]}
                onPress={handlePress}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons
                    name="ellipsis-horizontal"
                    size={currentSize.icon}
                    color="#FFFFFF"
                />
            </TouchableOpacity>

            {/* Options Menu */}
            <Modal
                visible={menuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
                    <View style={styles.menuContainer}>
                        <Text style={styles.menuTitle}>Options</Text>

                        <TouchableOpacity style={styles.menuItem} onPress={handleReport}>
                            <Ionicons name="flag-outline" size={22} color={COLORS.text} />
                            <Text style={styles.menuItemText}>Report Listing</Text>
                        </TouchableOpacity>

                        {!isUserBlocked(listing.userId) && (
                            <TouchableOpacity style={styles.menuItem} onPress={handleBlock}>
                                <Ionicons name="ban-outline" size={22} color={COLORS.error} />
                                <Text style={[styles.menuItemText, { color: COLORS.error }]}>Block User</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.menuItem, styles.menuItemLast]}
                            onPress={() => setMenuVisible(false)}
                        >
                            <Ionicons name="close-outline" size={22} color={COLORS.textSecondary} />
                            <Text style={[styles.menuItemText, { color: COLORS.textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            {/* Report Modal */}
            <Modal
                visible={reportVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setReportVisible(false)}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <Pressable style={styles.reportOverlay} onPress={() => { Keyboard.dismiss(); setReportVisible(false) }}>
                        <View style={styles.reportContainer}>
                            <Pressable onPress={() => {}}>
                                <View style={styles.reportHeader}>
                                    <Text style={styles.reportTitle}>Report Listing</Text>
                                    <TouchableOpacity onPress={() => setReportVisible(false)}>
                                        <Ionicons name="close" size={24} color={COLORS.text} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator={false}
                                >
                                    <Text style={styles.reportSubtitle}>Why are you reporting this listing?</Text>

                                    {REPORT_TYPES.map((type) => (
                                        <TouchableOpacity
                                            key={type.key}
                                            style={[
                                                styles.reportOption,
                                                selectedReportType === type.key && styles.reportOptionSelected,
                                            ]}
                                            onPress={() => {
                                                setSelectedReportType(type.key)
                                                setReportTypeError('')
                                            }}
                                        >
                                            <Ionicons
                                                name={type.icon}
                                                size={20}
                                                color={selectedReportType === type.key ? COLORS.primary : COLORS.textSecondary}
                                            />
                                            <Text style={[
                                                styles.reportOptionText,
                                                selectedReportType === type.key && styles.reportOptionTextSelected,
                                            ]}>
                                                {type.label}
                                            </Text>
                                            {selectedReportType === type.key && (
                                                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                    {!!reportTypeError && (
                                        <Text style={styles.fieldError}>{reportTypeError}</Text>
                                    )}

                                    {!user && (
                                        <>
                                            <Text style={styles.descriptionLabel}>
                                                Your email <Text style={styles.requiredStar}>*</Text>
                                            </Text>
                                            <TextInput
                                                style={[
                                                    styles.emailInput,
                                                    !!emailError && styles.inputError,
                                                ]}
                                                placeholder="you@example.com"
                                                placeholderTextColor={COLORS.textTertiary}
                                                value={reporterEmail}
                                                onChangeText={(text) => {
                                                    setReporterEmail(text)
                                                    if (emailError) setEmailError('')
                                                }}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                            />
                                            {!!emailError && (
                                                <Text style={styles.fieldError}>{emailError}</Text>
                                            )}
                                            <Text style={styles.emailHint}>
                                                We may contact you if we need more information.
                                            </Text>
                                        </>
                                    )}

                                    <Text style={styles.descriptionLabel}>Additional details (optional)</Text>
                                    <TextInput
                                        style={styles.descriptionInput}
                                        placeholder="Tell us more about the issue..."
                                        placeholderTextColor={COLORS.textTertiary}
                                        value={reportDescription}
                                        onChangeText={setReportDescription}
                                        multiline
                                        numberOfLines={3}
                                        textAlignVertical="top"
                                    />

                                    <TouchableOpacity
                                        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                                        onPress={submitReport}
                                        disabled={submitting}
                                    >
                                        <Text style={styles.submitButtonText}>
                                            {submitting ? 'Submitting...' : 'Submit Report'}
                                        </Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </Pressable>
                        </View>
                    </Pressable>
                </KeyboardAvoidingView>
            </Modal>

            {/* Block Confirmation Modal */}
            <Modal
                visible={blockConfirmVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setBlockConfirmVisible(false)}
            >
                <View style={styles.overlay}>
                    <View style={styles.blockConfirmContainer}>
                        <View style={styles.blockIconCircle}>
                            <Ionicons name="ban-outline" size={48} color={COLORS.error} />
                        </View>

                        <Text style={styles.blockTitle}>Block User</Text>
                        <Text style={styles.blockMessage}>
                            Are you sure you want to block this user? Their listings will no longer appear on the map or in your feed. You can unblock them from your profile settings.
                        </Text>

                        <View style={styles.blockButtons}>
                            <TouchableOpacity
                                style={styles.blockCancelButton}
                                onPress={() => setBlockConfirmVisible(false)}
                            >
                                <Text style={styles.blockCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.blockConfirmButton, submitting && styles.submitButtonDisabled]}
                                onPress={confirmBlock}
                                disabled={submitting}
                            >
                                <Text style={styles.blockConfirmText}>
                                    {submitting ? 'Blocking...' : 'Block User'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Result Modal (Report/Block Success/Error) */}
            <ThemedModal
                visible={resultModal.visible}
                onClose={() => setResultModal(prev => ({ ...prev, visible: false }))}
                icon={resultModal.success ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                iconColor={resultModal.success ? COLORS.success : COLORS.error}
                title={resultModal.title}
                message={resultModal.message}
                buttons={[
                    {
                        text: 'OK',
                        style: 'primary',
                        onPress: () => {
                            const dismiss = resultModal.onDismiss
                            setResultModal(prev => ({ ...prev, visible: false }))
                            if (dismiss) dismiss()
                        },
                    },
                ]}
            />
        </>
    )
}

export default MoreOptionsButton

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    reportOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    menuContainer: {
        backgroundColor: COLORS.modalBackground || '#FFFFFF',
        borderRadius: 16,
        padding: SPACING.lg,
        width: '100%',
        maxWidth: 340,
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        paddingVertical: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    menuItemLast: {
        borderBottomWidth: 0,
    },
    menuItemText: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    reportContainer: {
        backgroundColor: COLORS.modalBackground || '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: SPACING.xl,
        width: '100%',
        maxHeight: '85%',
    },
    reportHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    reportTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    reportSubtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        marginBottom: SPACING.lg,
    },
    reportOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        padding: SPACING.lg,
        backgroundColor: COLORS.surface || '#F9FAFB',
        borderRadius: RADIUS.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    reportOptionSelected: {
        borderColor: COLORS.primary,
        backgroundColor: '#FFF1F0',
    },
    reportOptionText: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
    },
    reportOptionTextSelected: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    descriptionLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: SPACING.lg,
        marginBottom: SPACING.sm,
    },
    requiredStar: {
        color: COLORS.error,
        fontWeight: '700',
    },
    emailInput: {
        backgroundColor: COLORS.surface || '#F9FAFB',
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        fontSize: 15,
        color: COLORS.text,
    },
    inputError: {
        borderColor: COLORS.error,
    },
    fieldError: {
        fontSize: 13,
        color: COLORS.error,
        marginTop: 6,
        marginLeft: 4,
    },
    emailHint: {
        fontSize: 12,
        color: COLORS.textTertiary,
        marginTop: 6,
        marginLeft: 4,
        fontStyle: 'italic',
    },
    descriptionInput: {
        backgroundColor: COLORS.surface || '#F9FAFB',
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        fontSize: 15,
        color: COLORS.text,
        minHeight: 80,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.lg,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        marginTop: SPACING.lg,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.buttonPrimaryText || '#FFFFFF',
    },
    blockConfirmContainer: {
        backgroundColor: COLORS.modalBackground || '#FFFFFF',
        borderRadius: 16,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    blockIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    blockTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 12,
    },
    blockMessage: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    blockButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    blockCancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: COLORS.surfaceSecondary || '#F3F4F6',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    blockCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    blockConfirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: COLORS.error,
    },
    blockConfirmText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
})
