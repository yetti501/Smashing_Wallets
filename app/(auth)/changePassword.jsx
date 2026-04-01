import { useState } from 'react'
import { View, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SPACING } from '../../constants/Colors'
import { useAuth } from '../../contexts/AuthContext'
import ThemedTextInput from '../../components/ThemedTextInput'
import ThemedButton from '../../components/ThemedButton'
import ThemedSafeArea from '../../components/ThemedSafeArea'

export default function ChangePasswordScreen() {
    const { updateUserPassword } = useAuth()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const [errors, setErrors] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const formValidation = () => {
        const newErrors = { currentPassword: '', newPassword: '', confirmPassword: '' }
        let isValid = true

        if (!formData.currentPassword) {
            newErrors.currentPassword = 'Current password is required'
            isValid = false
        }

        if (!formData.newPassword) {
            newErrors.newPassword = 'New password is required'
            isValid = false
        } else if (formData.newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters'
            isValid = false
        } else if (formData.newPassword === formData.currentPassword) {
            newErrors.newPassword = 'New password must be different from current password'
            isValid = false
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your new password'
            isValid = false
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
            isValid = false
        }

        setErrors(newErrors)
        return isValid
    }

    const handleChangePassword = async () => {
        if (!formValidation()) return

        setLoading(true)

        try {
            await updateUserPassword(formData.newPassword, formData.currentPassword)
            setSuccess(true)
        } catch (error) {
            let errorMessage = 'Failed to change password'
            if (error.message) {
                if (error.code === 401 || error.message.includes('Invalid credentials')) {
                    errorMessage = 'Current password is incorrect'
                    setErrors(prev => ({ ...prev, currentPassword: 'Incorrect password' }))
                } else if (error.message.includes('Password')) {
                    errorMessage = error.message
                }
            }
            Alert.alert('Error', errorMessage)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <ThemedSafeArea centered>
                <View style={styles.successContainer}>
                    <Ionicons name="checkmark-circle-outline" size={64} color={COLORS.success} />
                    <Text style={styles.successTitle}>Password Changed</Text>
                    <Text style={styles.successMessage}>
                        Your password has been successfully updated.
                    </Text>
                </View>
                <View style={styles.form}>
                    <ThemedButton
                        action={() => router.back()}
                        buttonText="Back to Profile"
                    />
                </View>
            </ThemedSafeArea>
        )
    }

    return (
        <ThemedSafeArea>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Change Password</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.formContainer}>
            <View style={styles.form}>
                <ThemedTextInput
                    label="Current Password"
                    placeholder="Enter your current password"
                    value={formData.currentPassword}
                    onChangeText={(value) => updateFormData('currentPassword', value)}
                    keyboardType="default"
                    autoCapitalize="none"
                    editable={!loading}
                    placeholderTextColor="#6c757d"
                    error={errors.currentPassword}
                    isPassword={true}
                />

                <ThemedTextInput
                    label="New Password"
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChangeText={(value) => updateFormData('newPassword', value)}
                    keyboardType="default"
                    autoCapitalize="none"
                    editable={!loading}
                    placeholderTextColor="#6c757d"
                    error={errors.newPassword}
                    isPassword={true}
                />

                <ThemedTextInput
                    label="Confirm New Password"
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChangeText={(value) => updateFormData('confirmPassword', value)}
                    keyboardType="default"
                    autoCapitalize="none"
                    editable={!loading}
                    placeholderTextColor="#6c757d"
                    error={errors.confirmPassword}
                    isPassword={true}
                />

                <ThemedButton
                    action={handleChangePassword}
                    buttonText={loading ? 'Updating...' : 'Update Password'}
                    loading={loading}
                    disabled={loading}
                />
            </View>
            </View>
        </ThemedSafeArea>
    )
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: SPACING.sm,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    placeholder: {
        width: 40,
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: SPACING.lg,
    },
    form: {
        width: '100%',
        gap: 16
    },
    successContainer: {
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: 20
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 8
    },
    successMessage: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20
    }
})