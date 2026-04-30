import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { Permission, Role } from 'appwrite'
import { databases, DATABASE_ID, ID, Query, COLLECTIONS } from './appwrite'
import { EVENT_TYPES } from './appwrite'

// expo-notifications throws on Expo Go + Android (SDK 53+). Load it defensively
// so the whole module doesn't crash at import time in that environment.
let Notifications = null
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Notifications = require('expo-notifications')
} catch {
    Notifications = null
}

// Default home radius = 10 miles in km
export const DEFAULT_HOME_RADIUS_KM = 16.0934

export const HOME_MODES = {
    GPS: 'gps',
    ADDRESS: 'address',
}

const defaultPrefs = () => ({
    enabled: false,
    pushToken: '',
    homeMode: HOME_MODES.GPS,
    homeLatitude: null,
    homeLongitude: null,
    homeAddress: '',
    homeRadiusKm: DEFAULT_HOME_RADIUS_KM,
    subscribedEventTypes: Object.values(EVENT_TYPES),
})

// Foreground notification behavior
if (Notifications?.setNotificationHandler) {
    try {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowBanner: true,
                shouldShowList: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
            }),
        })
    } catch {
        // swallow — handler setup isn't critical
    }
}

/**
 * Request permission + return an Expo push token.
 * Returns null if user denies or we're on a simulator/unsupported environment.
 */
export async function registerForPushToken() {
    if (!Notifications) return { token: null, reason: 'notifications-unavailable' }
    if (!Device.isDevice) return { token: null, reason: 'simulator' }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Nearby Events',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF5747',
        })
    }

    const { status: existing } = await Notifications.getPermissionsAsync()
    let status = existing
    if (existing !== 'granted') {
        const { status: requested } = await Notifications.requestPermissionsAsync()
        status = requested
    }
    if (status !== 'granted') return { token: null, reason: 'permission-denied' }

    const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId

    try {
        const token = await Notifications.getExpoPushTokenAsync(
            projectId ? { projectId } : undefined
        )
        return { token: token?.data || null, reason: null }
    } catch (err) {
        return { token: null, reason: err?.message || 'token-fetch-failed' }
    }
}

/**
 * Fetch the current user's notification preferences document.
 * Returns { doc, prefs } — doc is null if no record exists yet.
 */
export async function loadPreferences(userId) {
    if (!userId) return { doc: null, prefs: defaultPrefs() }

    const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.NOTIFICATION_PREFERENCES,
        [Query.equal('userId', userId), Query.limit(1)]
    )

    if (res.documents.length === 0) {
        return { doc: null, prefs: defaultPrefs() }
    }

    const doc = res.documents[0]
    return {
        doc,
        prefs: {
            enabled: !!doc.enabled,
            pushToken: doc.pushToken || '',
            homeMode: doc.homeMode || HOME_MODES.GPS,
            homeLatitude: doc.homeLatitude ?? null,
            homeLongitude: doc.homeLongitude ?? null,
            homeAddress: doc.homeAddress || '',
            homeRadiusKm: doc.homeRadiusKm ?? DEFAULT_HOME_RADIUS_KM,
            subscribedEventTypes: Array.isArray(doc.subscribedEventTypes)
                ? doc.subscribedEventTypes
                : [],
        },
    }
}

/**
 * Create or update the user's notification preferences document.
 * `existingDoc` may be passed in to skip the lookup.
 */
export async function savePreferences(userId, prefs, existingDoc = null) {
    if (!userId) throw new Error('userId required')

    const payload = {
        userId,
        enabled: !!prefs.enabled,
        pushToken: prefs.pushToken || '',
        homeMode: prefs.homeMode || HOME_MODES.GPS,
        homeLatitude: prefs.homeLatitude ?? null,
        homeLongitude: prefs.homeLongitude ?? null,
        homeAddress: prefs.homeAddress || '',
        homeRadiusKm: prefs.homeRadiusKm ?? DEFAULT_HOME_RADIUS_KM,
        subscribedEventTypes: Array.isArray(prefs.subscribedEventTypes)
            ? prefs.subscribedEventTypes
            : [],
    }

    let doc = existingDoc
    if (!doc) {
        const { doc: found } = await loadPreferences(userId)
        doc = found
    }

    if (doc) {
        return await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.NOTIFICATION_PREFERENCES,
            doc.$id,
            payload
        )
    }

    return await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.NOTIFICATION_PREFERENCES,
        ID.unique(),
        payload,
        [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
        ]
    )
}

/**
 * Create a default preferences row (enabled + all event types) for a new user
 * if one doesn't already exist. Swallows errors — non-critical to signup.
 */
export async function bootstrapDefaultPreferences(userId) {
    if (!userId) return
    try {
        const { doc } = await loadPreferences(userId)
        if (doc) return // already exists
        await savePreferences(userId, {
            ...defaultPrefs(),
            enabled: true,
            subscribedEventTypes: Object.values(EVENT_TYPES),
        })
    } catch {
        // best-effort — fail silently so signup isn't blocked
    }
}

/**
 * Silent push-token registration at app start. If the user has enabled=true but
 * no token saved, try to fetch one and persist it. No alerts — best-effort only.
 */
export async function syncPushTokenIfNeeded(userId) {
    if (!userId) return
    try {
        const { doc, prefs } = await loadPreferences(userId)
        if (!doc || !prefs.enabled) return
        if (prefs.pushToken) return

        const { token } = await registerForPushToken()
        if (!token) return

        await savePreferences(userId, { ...prefs, pushToken: token }, doc)
    } catch {
        // ignore — user can always flip the toggle manually
    }
}
