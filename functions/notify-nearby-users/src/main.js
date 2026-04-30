import { Client, Databases, Query } from 'node-appwrite'

// Event type → human-readable label (must match client EVENT_TYPE_LABELS)
const EVENT_TYPE_LABELS = {
    'yard-sale': 'Yard Sale',
    'swap-meet': 'Swap Meet',
    'bake-sale': 'Bake Sale',
    'garage-sale': 'Garage Sale',
    'estate-sale': 'Estate Sale',
    'craft-fair': 'Craft Fair',
    'farmers-market': 'Farmers Market',
    'flea-market': 'Flea Market',
    'book-sale': 'Book Sale',
    'food-truck': 'Food Truck',
    'other': 'Event',
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const PAGE_SIZE = 100
const PUSH_BATCH_SIZE = 100

// Haversine distance in km
const distanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const isValidExpoToken = (token) =>
    typeof token === 'string' && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))

const chunk = (arr, size) => {
    const out = []
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
    return out
}

const sendExpoBatch = async (messages, log, error) => {
    try {
        const response = await fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        })
        const body = await response.json().catch(() => null)
        if (!response.ok) {
            error(`Expo push failed (${response.status}): ${JSON.stringify(body)}`)
            return
        }
        log(`Expo push batch sent: ${messages.length} messages`)
    } catch (err) {
        error(`Expo push error: ${err.message}`)
    }
}

export default async ({ req, res, log, error }) => {
    try {
        // When triggered by a document event, Appwrite passes the new doc in the body
        const listing = typeof req.body === 'string' ? JSON.parse(req.body) : req.body

        if (!listing || !listing.$id) {
            log('No listing payload — nothing to do')
            return res.json({ success: true, skipped: true })
        }

        const {
            $id: listingId,
            title,
            eventType,
            latitude,
            longitude,
            userId: creatorUserId,
        } = listing

        if (latitude == null || longitude == null) {
            log(`Listing ${listingId} has no coordinates — skipping`)
            return res.json({ success: true, skipped: true })
        }

        const client = new Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT)
            .setProject(process.env.APPWRITE_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY)

        const databases = new Databases(client)
        const databaseId = process.env.APPWRITE_DATABASE_ID
        const prefsCollectionId = process.env.APPWRITE_COLLECTION_PREFERENCES_ID

        // Pull enabled preferences that subscribe to this event type.
        // We can push the enabled + eventType filter to the DB; distance is in-memory.
        const eligible = []
        let cursor = null

        while (true) {
            const queries = [
                Query.equal('enabled', true),
                Query.contains('subscribedEventTypes', [eventType]),
                Query.limit(PAGE_SIZE),
            ]
            if (cursor) queries.push(Query.cursorAfter(cursor))

            const page = await databases.listDocuments(databaseId, prefsCollectionId, queries)
            if (page.documents.length === 0) break

            for (const doc of page.documents) {
                // Skip the creator — don't notify them about their own listing
                if (creatorUserId && doc.userId === creatorUserId) continue
                if (!isValidExpoToken(doc.pushToken)) continue
                if (doc.homeLatitude == null || doc.homeLongitude == null) continue

                const d = distanceKm(doc.homeLatitude, doc.homeLongitude, latitude, longitude)
                if (d <= (doc.homeRadiusKm || 0)) {
                    eligible.push({ token: doc.pushToken, distance: d })
                }
            }

            if (page.documents.length < PAGE_SIZE) break
            cursor = page.documents[page.documents.length - 1].$id
        }

        log(`${eligible.length} users match for listing ${listingId} (${eventType})`)

        if (eligible.length === 0) {
            return res.json({ success: true, recipients: 0 })
        }

        const label = EVENT_TYPE_LABELS[eventType] || 'Event'
        const messages = eligible.map(({ token }) => ({
            to: token,
            sound: 'default',
            title: `New ${label} nearby`,
            body: title || 'A new event was just posted near you.',
            data: { listingId, eventType },
        }))

        for (const batch of chunk(messages, PUSH_BATCH_SIZE)) {
            await sendExpoBatch(batch, log, error)
        }

        return res.json({ success: true, recipients: eligible.length })
    } catch (err) {
        error(`notify-nearby-users failed: ${err.message}`)
        return res.json({ success: false, message: err.message }, 500)
    }
}
