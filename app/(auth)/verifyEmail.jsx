import { useState, useEffect } from 'react'
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../constants/Colors'
import { useAuth } from '../../contexts/AuthContext'
import ThemedButton from '../../components/ThemedButton'
import ThemedSafeArea from '../../components/ThemedSafeArea'

export default function VerifyEmailScreen() {
    const { userId, secret } = useLocalSearchParams()
    const { confirmEmailVerification, user } = useAuth()
    const [status, setStatus] = useState('ready') // 'ready' | 'verifying' | 'success' | 'error'
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        if (!userId || !secret) {
            setStatus('error')
            setErrorMessage('Invalid verification link. Please check your email and try again.')
        }
    }, [userId, secret])

    const handleVerification = async () => {
        setStatus('verifying')
        try {
            await confirmEmailVerification(userId, secret)
            setStatus('success')
        } catch (error) {
            setStatus('error')
            if (error.message?.includes('expired') || error.message?.includes('Invalid token')) {
                setErrorMessage('This verification link has expired. Please request a new one from your profile.')
            } else {
                setErrorMessage('Verification failed. The link may have already been used or expired.')
            }
        }
    }

    const handleContinue = () => {
        if (user) {
            router.replace('/profile')
        } else {
            router.replace('/login')
        }
    }

    if (status === 'ready') {
        return (
            <ThemedSafeArea centered>
                <View style={styles.container}>
                    <Ionicons name="mail-outline" size={64} color={COLORS.primary} />
                    <Text style={styles.title}>Confirm Your Email</Text>
                    <Text style={styles.message}>
                        Tap the button below to verify your email address and activate your account.
                    </Text>
                    <ThemedButton
                        action={handleVerification}
                        buttonText="Verify My Email"
                    />
                </View>
            </ThemedSafeArea>
        )
    }

    if (status === 'verifying') {
        return (
            <ThemedSafeArea centered>
                <View style={styles.container}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.title}>Verifying Email...</Text>
                    <Text style={styles.message}>Please wait while we verify your email address.</Text>
                </View>
            </ThemedSafeArea>
        )
    }

    if (status === 'success') {
        return (
            <ThemedSafeArea centered>
                <View style={styles.container}>
                    <Ionicons name="checkmark-circle-outline" size={64} color={COLORS.success} />
                    <Text style={styles.title}>Email Verified</Text>
                    <Text style={styles.message}>
                        Your email address has been successfully verified. Thank you!
                    </Text>
                    <ThemedButton
                        action={handleContinue}
                        buttonText="Continue"
                    />
                </View>
            </ThemedSafeArea>
        )
    }

    return (
        <ThemedSafeArea centered>
            <View style={styles.container}>
                <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
                <Text style={styles.title}>Verification Failed</Text>
                <Text style={styles.message}>{errorMessage}</Text>
                <ThemedButton
                    action={handleContinue}
                    buttonText="Continue"
                />
            </View>
        </ThemedSafeArea>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: 20
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 8
    },
    message: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20
    }
})