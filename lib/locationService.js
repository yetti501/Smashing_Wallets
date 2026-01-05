import * as Location from 'expo-location'

// Average driving speed assumptions (mph)
const AVG_CITY_SPEED_MPH = 25
const AVG_HIGHWAY_SPEED_MPH = 55

export const locationService = {
    /**
     * Request location permissions and get current position
     * @returns {Promise<{latitude: number, longitude: number} | null>}
     */
    async getCurrentLocation() {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync()
            
            if (status !== 'granted') {
                console.log('Location permission denied')
                return null
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            })

            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            }
        } catch (error) {
            console.error('Error getting location:', error)
            return null
        }
    },

    /**
     * Calculate distance between two points using Haversine formula
     * @param {number} lat1 - Latitude of first point
     * @param {number} lon1 - Longitude of first point
     * @param {number} lat2 - Latitude of second point
     * @param {number} lon2 - Longitude of second point
     * @returns {number} - Distance in kilometers
     */
    calculateDistanceKm(lat1, lon1, lat2, lon2) {
        const R = 6371 // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    },

    /**
     * Convert kilometers to miles
     * @param {number} km - Distance in kilometers
     * @returns {number} - Distance in miles
     */
    kmToMiles(km) {
        return km / 1.60934
    },

    /**
     * Convert miles to kilometers
     * @param {number} miles - Distance in miles
     * @returns {number} - Distance in kilometers
     */
    milesToKm(miles) {
        return miles * 1.60934
    },

    /**
     * Estimate driving time based on distance
     * Uses average city speed for shorter distances, highway speed for longer
     * @param {number} distanceMiles - Distance in miles
     * @returns {number} - Estimated time in minutes
     */
    estimateDrivingTimeMinutes(distanceMiles) {
        // For shorter trips (<10 miles), use city speed
        // For longer trips, blend city and highway speeds
        if (distanceMiles < 10) {
            return (distanceMiles / AVG_CITY_SPEED_MPH) * 60
        } else {
            // Assume first 5 miles at city speed, rest at highway speed
            const cityTime = (5 / AVG_CITY_SPEED_MPH) * 60
            const highwayTime = ((distanceMiles - 5) / AVG_HIGHWAY_SPEED_MPH) * 60
            return cityTime + highwayTime
        }
    },

    /**
     * Format distance for display
     * @param {number} distanceKm - Distance in kilometers
     * @param {string} unit - 'miles' or 'km'
     * @returns {string} - Formatted distance string
     */
    formatDistance(distanceKm, unit = 'miles') {
        if (unit === 'miles') {
            const miles = this.kmToMiles(distanceKm)
            if (miles < 0.1) {
                return `${Math.round(miles * 5280)} ft`
            }
            return `${miles.toFixed(1)} mi`
        } else {
            if (distanceKm < 1) {
                return `${Math.round(distanceKm * 1000)} m`
            }
            return `${distanceKm.toFixed(1)} km`
        }
    },

    /**
     * Format ETA for display
     * @param {number} minutes - Time in minutes
     * @returns {string} - Formatted time string
     */
    formatETA(minutes) {
        if (minutes < 1) {
            return '< 1 min'
        }
        if (minutes < 60) {
            return `${Math.round(minutes)} min`
        }
        const hours = Math.floor(minutes / 60)
        const mins = Math.round(minutes % 60)
        if (mins === 0) {
            return `${hours} hr`
        }
        return `${hours} hr ${mins} min`
    },

    /**
     * Get full distance and ETA info for a listing
     * @param {object} userLocation - {latitude, longitude}
     * @param {object} listing - Listing with latitude/longitude
     * @param {string} unit - 'miles' or 'km'
     * @returns {{distance: string, eta: string, distanceKm: number, etaMinutes: number} | null}
     */
    getDistanceAndETA(userLocation, listing, unit = 'miles') {
        if (!userLocation || !listing?.latitude || !listing?.longitude) {
            return null
        }

        const distanceKm = this.calculateDistanceKm(
            userLocation.latitude,
            userLocation.longitude,
            listing.latitude,
            listing.longitude
        )

        const distanceMiles = this.kmToMiles(distanceKm)
        const etaMinutes = this.estimateDrivingTimeMinutes(distanceMiles)

        return {
            distance: this.formatDistance(distanceKm, unit),
            eta: this.formatETA(etaMinutes),
            distanceKm,
            distanceMiles,
            etaMinutes,
        }
    },

    /**
     * Get combined distance and ETA string
     * @param {object} userLocation - {latitude, longitude}
     * @param {object} listing - Listing with latitude/longitude
     * @param {string} unit - 'miles' or 'km'
     * @returns {string | null} - e.g., "2.5 mi • 8 min"
     */
    getDistanceETAString(userLocation, listing, unit = 'miles') {
        const info = this.getDistanceAndETA(userLocation, listing, unit)
        if (!info) return null
        return `${info.distance} • ${info.eta} drive`
    }
}