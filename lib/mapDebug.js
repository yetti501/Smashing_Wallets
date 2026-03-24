/**
 * Map Screen Debug Logger
 *
 * Import and call these in map.jsx to trace exactly where things get stuck.
 * All logs are prefixed with [MAP-DEBUG] for easy filtering in the console.
 */

const TAG = '[MAP-DEBUG]'
let sessionId = 0

export function startDebugSession() {
    sessionId++
    const ts = new Date().toISOString()
    console.log(`${TAG} ========================================`)
    console.log(`${TAG} Session #${sessionId} started at ${ts}`)
    console.log(`${TAG} ========================================`)
    return sessionId
}

export function logFocusEvent(sid) {
    console.log(`${TAG} [S${sid}] useFocusEffect fired — screen gained focus`)
}

export function logCleanup(sid) {
    console.log(`${TAG} [S${sid}] useFocusEffect cleanup — screen lost focus, cancelled=${true}`)
}

export function logPermissionRequest(sid) {
    console.log(`${TAG} [S${sid}] Requesting location permission...`)
}

export function logPermissionResult(sid, status) {
    console.log(`${TAG} [S${sid}] Permission result: "${status}"`)
    if (status !== 'granted') {
        console.warn(`${TAG} [S${sid}] Permission NOT granted — will use default location`)
    }
}

export function logCachedPosition(sid, lastKnown) {
    if (lastKnown) {
        console.log(`${TAG} [S${sid}] Cached position found:`, {
            lat: lastKnown.coords.latitude,
            lng: lastKnown.coords.longitude,
            accuracy: lastKnown.coords.accuracy,
            timestamp: new Date(lastKnown.timestamp).toISOString(),
            ageMs: Date.now() - lastKnown.timestamp,
        })
    } else {
        console.log(`${TAG} [S${sid}] No cached position available — falling back to live GPS`)
    }
}

export function logGPSStart(sid) {
    console.log(`${TAG} [S${sid}] Starting live GPS request (Balanced accuracy, 8s timeout)...`)
}

export function logGPSResult(sid, location) {
    console.log(`${TAG} [S${sid}] Live GPS succeeded:`, {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy,
    })
}

export function logGPSError(sid, error) {
    console.error(`${TAG} [S${sid}] Location error: ${error.message}`)
    console.error(`${TAG} [S${sid}] Error details:`, error)
}

export function logSafetyTimeout(sid) {
    console.warn(`${TAG} [S${sid}] SAFETY TIMEOUT (10s) fired — forcing default location`)
}

export function logStateChange(sid, field, value) {
    const summary = typeof value === 'object' && value !== null
        ? JSON.stringify(value, null, 2).slice(0, 200)
        : String(value)
    console.log(`${TAG} [S${sid}] State: ${field} = ${summary}`)
}

export function logListingsData(listings) {
    console.log(`${TAG} --- Listings Summary ---`)
    console.log(`${TAG}   Total listings: ${listings.length}`)

    const withCoords = listings.filter(e => e.latitude && e.longitude)
    const withoutCoords = listings.filter(e => !e.latitude || !e.longitude)

    console.log(`${TAG}   With coordinates: ${withCoords.length}`)
    console.log(`${TAG}   Missing coordinates: ${withoutCoords.length}`)

    if (withoutCoords.length > 0) {
        console.log(`${TAG}   Listings missing coords:`)
        withoutCoords.forEach(e => {
            console.log(`${TAG}     - "${e.title}" (id: ${e.$id}) lat=${e.latitude} lng=${e.longitude}`)
        })
    }

    if (withCoords.length > 0) {
        console.log(`${TAG}   First 5 with coords:`)
        withCoords.slice(0, 5).forEach(e => {
            console.log(`${TAG}     - "${e.title}" @ (${e.latitude}, ${e.longitude}) type=${e.eventType}`)
        })
    }
}

export function logRender(loading, region, selectedEvent, markerCount) {
    console.log(`${TAG} --- Render ---`)
    console.log(`${TAG}   loading: ${loading}`)
    console.log(`${TAG}   region: ${JSON.stringify(region)}`)
    console.log(`${TAG}   selectedEvent: ${selectedEvent ? selectedEvent.title : 'none'}`)
    console.log(`${TAG}   markers to render: ${markerCount}`)
}

export function logHasLoadedOnce(sid, value) {
    console.log(`${TAG} [S${sid}] hasLoadedOnce.current = ${value}`)
}

export function logCancelledCheck(sid, cancelled, action) {
    if (cancelled) {
        console.warn(`${TAG} [S${sid}] CANCELLED — skipping "${action}" (screen lost focus before completion)`)
    }
}
