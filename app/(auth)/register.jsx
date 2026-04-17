import React, { useState } from 'react'
import {router } from 'expo-router'
import { View, StyleSheet, TouchableOpacity, Text, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { COLORS } from '../../constants/Colors'
import ThemedModal from '../../components/ThemedModal'
import ThemedLink from '../../components/ThemedLink'
import ThemedHeader from '../../components/ThemedHeader'
import ThemedTextInput from '../../components/ThemedTextInput'
import ThemedButton from '../../components/ThemedButton'
import ThemedSafeArea from '../../components/ThemedSafeArea'

export default function RegisterScreen() {
    const { register } = useAuth()
    const [loading, setLoading] = useState(false)
    const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' })

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [agreedToTerms, setAgreedToTerms] = useState(false)

    const [errors, setErrors] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        terms: '',
    })

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

    const formValidation = () => {
        const newErrors = {
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
            terms: '',
        }

        let isValid = true
        
        // Validate Full Name
        if(!formData.fullName.trim()){
            newErrors.fullName = 'Full Name is required'
            isValid = false
        }
        // Validate email
        if(!formData.email.trim()){
            newErrors.email = 'Email is required'
            isValid = false
        } else if (!validateEmail(formData.email)){
            newErrors.email = 'Please enter a valid email address'
            isValid = false
        }
        // Validate Password
        if(!formData.password){
            newErrors.password = 'Password is required'
            isValid = false
        } else if(formData.password.length < 8){
            newErrors.password = 'Password must be at least 8 characters'
            isValid = false
        } 
        // Validate Confirm Password
        if(!formData.confirmPassword){
            newErrors.confirmPassword = 'Confirm Password is required'
            isValid = false
        } else if(formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
            isValid = false
        }
        // Validate EULA agreement
        if (!agreedToTerms) {
            newErrors.terms = 'You must agree to the terms to create an account'
            isValid = false
        }

        setErrors(newErrors)
        return isValid
    }

    const handleRegister = async () => {
    if(!formValidation()) {
        return
    }

    setLoading(true)

    try{
        await register(formData.email.trim(), formData.password, formData.fullName.trim())
        router.replace('/profile')
    } catch (error) {
        let errorMessage = 'An error occurred during registration'
        
        if(error.message) {
            if(error.message.includes('user already exists')) {
                    errorMessage = 'An account with this email already exists'
                } else if(error.message.includes('Invalid email')) {
                    errorMessage = 'Please enter a valid email address'
                } else if(error.message.includes('Password')) {
                    errorMessage = error.message
                } else {
                    errorMessage = error.message
                }
        }
        setErrorModal({ visible: true, title: 'Registration Failed', message: errorMessage })
    } finally {
        setLoading(false)
    }
};

return (
    <ThemedSafeArea centered>
        <ThemedHeader 
            title="Smashing Wallets"
            subtitle="Register"
        />

        <View style={styles.form}>
            {/* Full Name */}
            <ThemedTextInput
                label="Full Name"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChangeText={(value) => updateFormData('fullName', value)}
                keyboardType='default'
                autoCapitalize='words'
                editable={!loading}
                placeholderTextColor='#6c757d'
                error={errors.fullName}
                isPassword={false}
            />

            {/* Email */}
            <ThemedTextInput
                label="Email"
                placeholder="Enter your email address"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                keyboardType='email-address'
                autoCapitalize='none'
                editable={!loading}
                placeholderTextColor='#6c757d'
                error={errors.email}
                isPassword={false}
            />

            {/* Password */}
            <ThemedTextInput
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                keyboardType='default'
                autoCapitalize='none'
                editable={!loading}
                placeholderTextColor='#6c757d'
                error={errors.password}
                isPassword={true}
            />

            {/* Confirm Password */}
            <ThemedTextInput
                label="Confirm Password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                keyboardType='default'
                autoCapitalize='none'
                editable={!loading}
                placeholderTextColor='#6c757d'
                error={errors.confirmPassword}
                isPassword={true}
            />
            {/* EULA & Age Confirmation */}
            <View style={styles.termsContainer}>
                <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => {
                        setAgreedToTerms(!agreedToTerms)
                        if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }))
                    }}
                    activeOpacity={0.7}
                    disabled={loading}
                >
                    <Ionicons
                        name={agreedToTerms ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={errors.terms ? COLORS.error : agreedToTerms ? COLORS.primary : COLORS.textSecondary}
                    />
                </TouchableOpacity>
                <View style={styles.termsTextContainer}>
                    <Text style={styles.termsText}>
                        I am 18 years or older and agree to the{' '}
                        <Text
                            style={styles.termsLink}
                            onPress={() => router.push('/termsOfService')}
                        >
                            Terms of Service
                        </Text>
                        {' '}and{' '}
                        <Text
                            style={styles.termsLink}
                            onPress={() => router.push('/privacyPolicy')}
                        >
                            Privacy Policy
                        </Text>
                    </Text>
                    {!!errors.terms && (
                        <Text style={styles.termsError}>{errors.terms}</Text>
                    )}
                </View>
            </View>

            {/* Submit Button */}
            <ThemedButton
                action={handleRegister}
                buttonText={loading ? 'Creating Account...' : 'Create Account'}
                loading={loading}
                disabled={loading}
            />

            {/* Return to Login Page */}
            <ThemedLink
                inputText={'Already have an account?'}
                link='/login'
                linkText='Login'
                loading={loading}
            />
        </View>

        <ThemedModal
            visible={errorModal.visible}
            onClose={() => setErrorModal(prev => ({ ...prev, visible: false }))}
            icon="alert-circle-outline"
            iconColor={COLORS.error}
            title={errorModal.title}
            message={errorModal.message}
            buttons={[{ text: 'OK', style: 'primary', onPress: () => setErrorModal(prev => ({ ...prev, visible: false })) }]}
        />
</ThemedSafeArea>
);
}

const styles = StyleSheet.create({
    form: {
        width: '100%',
        gap: 16
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    checkbox: {
        paddingTop: 2,
    },
    termsTextContainer: {
        flex: 1,
    },
    termsText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    termsLink: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    termsError: {
        fontSize: 13,
        color: COLORS.error,
        marginTop: 4,
    },
});