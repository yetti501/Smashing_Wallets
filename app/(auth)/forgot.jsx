import { useState } from 'react'
import { View, StyleSheet, Alert, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../constants/Colors'
import { authService } from '../../contexts/AuthContext'
import ThemedHeader from '../../components/ThemedHeader'
import ThemedTextInput from '../../components/ThemedTextInput'
import ThemedButton from '../../components/ThemedButton'
import ThemedLink from '../../components/ThemedLink'
import ThemedSafeArea from '../../components/ThemedSafeArea'

const RESET_REDIRECT_URL = 'https://smashingwallets.com/reset-password'

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('')
    const [emailError, setEmailError] = useState('')
    const [loading, setLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    const handleResetRequest = async () => {
        // Validate
        if (!email.trim()) {
            setEmailError('Email is required')
            return
        }
        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address')
            return
        }

        setLoading(true)
        setEmailError('')

        try {
            await authService.resetPassword(email.trim(), RESET_REDIRECT_URL)
            setEmailSent(true)
        } catch (error) {
            let errorMessage = 'Failed to send reset email'
            if (error.message) {
                if (error.message.includes('user_not_found') || error.message.includes('User not found')) {
                    // Don't reveal if account exists — show success anyway for security
                    setEmailSent(true)
                    return
                } else if (error.message.includes('Too many requests')) {
                    errorMessage = 'Too many requests. Please try again later.'
                } else if (error.message.includes('Network')) {
                    errorMessage = 'Network error. Please check your connection.'
                } else if (error.message.includes('SMTP') || error.message.includes('mail')) {
                    errorMessage = 'Email service is not configured. Please contact support.'
                } else {
                    errorMessage = error.message
                }
            }
            Alert.alert('Error', errorMessage)
        } finally {
            setLoading(false)
        }
    }

    if (emailSent) {
        return (
            <ThemedSafeArea centered>
                <View style={styles.successContainer}>
                    <Ionicons name="mail-outline" size={64} color={COLORS.success} />
                    <Text style={styles.successTitle}>Check Your Email</Text>
                    <Text style={styles.successMessage}>
                        If an account exists for {email.trim()}, we've sent a password reset link. Check your inbox and spam folder.
                    </Text>
                    <View style={styles.buttonGroup}>
                        <ThemedButton
                            action={() => {
                                setEmailSent(false)
                                setEmail('')
                            }}
                            buttonText="Send Again"
                        />
                        <ThemedLink
                            inputText=""
                            link="/login"
                            linkText="Back to Login"
                            loading={false}
                        />
                    </View>
                </View>
            </ThemedSafeArea>
        )
    }

    return (
        <ThemedSafeArea centered>
            <ThemedHeader
                title="Smashing Wallets"
                subtitle="Reset Password"
            />

            <View style={styles.form}>
                <Text style={styles.instructions}>
                    Enter the email address associated with your account and we'll send you a link to reset your password.
                </Text>

                <ThemedTextInput
                    label="Email"
                    placeholder="Enter your email address"
                    value={email}
                    onChangeText={(value) => {
                        setEmail(value)
                        if (emailError) setEmailError('')
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                    placeholderTextColor="#6c757d"
                    error={emailError}
                    isPassword={false}
                />

                <ThemedButton
                    action={handleResetRequest}
                    buttonText={loading ? 'Sending...' : 'Send Reset Link'}
                    loading={loading}
                    disabled={loading}
                />

                <ThemedLink
                    inputText="Remember your password? "
                    link="/login"
                    linkText="Login"
                    loading={loading}
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
    buttonGroup: {
        width: '100%',
        gap: 12,
        marginTop: 8
    }
})