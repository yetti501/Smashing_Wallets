import { useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { COLORS, SPACING, RADIUS } from '../constants/Colors'
import { useAuth } from '../contexts/AuthContext'
import googlePlacesService from '../lib/googlePlacesService'

/**
 * Splash screen shown on every launch until the user grants persistent
 * location permission ("Allow While Using App" / "Always Allow").
 *
 * Flow:
 *   1. "Use My Location" → OS permission dialog
 *      - Granted → proceed to app (splash won't show next launch if still granted)
 *      - Denied  → zip code entry page
 *   2. Zip code page
 *      - Enter valid zip → save coords, proceed to app
 *      - Skip             → use default fallback coords, proceed to app
 */
const OnboardingScreen = ({ onComplete }) => {
    const { user, updateUserPreferences } = useAuth()
    // Steps: 'location' | 'zipCode'
    const [step, setStep] = useState('location')
    const [loading, setLoading] = useState(false)
    const [zipCode, setZipCode] = useState('')

    const handleRequestLocation = async () => {
        setLoading(true)

        try {
            const current = await Location.getForegroundPermissionsAsync()

            if (current.status === 'denied' && !current.canAskAgain) {
                // Permission permanently denied — OS won't show the dialog again
                setLoading(false)
                Alert.alert(
                    'Location Permission Required',
                    'You previously denied location access. To enable it, please open your device settings and allow location for Smashing Wallets.',
                    [
                        { text: 'Open Settings', onPress: () => Linking.openSettings() },
                        { text: 'Enter Zip Code', onPress: () => setStep('zipCode') },
                    ]
                )
                return
            }

            const { status } = await Location.requestForegroundPermissionsAsync()

            if (status === 'granted') {
                if (user) {
                    await updateUserPreferences({
                        ...user.prefs,
                        locationMode: 'device',
                        manualZipCode: null,
                    })
                }
                if (onComplete) onComplete()
            } else {
                // Denied or "Allow Once" expired — go to zip code entry
                setStep('zipCode')
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to request location permission')
            setStep('zipCode')
        } finally {
            setLoading(false)
        }
    }

    const handleSaveZipCode = async () => {
        const zipRegex = /^\d{5}$/
        if (!zipRegex.test(zipCode)) {
            Alert.alert('Invalid Zip Code', 'Please enter a valid 5-digit zip code.')
            return
        }

        setLoading(true)
        try {
            const geocodeResult = await googlePlacesService.geocodeAddress(zipCode)

            if (!geocodeResult || !geocodeResult.latitude || !geocodeResult.longitude) {
                Alert.alert('Invalid Zip Code', 'Could not find a location for that zip code. Please try a different one.')
                setLoading(false)
                return
            }

            await AsyncStorage.setItem('@smashing_wallets_zip', zipCode)
            await AsyncStorage.setItem(
                '@smashing_wallets_zip_coords',
                JSON.stringify({
                    latitude: geocodeResult.latitude,
                    longitude: geocodeResult.longitude,
                })
            )

            if (user) {
                await updateUserPreferences({
                    ...user.prefs,
                    locationMode: 'manual',
                    manualZipCode: zipCode,
                })
            }

            if (onComplete) onComplete()
        } catch (error) {
            Alert.alert('Error', 'Failed to save zip code. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleSkipZipCode = () => {
        // Use default fallback coordinates (set in map.jsx)
        if (onComplete) onComplete()
    }

    // ===== RENDER: Location splash =====
    const renderLocation = () => (
        <View style={styles.content}>
            <View style={styles.iconCircle}>
                <Ionicons name="location-outline" size={64} color={COLORS.primary} />
            </View>

            <Text style={styles.title}>Enable Location</Text>

            <Text style={styles.description}>
                To show you yard sales, estate sales, and other events
                happening nearby, we need access to your location.
                {'\n\n'}
                Your location is only used to find local events and is
                never shared with other users.
            </Text>

            <View style={styles.buttonContainer}>
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
        </View>
    )

    // ===== RENDER: Zip code fallback =====
    const renderZipCode = () => (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.content}
        >
            <View style={[styles.iconCircle, styles.warningCircle]}>
                <Ionicons name="keypad-outline" size={64} color="#FFFFFF" />
            </View>

            <Text style={styles.title}>Enter Your Zip Code</Text>

            <Text style={styles.description}>
                We'll use your zip code to show you events in your area.
                {'\n\n'}
                You can change this anytime in your profile settings, or
                grant location access in your device settings.
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

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[
                        styles.primaryButton,
                        zipCode.length !== 5 && styles.buttonDisabled,
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
                    onPress={handleSkipZipCode}
                    disabled={loading}
                >
                    <Text style={styles.secondaryButtonText}>Skip</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setStep('location')}
                    disabled={loading}
                >
                    <Text style={styles.secondaryButtonText}>
                        ← Use Device Location Instead
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    )

    return (
        <SafeAreaView style={styles.container}>
            {step === 'location' && renderLocation()}
            {step === 'zipCode' && renderZipCode()}
        </SafeAreaView>
    )
}

export default OnboardingScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.surfaceSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    warningCircle: {
        backgroundColor: COLORS.warning || '#F59E0B',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    description: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: SPACING.xl,
    },
    buttonContainer: {
        width: '100%',
        marginTop: 'auto',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        borderRadius: RADIUS.md,
        width: '100%',
        marginBottom: SPACING.md,
    },
    primaryButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.buttonPrimaryText,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    secondaryButton: {
        paddingVertical: SPACING.md,
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: 16,
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
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        color: COLORS.text,
        marginBottom: SPACING.xl,
        letterSpacing: 8,
    },
})
