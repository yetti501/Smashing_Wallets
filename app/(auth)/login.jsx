import { useState } from 'react'
import { View, StyleSheet, Modal, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useAuth } from '../../contexts/AuthContext'
import { COLORS } from '../../constants/Colors'
import ThemedHeader from '../../components/ThemedHeader'
import ThemedTextInput from '../../components/ThemedTextInput'
import ThemedButton from '../../components/ThemedButton'
import ThemedLink from '../../components/ThemedLink'
import ThemedSafeArea from '../../components/ThemedSafeArea'

export default function LoginScreen() {
    const { login } = useAuth()

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    const [errors, setErrors] = useState({
        email: '',
        password: ''
    })

    const [loading, setLoading] = useState(false)
    const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' })

    const updateFormData = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
        if(errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }))
        }
    }

    // Validate email format
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }
    // Validate form before submission
    const formValidation = () => {
        const newErrors = {
            email: '',
            password: ''
        }
        let isValid = true
        // Validate Email
        if(!formData.email.trim()){
            newErrors.email = 'Email is required'
            isValid = false
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email address'
            isValid = false
        }

        // Validate Password
        if(!formData.password) {
            newErrors.password = 'Password is required'
            isValid = false
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters'
            isValid = false
        }

        setErrors(newErrors)
        return isValid

    }

    const handleLogin = async () => {
        if(!formValidation()) {
            return
        }

        setLoading(true)

        try {
            await login(formData.email.trim(), formData.password)
            router.replace('/profile')
        } catch(error) {
            let title = 'Login Failed'
            let message = 'An error occurred during login. Please try again.'

            if(error.message) {
                if (error.message.includes('Invalid credentials') || error.message.includes('user_not_found')) {
                    title = 'Incorrect Email or Password'
                    message = 'No account found with that email, or the password is incorrect. Please double-check your credentials or sign up for a new account.'
                    setErrors({
                        email: 'Check your email address',
                        password: 'Check your password'
                    })
                } else if (error.message.includes('user_blocked')) {
                    title = 'Account Blocked'
                    message = 'Your account has been blocked. Please contact support@smashingwallets.com for assistance.'
                } else if (error.message.includes('Too many requests')) {
                    title = 'Too Many Attempts'
                    message = 'You\'ve made too many login attempts. Please wait a few minutes and try again.'
                } else if (error.message.includes('Network')) {
                    title = 'Connection Error'
                    message = 'Unable to reach the server. Please check your internet connection and try again.'
                } else {
                    message = error.message
                }
            }
            setErrorModal({ visible: true, title, message })
        } finally {
            setLoading(false)
        }
    }

    return(
        <ThemedSafeArea centered>
                <ThemedHeader
                    title="Smashing Wallets"
                />
                <View style={styles.form}>
                    {/* Email Field */}
                    <ThemedTextInput
                        label="Email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChangeText={(value) => updateFormData('email', value)}
                        keyboardType='email-address'
                        autoCapitalize='none'
                        editable={!loading}
                        placeholderTextColor='#6c757d'
                        error={errors.email}
                        isPassword={false}
                    />
                    {/* Password Field */}
                    <ThemedTextInput
                        label='Password'
                        placeholder='Enter your password'
                        value={formData.password}
                        onChangeText={(value) => updateFormData('password', value)}
                        autoCapitalize='none'
                        editable={!loading}
                        placeholderTextColor='#6c757d'
                        error={errors.password}
                        isPassword={true}
                    />
                    {/* Login Button */}
                    <ThemedButton
                        action={handleLogin}
                        buttonText={loading ? 'Sign in...' : 'Sign in'}
                        loading={loading}
                        disabled={loading}
                    />

                    {/* Forgot Password Link */}
                    <ThemedLink
                        inputText={'Forgot Your Password? '}
                        link='/forgot'
                        linkText='Reset Password'
                        loading={loading}
                    />
                    {/* Sign Up Link */}
                    <ThemedLink
                        inputText={'Don\'t have an account? '}
                        link='/register'
                        linkText='Sign Up'
                        loading={loading}
                    />
                </View>

                {/* Error Modal */}
                <Modal
                    visible={errorModal.visible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setErrorModal(prev => ({ ...prev, visible: false }))}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalIconContainer}>
                                <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
                            </View>
                            <Text style={styles.modalTitle}>{errorModal.title}</Text>
                            <Text style={styles.modalMessage}>{errorModal.message}</Text>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={() => setErrorModal(prev => ({ ...prev, visible: false }))}
                            >
                                <Text style={styles.modalButtonText}>Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
        </ThemedSafeArea>
    )

}

const styles = StyleSheet.create({
    form: {
        width: '100%',
        gap: 16
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: COLORS.modalBackground,
        borderRadius: 16,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    modalIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 12,
    },
    modalMessage: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    modalButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: 48,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    modalButtonText: {
        color: COLORS.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
})