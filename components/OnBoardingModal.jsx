import { useState, useEffect } from 'react'
import { 
    View, 
    Text, 
    StyleSheet, 
    Modal, 
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { COLORS, SPACING, RADIUS } from '../constants/Colors'
import { useAuth } from '../contexts/AuthContext'

const ONBOARDING_COMPLETE_KEY = '@smashing_wallets_onboarding_complete'

/**
 * Onboarding modal for first-time users
 * Handles location permission and manual zip code fallback
 */
const OnboardingModal = ({ onComplete }) => {
    const { user, updateUserPreferences } = useAuth()
    const [visible, setVisible] = useState(false)
    const [step, setStep] = useState('welcome') // 'welcome' | 'location' | 'manual' | 'complete'
    const [loading, setLoading] = useState(false)
    const [zipCode, setZipCode] = useState('')
    const [checkingOnboarding, setCheckingOnboarding] = useState(true)

    useEffect(() => {
        checkOnboardingStatus()
    }, [])

    const checkOnboardingStatus = async () => {
        try {
            // Check if onboarding has been completed
            const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY)
            
            if (!completed) {
                setVisible(true)
            }
        } catch (error) {
            console.error('Error checking onboarding status:', error)
        } finally {
            setCheckingOnboarding(false)
        }
    }

    const handleRequestLocation = async () => {
        setLoading(true)
        try {
            const { status } = await Location.requestForegroundPermissionsAsync()
            
            if (status === 'granted') {
                // Save preference
                if (user) {
                    await updateUserPreferences({
                        ...user.prefs,
                        locationMode: 'device',
                        manualZipCode: null
                    })
                }
                await completeOnboarding()
            } else {
                // Permission denied, show manual option
                setStep('manual')
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to request location permission')
            setStep('manual')
        } finally {
            setLoading(false)
        }
    }

    const handleUseManualLocation = () => {
        setStep('manual')
    }

    const handleSaveZipCode = async () => {
        // Validate zip code (US format: 5 digits)
        const zipRegex = /^\d{5}$/
        if (!zipRegex.test(zipCode)) {
            Alert.alert('Invalid Zip Code', 'Please enter a valid 5-digit zip code')
            return
        }

        setLoading(true)
        try {
            if (user) {
                await updateUserPreferences({
                    ...user.prefs,
                    locationMode: 'manual',
                    manualZipCode: zipCode
                })
            } else {
                // Store locally for non-logged in users
                await AsyncStorage.setItem('@smashing_wallets_zip', zipCode)
            }
            await completeOnboarding()
        } catch (error) {
            Alert.alert('Error', 'Failed to save location preference')
        } finally {
            setLoading(false)
        }
    }

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true')
            setStep('complete')
            
            // Small delay to show success state
            setTimeout(() => {
                setVisible(false)
                if (onComplete) onComplete()
            }, 1500)
        } catch (error) {
            console.error('Error completing onboarding:', error)
        }
    }

    const renderWelcome = () => (
        <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
                <Ionicons name="wallet-outline" size={48} color={COLORS.primary} />
            </View>
            
            <Text style={styles.title}>Welcome to Smashing Wallets!</Text>
            
            <Text style={styles.description}>
                Discover yard sales, swap meets, estate sales, and local events happening near you. 
                Save money and find great deals in your neighborhood!
            </Text>

            <View style={styles.featureList}>
                <View style={styles.featureItem}>
                    <Ionicons name="map-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.featureText}>Find events on an interactive map</Text>
                </View>
                <View style={styles.featureItem}>
                    <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.featureText}>Get notified about nearby events</Text>
                </View>
                <View style={styles.featureItem}>
                    <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.featureText}>Post your own events for free</Text>
                </View>
            </View>

            <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => setStep('location')}
            >
                <Text style={styles.primaryButtonText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.buttonPrimaryText} />
            </TouchableOpacity>
        </View>
    )

    const renderLocation = () => (
        <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
                <Ionicons name="location-outline" size={48} color={COLORS.primary} />
            </View>
            
            <Text style={styles.title}>Enable Location</Text>
            
            <Text style={styles.description}>
                To show you events happening nearby, we need access to your location. 
                Your location is only used to find local events and is never shared with other users.
            </Text>

            <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleRequestLocation}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={COLORS.buttonPrimaryText} />
                ) : (
                    <>
                        <Ionicons name="navigate" size={20} color={COLORS.buttonPrimaryText} />
                        <Text style={styles.primaryButtonText}>Use My Location</Text>
                    </>
                )}
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleUseManualLocation}
                disabled={loading}
            >
                <Text style={styles.secondaryButtonText}>Enter Zip Code Instead</Text>
            </TouchableOpacity>
        </View>
    )

    const renderManual = () => (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.stepContainer}
        >
            <View style={styles.iconCircle}>
                <Ionicons name="keypad-outline" size={48} color={COLORS.primary} />
            </View>
            
            <Text style={styles.title}>Enter Your Zip Code</Text>
            
            <Text style={styles.description}>
                We'll use this to show you events in your area. You can change this anytime in your profile settings.
            </Text>

            <TextInput
                style={styles.zipInput}
                placeholder="Enter 5-digit zip code"
                placeholderTextColor={COLORS.textTertiary}
                value={zipCode}
                onChangeText={setZipCode}
                keyboardType="number-pad"
                maxLength={5}
                autoFocus
            />

            <TouchableOpacity 
                style={[
                    styles.primaryButton,
                    zipCode.length !== 5 && styles.buttonDisabled
                ]}
                onPress={handleSaveZipCode}
                disabled={loading || zipCode.length !== 5}
            >
                {loading ? (
                    <ActivityIndicator color={COLORS.buttonPrimaryText} />
                ) : (
                    <Text style={styles.primaryButtonText}>Continue</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => setStep('location')}
                disabled={loading}
            >
                <Text style={styles.secondaryButtonText}>← Use Device Location Instead</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    )

    const renderComplete = () => (
        <View style={styles.stepContainer}>
            <View style={[styles.iconCircle, styles.successCircle]}>
                <Ionicons name="checkmark" size={48} color="#FFFFFF" />
            </View>
            
            <Text style={styles.title}>You're All Set!</Text>
            
            <Text style={styles.description}>
                Start exploring local events and find great deals in your area.
            </Text>
        </View>
    )

    if (checkingOnboarding) {
        return null
    }

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={() => {}}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {step === 'welcome' && renderWelcome()}
                    {step === 'location' && renderLocation()}
                    {step === 'manual' && renderManual()}
                    {step === 'complete' && renderComplete()}
                    
                    {/* Progress dots */}
                    {step !== 'complete' && (
                        <View style={styles.progressDots}>
                            <View style={[styles.dot, step === 'welcome' && styles.dotActive]} />
                            <View style={[styles.dot, (step === 'location' || step === 'manual') && styles.dotActive]} />
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    )
}

export default OnboardingModal

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    modal: {
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.xl,
        width: '100%',
        maxWidth: 400,
        padding: SPACING.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    stepContainer: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: COLORS.surfaceSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    successCircle: {
        backgroundColor: COLORS.success || '#22C55E',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    description: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SPACING.xl,
    },
    featureList: {
        width: '100%',
        marginBottom: SPACING.xl,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    featureText: {
        fontSize: 14,
        color: COLORS.text,
        flex: 1,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: RADIUS.md,
        width: '100%',
        marginBottom: SPACING.md,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.buttonPrimaryText,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    secondaryButton: {
        paddingVertical: SPACING.md,
    },
    secondaryButtonText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
    },
    zipInput: {
        width: '100%',
        backgroundColor: COLORS.surface,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        color: COLORS.text,
        marginBottom: SPACING.lg,
        letterSpacing: 8,
    },
    progressDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.sm,
        marginTop: SPACING.lg,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.border,
    },
    dotActive: {
        backgroundColor: COLORS.primary,
        width: 24,
    },
})