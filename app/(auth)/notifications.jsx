import { useState, useEffect, useCallback } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    ActivityIndicator,
    Linking,
    Platform,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'

import { COLORS, SPACING, RADIUS } from '../../constants/Colors'
import ThemedSafeArea from '../../components/ThemedSafeArea'
import ThemedModal from '../../components/ThemedModal'
import AddressAutocomplete from '../../components/AddressAutocomplete'
import { useAuth } from '../../contexts/AuthContext'
import { EVENT_TYPES, EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, EVENT_TYPE_COLORS } from '../../lib/appwrite'
import {
    loadPreferences,
    savePreferences,
    registerForPushToken,
    HOME_MODES,
    DEFAULT_HOME_RADIUS_KM,
} from '../../lib/notificationService'

const milesToKm = (miles) => miles * 1.60934
const kmToMiles = (km) => km / 1.60934

export default function NotificationsScreen() {
    const { user } = useAuth()
    const distanceUnit = user?.prefs?.distanceUnit || 'miles'
    const unitLabel = distanceUnit === 'miles' ? 'mi' : 'km'

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [locationRefreshing, setLocationRefreshing] = useState(false)
    const [doc, setDoc] = useState(null)

    const [enabled, setEnabled] = useState(false)
    const [homeMode, setHomeMode] = useState(HOME_MODES.GPS)
    const [homeAddress, setHomeAddress] = useState('')
    const [homeLatitude, setHomeLatitude] = useState(null)
    const [homeLongitude, setHomeLongitude] = useState(null)
    const [homeRadiusKm, setHomeRadiusKm] = useState(DEFAULT_HOME_RADIUS_KM)
    const [pushToken, setPushToken] = useState('')
    const [subscribedEventTypes, setSubscribedEventTypes] = useState([])

    const [locationUpdatedMsg, setLocationUpdatedMsg] = useState(null)
    const [showSavedModal, setShowSavedModal] = useState(false)

    // Load existing prefs on mount
    useEffect(() => {
        (async () => {
            if (!user) return
            try {
                const { doc: existing, prefs } = await loadPreferences(user.$id)
                setDoc(existing)
                setEnabled(prefs.enabled)
                setHomeMode(prefs.homeMode)
                setHomeAddress(prefs.homeAddress)
                setHomeLatitude(prefs.homeLatitude)
                setHomeLongitude(prefs.homeLongitude)
                setHomeRadiusKm(prefs.homeRadiusKm)
                setPushToken(prefs.pushToken)
                setSubscribedEventTypes(prefs.subscribedEventTypes)
            } catch (err) {
                // TEMP DEBUG — revert to generic message once issue is fixed
                Alert.alert(
                    'Load Error (debug)',
                    `message: ${err?.message || 'none'}\n` +
                    `code: ${err?.code || 'none'}\n` +
                    `type: ${err?.type || 'none'}\n` +
                    `collectionId: ${String(require('../../lib/appwrite').COLLECTIONS.NOTIFICATION_PREFERENCES)}`
                )
            } finally {
                setLoading(false)
            }
        })()
    }, [user])

    // Radius displayed in user's preferred unit
    const radiusInUnit = distanceUnit === 'miles'
        ? Math.round(kmToMiles(homeRadiusKm))
        : Math.round(homeRadiusKm)

    const setRadiusFromUnit = (value) => {
        setHomeRadiusKm(distanceUnit === 'miles' ? milesToKm(value) : value)
    }

    // When switching to GPS mode, pull current device location so it's stored
    const captureDeviceLocation = useCallback(async ({ announce = false } = {}) => {
        setLocationRefreshing(true)
        try {
            const { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert(
                    'Location Permission Needed',
                    'We need location access to use your current location for notifications.'
                )
                return false
            }
            let loc = null
            const lastKnown = await Location.getLastKnownPositionAsync()
            if (lastKnown && Date.now() - lastKnown.timestamp < 120000) {
                loc = lastKnown
            }
            if (!loc) {
                loc = await Promise.race([
                    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Location timeout')), 8000)
                    ),
                ])
            }
            setHomeLatitude(loc.coords.latitude)
            setHomeLongitude(loc.coords.longitude)
            if (announce) {
                setLocationUpdatedMsg(
                    `Captured current coordinates:\n${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`
                )
            }
            return true
        } catch (err) {
            Alert.alert(
                'Error',
                err?.message === 'Location timeout'
                    ? 'Location request timed out. On a simulator, set a location via Features → Location.'
                    : 'Could not get your current location'
            )
            return false
        } finally {
            setLocationRefreshing(false)
        }
    }, [])

    const handleMasterToggle = async (value) => {
        if (value) {
            // User is turning notifications ON — request permission + token
            const { token, reason } = await registerForPushToken()
            if (!token) {
                if (reason === 'permission-denied') {
                    Alert.alert(
                        'Permission Denied',
                        'Notifications permission was not granted. Enable it in your device settings to receive notifications.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Open Settings', onPress: () => Linking.openSettings() },
                        ]
                    )
                } else {
                    Alert.alert(
                        'Push Token Error (debug)',
                        `Could not get a push token.\n\nReason: ${reason || 'unknown'}`
                    )
                }
                return
            }
            setPushToken(token)
            setEnabled(true)

            // On first enable, prefill GPS home if we don't have one
            if (homeMode === HOME_MODES.GPS && homeLatitude == null) {
                await captureDeviceLocation()
            }
        } else {
            setEnabled(false)
        }
    }

    const handleModeChange = async (mode) => {
        setHomeMode(mode)
        if (mode === HOME_MODES.GPS) {
            await captureDeviceLocation()
        }
    }

    const handleAddressSelect = (data) => {
        if (!data) {
            setHomeAddress('')
            setHomeLatitude(null)
            setHomeLongitude(null)
            return
        }
        setHomeAddress(data.location)
        setHomeLatitude(data.latitude)
        setHomeLongitude(data.longitude)
    }

    const toggleEventType = (key) => {
        setSubscribedEventTypes((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        )
    }

    const selectAllEventTypes = () => {
        setSubscribedEventTypes(Object.values(EVENT_TYPES))
    }

    const clearAllEventTypes = () => {
        setSubscribedEventTypes([])
    }

    const handleSave = async () => {
        if (!user) return

        // Validation: if enabled, user needs a home location
        if (enabled) {
            if (homeLatitude == null || homeLongitude == null) {
                Alert.alert(
                    'Home Location Needed',
                    homeMode === HOME_MODES.ADDRESS
                        ? 'Please select a saved address or switch to Current Location.'
                        : 'We could not get your device location. Try again or switch to Saved Address.'
                )
                return
            }
            if (subscribedEventTypes.length === 0) {
                Alert.alert(
                    'No Event Types Selected',
                    'Select at least one event type to receive notifications for, or disable notifications.'
                )
                return
            }
        }

        setSaving(true)
        try {
            const saved = await savePreferences(user.$id, {
                enabled,
                pushToken,
                homeMode,
                homeLatitude,
                homeLongitude,
                homeAddress,
                homeRadiusKm,
                subscribedEventTypes,
            }, doc)
            setDoc(saved)
            setShowSavedModal(true)
        } catch (err) {
            Alert.alert('Error', err.message || 'Failed to save preferences')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <ThemedSafeArea>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </ThemedSafeArea>
        )
    }

    const radiusPresets = distanceUnit === 'miles' ? [5, 10, 25, 50] : [10, 25, 50, 100]

    return (
        <ThemedSafeArea>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Master Toggle */}
                <View style={styles.card}>
                    <View style={styles.toggleRow}>
                        <View style={styles.toggleLabelGroup}>
                            <Text style={styles.toggleTitle}>Enable Notifications</Text>
                            <Text style={styles.toggleSubtitle}>
                                Get notified when new events are posted nearby
                            </Text>
                        </View>
                        <Switch
                            value={enabled}
                            onValueChange={handleMasterToggle}
                            trackColor={{ false: COLORS.border, true: COLORS.primary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {enabled && (
                    <>
                        {/* Home Location */}
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Home Location</Text>
                            <Text style={styles.sectionSubtitle}>
                                We'll only notify you about events within range of here.
                            </Text>

                            <View style={styles.modeSwitch}>
                                <TouchableOpacity
                                    style={[
                                        styles.modeOption,
                                        homeMode === HOME_MODES.GPS && styles.modeOptionActive
                                    ]}
                                    onPress={() => handleModeChange(HOME_MODES.GPS)}
                                >
                                    <Ionicons
                                        name="navigate"
                                        size={16}
                                        color={homeMode === HOME_MODES.GPS ? COLORS.buttonPrimaryText : COLORS.text}
                                    />
                                    <Text style={[
                                        styles.modeOptionText,
                                        homeMode === HOME_MODES.GPS && styles.modeOptionTextActive
                                    ]}>Current Location</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.modeOption,
                                        homeMode === HOME_MODES.ADDRESS && styles.modeOptionActive
                                    ]}
                                    onPress={() => handleModeChange(HOME_MODES.ADDRESS)}
                                >
                                    <Ionicons
                                        name="home"
                                        size={16}
                                        color={homeMode === HOME_MODES.ADDRESS ? COLORS.buttonPrimaryText : COLORS.text}
                                    />
                                    <Text style={[
                                        styles.modeOptionText,
                                        homeMode === HOME_MODES.ADDRESS && styles.modeOptionTextActive
                                    ]}>Saved Address</Text>
                                </TouchableOpacity>
                            </View>

                            {homeMode === HOME_MODES.ADDRESS ? (
                                <View style={styles.addressWrap}>
                                    <AddressAutocomplete
                                        value={homeAddress}
                                        onAddressSelect={handleAddressSelect}
                                        onChangeText={setHomeAddress}
                                        placeholder="Enter your home address"
                                        inline
                                    />
                                </View>
                            ) : (
                                <View style={styles.locationStatus}>
                                    <Ionicons
                                        name={homeLatitude != null ? 'checkmark-circle' : 'alert-circle'}
                                        size={18}
                                        color={homeLatitude != null ? '#22C55E' : COLORS.textTertiary}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.locationStatusText}>
                                            {locationRefreshing
                                                ? 'Getting your location…'
                                                : homeLatitude != null
                                                    ? 'Current location captured'
                                                    : 'No location yet — tap Refresh to capture'}
                                        </Text>
                                        {homeLatitude != null && !locationRefreshing && (
                                            <Text style={styles.locationCoords}>
                                                {homeLatitude.toFixed(5)}, {homeLongitude.toFixed(5)}
                                            </Text>
                                        )}
                                    </View>
                                    {locationRefreshing ? (
                                        <ActivityIndicator size="small" color={COLORS.primary} />
                                    ) : (
                                        <TouchableOpacity
                                            onPress={() => captureDeviceLocation({ announce: true })}
                                            disabled={locationRefreshing}
                                        >
                                            <Text style={styles.refreshLink}>Refresh</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Radius */}
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Notification Radius</Text>
                            <Text style={styles.sectionSubtitle}>
                                How far from your home location to look for new events.
                            </Text>
                            <View style={styles.radiusOptions}>
                                {radiusPresets.map((radius) => (
                                    <TouchableOpacity
                                        key={radius}
                                        style={[
                                            styles.radiusOption,
                                            radiusInUnit === radius && styles.radiusOptionActive
                                        ]}
                                        onPress={() => setRadiusFromUnit(radius)}
                                    >
                                        <Text style={[
                                            styles.radiusOptionText,
                                            radiusInUnit === radius && styles.radiusOptionTextActive
                                        ]}>{radius} {unitLabel}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Event Types */}
                        <View style={styles.card}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Event Types</Text>
                                <View style={styles.bulkActions}>
                                    <TouchableOpacity onPress={selectAllEventTypes}>
                                        <Text style={styles.bulkActionText}>All</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.bulkActionDivider}>·</Text>
                                    <TouchableOpacity onPress={clearAllEventTypes}>
                                        <Text style={styles.bulkActionText}>None</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <Text style={styles.sectionSubtitle}>
                                Only selected categories will trigger a notification.
                            </Text>

                            {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => {
                                const isChecked = subscribedEventTypes.includes(key)
                                const color = EVENT_TYPE_COLORS[key] || COLORS.primary
                                return (
                                    <TouchableOpacity
                                        key={key}
                                        style={styles.eventTypeRow}
                                        onPress={() => toggleEventType(key)}
                                    >
                                        <View style={[styles.eventTypeIcon, { backgroundColor: color }]}>
                                            <Ionicons
                                                name={EVENT_TYPE_ICONS[key] || 'calendar-outline'}
                                                size={18}
                                                color="#FFFFFF"
                                            />
                                        </View>
                                        <Text style={styles.eventTypeLabel}>{label}</Text>
                                        <Ionicons
                                            name={isChecked ? 'checkbox' : 'square-outline'}
                                            size={24}
                                            color={isChecked ? COLORS.primary : COLORS.textTertiary}
                                        />
                                    </TouchableOpacity>
                                )
                            })}
                        </View>
                    </>
                )}

                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color={COLORS.buttonPrimaryText} />
                    ) : (
                        <Text style={styles.saveButtonText}>Save</Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            <ThemedModal
                visible={locationUpdatedMsg != null}
                onClose={() => setLocationUpdatedMsg(null)}
                icon="location"
                iconColor={COLORS.success}
                title="Location Updated"
                message={locationUpdatedMsg || ''}
                buttons={[
                    { text: 'OK', style: 'primary', onPress: () => setLocationUpdatedMsg(null) },
                ]}
            />

            <ThemedModal
                visible={showSavedModal}
                onClose={() => setShowSavedModal(false)}
                icon="checkmark-circle"
                iconColor={COLORS.success}
                title="Saved"
                message="Your notification preferences have been updated."
                buttons={[
                    { text: 'OK', style: 'primary', onPress: () => setShowSavedModal(false) },
                ]}
            />
        </ThemedSafeArea>
    )
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: { padding: SPACING.sm },
    headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text },
    placeholder: { width: 40 },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: { flex: 1 },
    contentContainer: { padding: SPACING.lg },
    card: {
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleLabelGroup: { flex: 1, marginRight: SPACING.md },
    toggleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    toggleSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    modeSwitch: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    modeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    modeOptionActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    modeOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
    },
    modeOptionTextActive: { color: COLORS.buttonPrimaryText },
    addressWrap: { marginTop: SPACING.xs },
    locationStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.sm,
    },
    locationStatusText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    locationCoords: {
        fontSize: 12,
        color: COLORS.textTertiary,
        marginTop: 2,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    refreshLink: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
    },
    radiusOptions: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    radiusOption: {
        flex: 1,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    radiusOptionActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    radiusOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
    },
    radiusOptionTextActive: { color: COLORS.buttonPrimaryText },
    bulkActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    bulkActionText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
    },
    bulkActionDivider: {
        color: COLORS.textTertiary,
        marginHorizontal: 2,
    },
    eventTypeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        gap: SPACING.md,
    },
    eventTypeIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    eventTypeLabel: {
        flex: 1,
        fontSize: 15,
        color: COLORS.text,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.lg,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        marginTop: SPACING.sm,
    },
    saveButtonDisabled: { opacity: 0.6 },
    saveButtonText: {
        color: COLORS.buttonPrimaryText,
        fontSize: 16,
        fontWeight: '600',
    },
})
