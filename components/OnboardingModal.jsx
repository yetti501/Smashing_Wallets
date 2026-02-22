import { useState, useEffect } from 'react'
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { COLORS, SPACING, RADIUS } from '../constants/Colors'
import { useAuth } from '../contexts/AuthContext'

const ONBOARDING_COMPLETE_KEY = '@smashing_wallets_onboarding_complete'

/**
 * Onboarding modal for first-time users
 * Handles device location permission request
 */
const OnboardingModal = ({ onComplete }) => {
    const { user, updateUserPreferences } = useAuth()
    const [visible, setVisible] = useState(false)
    // Steps: 'welcome' | 'location' | 'permissionGranted' | 'permissionDenied' | 'complete'
    const [step, setStep] = useState('welcome')
    const [loading, setLoading] = useState(false)
    const [checkingOnboarding, setCheckingOnboarding] = useState(true)

    useEffect(() => {
        checkOnboardingStatus()
    }, [])

    const checkOnboardingStatus = async () => {
        try {
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
                // Show the granted result screen - user must tap to continue
                setStep('permissionGranted')
            } else {
                // Show the denied result screen - user must tap to continue
                setStep('permissionDenied')
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to request location permission')
            setStep('permissionDenied')
        } finally {
            setLoading(false)
        }
    }

    const handleGrantedContinue = async () => {
        await markOnboardingComplete()
        setStep('complete')
    }

    const markOnboardingComplete = async () => {
        try {
            await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true')
        } catch (error) {
            console.error('Error completing onboarding:', error)
        }
    }

    const handleClose = () => {
        setVisible(false)
        if (onComplete) onComplete()
    }

    // ===== RENDER FUNCTIONS =====

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
        </View>
    )

    const renderPermissionGranted = () => (
        <View style={styles.stepContainer}>
            <View style={[styles.iconCircle, styles.successCircle]}>
                <Ionicons name="checkmark" size={48} color="#FFFFFF" />
            </View>
            
            <Text style={styles.title}>Location Enabled!</Text>
            
            <Text style={styles.description}>
                Thanks for enabling location access!
                {'\n\n'}
                We'll use your location to show you yard sales, estate sales, and other events happening near you.
                {'\n\n'}
                Your location is never shared with other users.
            </Text>

            <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleGrantedContinue}
            >
                <Text style={styles.primaryButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.buttonPrimaryText} />
            </TouchableOpacity>
        </View>
    )

    const handleDeniedContinue = async () => {
        await markOnboardingComplete()
        setStep('complete')
    }

    const renderPermissionDenied = () => (
        <View style={styles.stepContainer}>
            <View style={[styles.iconCircle, styles.warningCircle]}>
                <Ionicons name="location-outline" size={48} color="#FFFFFF" />
            </View>

            <Text style={styles.title}>No Problem!</Text>

            <Text style={styles.description}>
                You can still use Smashing Wallets without location access, but some features may be limited.
                {'\n\n'}
                You can enable location access later in your device settings.
            </Text>

            <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleRequestLocation}
            >
                <Text style={styles.primaryButtonText}>Try Location Again</Text>
                <Ionicons name="navigate" size={20} color={COLORS.buttonPrimaryText} />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleDeniedContinue}
            >
                <Text style={styles.secondaryButtonText}>Continue Without Location</Text>
            </TouchableOpacity>
        </View>
    )

    const renderComplete = () => (
        <View style={styles.stepContainer}>
            <View style={[styles.iconCircle, styles.successCircle]}>
                <Ionicons name="rocket-outline" size={48} color="#FFFFFF" />
            </View>
            
            <Text style={styles.title}>You're All Set!</Text>
            
            <Text style={styles.description}>
                Start exploring local events and find great deals in your area.
            </Text>

            <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleClose}
            >
                <Text style={styles.primaryButtonText}>Start Exploring</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.buttonPrimaryText} />
            </TouchableOpacity>
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
                    {step === 'permissionGranted' && renderPermissionGranted()}
                    {step === 'permissionDenied' && renderPermissionDenied()}
                    {step === 'complete' && renderComplete()}
                    
                    {/* Progress dots - show for first 2 steps only */}
                    {(step === 'welcome' || step === 'location') && (
                        <View style={styles.progressDots}>
                            <View style={[styles.dot, step === 'welcome' && styles.dotActive]} />
                            <View style={[styles.dot, step === 'location' && styles.dotActive]} />
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
    warningCircle: {
        backgroundColor: COLORS.warning || '#F59E0B',
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
    secondaryButton: {
        paddingVertical: SPACING.md,
    },
    secondaryButtonText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
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