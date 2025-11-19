import { useState } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuth } from '../../contexts/AuthContext'
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
            // await authService.login(formData.email.trim(), formData.password)
            await login(formData.email.trim(), formData.password)
            // Alert.alert('Success', 'Logged in successfully!')
            router.replace('/profile') // Navigate to home after successful login
        } catch(error) {
            // Login error handling
            let errorMessage = 'An error occurred during login'

            if(error.message) {
                if (error.message.includes('Invalid credentials')) { 
                    errorMessage = 'Invalid email or password'
                    setErrors({
                        email: 'Please check your credentials',
                        password: 'Please check your credentials'
                    })
                } else if (error.message.includes('user_blocked')) {
                    errorMessage = 'Your account has been blocked. Please contact support.'
                } else if (error.message.includes('Too many requests')) {
                    errorMessage = 'Too many login attempts. Please try again later.'
                } else if (error.message.includes('Network')) {
                    errorMessage = 'Network error. Please check your connection.'
                } else {
                    errorMessage = error.message
                }
            }
            Alert.alert('Login Failed', errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return(
        <ThemedSafeArea centered>
                <ThemedHeader 
                    title="Smashing Wallets"
                    // subtitle="Login"
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

        </ThemedSafeArea>
    )

}

const styles = StyleSheet.create({
    form: {
        width: '100%', 
        gap: 16
    }
})