import React, { useState } from 'react'
import { View, StyleSheet, Alert, Text } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../constants/Colors'
import { authService } from '../../contexts/AuthContext'
import ThemedHeader from '../../components/ThemedHeader'
import ThemedTextInput from '../../components/ThemedTextInput'
import ThemedButton from '../../components/ThemedButton'
import ThemedLink from '../../components/ThemedLink'
import ThemedSafeArea from '../../components/ThemedSafeArea'

export default function ResetPasswordScreen() {
    const { userId, secret } = useLocalSearchParams()
    const [loading, setLoading] = useState(false)
    const [resetComplete, setResetComplete] = useState(false)

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    })

    const [errors, setErrors] = useState({
        password: '',
        confirmPassword: ''
    })

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    // If opened without params (e.g. navigated directly), show an error
    if (!userId || !secret) {
        return (
            <ThemedSafeArea centered>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
                    <Text style={styles.errorTitle}>Invalid Reset Link</Text>
                    <Text style={styles.errorMessage}>
                        This password reset link is invalid or has expired. Please request a new one.
                    </Text>
                    <ThemedButton
                        action={() => router.replace('/forgot')}
                        buttonText="Request New Link"
                    />
                </View>
            </ThemedSafeArea>
        )
    }

    const formValidation = () => {
        const newErrors = { password: '', confirmPassword: '' }
        let isValid = true

        if (!formData.password) {
            newErrors.password = 'Password is required'
            isValid = false
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters'
            isValid = false
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password'
            isValid = false
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
            isValid = false
        }

        setErrors(newErrors)
        return isValid
    }

    const handleResetPassword = async () => {
        if (!formValidation()) return

        setLoading(true)

        try {
            await authService.completePasswordRecovery(userId, secret, formData.password)
            setResetComplete(true)
        } catch (error) {
            let errorMessage = 'Failed to reset password'
            if (error.message) {
                if (error.message.includes('expired') || error.message.includes('Invalid token')) {
                    errorMessage = 'This reset link has expired. Please request a new one.'
                } else if (error.message.includes('Password')) {
                    errorMessage = error.message
                }
            }
            Alert.alert('Reset Failed', errorMessage)
        } finally {
            setLoading(false)
        }
    }

    if (resetComplete) {
        return (
            <ThemedSafeArea centered>
                <View style={styles.successContainer}>
                    <Ionicons name="checkmark-circle-outline" size={64} color={COLORS.success} />
                    <Text style={styles.successTitle}>Password Reset</Text>
                    <Text style={styles.successMessage}>
                        Your password has been successfully updated. You can now log in with your new password.
                    </Text>
                    <ThemedButton
                        action={() => router.replace('/login')}
                        buttonText="Go to Login"
                    />
                </View>
            </ThemedSafeArea>
        )
    }

    return (
        <ThemedSafeArea centered>
            <ThemedHeader
                title="Smashing Wallets"
                subtitle="New Password"
            />

            <View style={styles.form}>
                <Text style={styles.instructions}>
                    Enter your new password below.
                </Text>

                <ThemedTextInput
                    label="New Password"
                    placeholder="Enter new password"
                    value={formData.password}
                    onChangeText={(value) => updateFormData('password', value)}
                    keyboardType="default"
                    autoCapitalize="none"
                    editable={!loading}
                    placeholderTextColor="#6c757d"
                    error={errors.password}
                    isPassword={true}
                />

                <ThemedTextInput
                    label="Confirm Password"
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
                    action={handleResetPassword}
                    buttonText={loading ? 'Resetting...' : 'Reset Password'}
                    loading={loading}
                    disabled={loading}
                />
            </View>
        </ThemedSafeArea>
    )
}

const styles = StyleSheet.create({
    form: {
        width: '100%',
        gap: 16
    },
    instructions: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 8
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
    },
    errorContainer: {
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: 20
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 8
    },
    errorMessage: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20
    }
})