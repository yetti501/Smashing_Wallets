import React, { useState } from 'react'
import {router } from 'expo-router'
import { View, StyleSheet, Alert } from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import ThemedLink from '../../components/ThemedLink'
import ThemedHeader from '../../components/ThemedHeader'
import ThemedTextInput from '../../components/ThemedTextInput'
import ThemedButton from '../../components/ThemedButton'
import ThemedSafeArea from '../../components/ThemedSafeArea'

export default function RegisterScreen() {
    const { register } = useAuth()
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        fullName: '',
        email: '', 
        password: '',
        confirmPassword: ''
    })

    const [errors, setErrors] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
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
            confirmPassword: ''
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
        Alert.alert('Registration Failed', errorMessage)
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
            {/* Submit Button */}
            <ThemedButton
                action={handleRegister}
                buttonText={loading ? 'Creating Account...' : 'Create Account'}
                loading={loading}
                diabled={loading}
            />

            {/* Return to Login Page */}
            <ThemedLink
                inputText={'Already have an acount? '}
                link='/login'
                linkText='Login'
                loading={loading}
            />
        </View>
</ThemedSafeArea>
);
}

const styles = StyleSheet.create({
    form: {
        width: '100%',
        gap: 16
    },
});