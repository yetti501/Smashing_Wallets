import config from './config'

const API_KEY = config.google.maps.apiKey

// Add this temporarily
console.log('Google API Key available:', !!API_KEY)
console.log('API Key value:', API_KEY ? API_KEY.substring(0, 10) + '...' : 'MISSING')

/**
 * Google Places Service
 * Handles address autocomplete, validation, and geocoding
 * Uses Places API (New) endpoints
 */
export const googlePlacesService = {
    /**
     * Get address suggestions as user types
     * Uses Places API (New) Autocomplete endpoint
     * @param {string} input - User's input text
     * @param {string} sessionToken - Session token for billing (reuse for same session)
     * @returns {Promise<Array>} Array of predictions
     */
    async getAutocompleteSuggestions(input, sessionToken = null) {
        if (!input || input.length < 3) {
            return []
        }

        try {
            const requestBody = {
                input,
                includedPrimaryTypes: ['street_address', 'premise', 'subpremise'],
                includedRegionCodes: ['us'],
            }

            if (sessionToken) {
                requestBody.sessionToken = sessionToken
            }

            const response = await fetch(
                'https://places.googleapis.com/v1/places:autocomplete',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': API_KEY,
                    },
                    body: JSON.stringify(requestBody),
                }
            )

            const data = await response.json()

            if (data.error) {
                console.error('Places API error:', data.error.message)
                return []
            }

            if (data.suggestions && data.suggestions.length > 0) {
                return data.suggestions
                    .filter(s => s.placePrediction) // Only place predictions
                    .map(suggestion => ({
                        placeId: suggestion.placePrediction.placeId,
                        description: suggestion.placePrediction.text?.text || '',
                        mainText: suggestion.placePrediction.structuredFormat?.mainText?.text || '',
                        secondaryText: suggestion.placePrediction.structuredFormat?.secondaryText?.text || '',
                    }))
            }

            return []
        } catch (error) {
            console.error('Error fetching autocomplete suggestions:', error)
            return []
        }
    },

    /**
     * Get place details including lat/lng and address components
     * Uses Places API (New) Place Details endpoint
     * @param {string} placeId - Google Place ID
     * @param {string} sessionToken - Session token (completes the session)
     * @returns {Promise<Object>} Place details
     */
    async getPlaceDetails(placeId, sessionToken = null) {
        try {
            const fields = 'formattedAddress,location,addressComponents,displayName'
            
            const headers = {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': fields,
            }

            if (sessionToken) {
                headers['X-Goog-SessionToken'] = sessionToken
            }

            const response = await fetch(
                `https://places.googleapis.com/v1/places/${placeId}`,
                {
                    method: 'GET',
                    headers,
                }
            )

            const data = await response.json()

            if (data.error) {
                console.error('Place Details API error:', data.error.message)
                return null
            }

            const components = this.parseAddressComponentsNew(data.addressComponents)

            return {
                formattedAddress: data.formattedAddress,
                latitude: data.location?.latitude,
                longitude: data.location?.longitude,
                placeId: placeId,
                ...components,
            }
        } catch (error) {
            console.error('Error fetching place details:', error)
            return null
        }
    },

    /**
     * Parse address components from Places API (New) format
     * @param {Array} components - Address components from Google
     * @returns {Object} Parsed components
     */
    parseAddressComponentsNew(components) {
        const parsed = {
            streetNumber: '',
            streetName: '',
            neighborhood: '',
            city: '',
            state: '',
            stateShort: '',
            zipCode: '',
            country: '',
        }

        if (!components) return parsed

        components.forEach(component => {
            const types = component.types

            if (types.includes('street_number')) {
                parsed.streetNumber = component.longText
            }
            if (types.includes('route')) {
                parsed.streetName = component.longText
            }
            if (types.includes('neighborhood')) {
                parsed.neighborhood = component.longText
            }
            if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
                if (!parsed.neighborhood) {
                    parsed.neighborhood = component.longText
                }
            }
            if (types.includes('locality')) {
                parsed.city = component.longText
            }
            if (types.includes('administrative_area_level_1')) {
                parsed.state = component.longText
                parsed.stateShort = component.shortText
            }
            if (types.includes('postal_code')) {
                parsed.zipCode = component.longText
            }
            if (types.includes('country')) {
                parsed.country = component.longText
            }
        })

        return parsed
    },

    /**
     * Parse address components from legacy/Geocoding API format
     * @param {Array} components - Address components from Google
     * @returns {Object} Parsed components
     */
    parseAddressComponents(components) {
        const parsed = {
            streetNumber: '',
            streetName: '',
            neighborhood: '',
            city: '',
            state: '',
            stateShort: '',
            zipCode: '',
            country: '',
        }

        if (!components) return parsed

        components.forEach(component => {
            const types = component.types

            if (types.includes('street_number')) {
                parsed.streetNumber = component.long_name
            }
            if (types.includes('route')) {
                parsed.streetName = component.long_name
            }
            if (types.includes('neighborhood')) {
                parsed.neighborhood = component.long_name
            }
            if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
                if (!parsed.neighborhood) {
                    parsed.neighborhood = component.long_name
                }
            }
            if (types.includes('locality')) {
                parsed.city = component.long_name
            }
            if (types.includes('administrative_area_level_1')) {
                parsed.state = component.long_name
                parsed.stateShort = component.short_name
            }
            if (types.includes('postal_code')) {
                parsed.zipCode = component.long_name
            }
            if (types.includes('country')) {
                parsed.country = component.long_name
            }
        })

        return parsed
    },

    /**
     * Validate an address using Google Address Validation API
     * @param {string} address - Full address string to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateAddress(address) {
        try {
            const response = await fetch(
                `https://addressvalidation.googleapis.com/v1:validateAddress?key=${API_KEY}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        address: {
                            addressLines: [address],
                        },
                        enableUspsCass: true,
                    }),
                }
            )

            const data = await response.json()

            if (data.error) {
                console.error('Address Validation API error:', data.error)
                return {
                    isValid: false,
                    error: data.error.message,
                }
            }

            const result = data.result
            const verdict = result?.verdict || {}
            const address_result = result?.address || {}
            const geocode = result?.geocode || {}

            const validationGranularity = verdict.validationGranularity || 'OTHER'
            const hasUnconfirmedComponents = verdict.hasUnconfirmedComponents || false
            const hasInferredComponents = verdict.hasInferredComponents || false

            const isValid = ['PREMISE', 'SUB_PREMISE', 'PREMISE_PROXIMITY'].includes(validationGranularity)
                && !hasUnconfirmedComponents

            return {
                isValid,
                validationGranularity,
                hasUnconfirmedComponents,
                hasInferredComponents,
                formattedAddress: address_result.formattedAddress,
                latitude: geocode.location?.latitude,
                longitude: geocode.location?.longitude,
                placeId: geocode.placeId,
                suggestedAddress: address_result.formattedAddress,
                addressComponents: address_result.addressComponents,
            }
        } catch (error) {
            console.error('Error validating address:', error)
            return {
                isValid: false,
                error: error.message,
            }
        }
    },

    /**
     * Geocode an address to get lat/lng (fallback if validation not needed)
     * @param {string} address - Address to geocode
     * @returns {Promise<Object>} Geocoding result
     */
    async geocodeAddress(address) {
        try {
            const params = new URLSearchParams({
                address,
                key: API_KEY,
            })

            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?${params}`
            )

            const data = await response.json()

            if (data.status === 'OK' && data.results.length > 0) {
                const result = data.results[0]
                const components = this.parseAddressComponents(result.address_components)

                return {
                    formattedAddress: result.formatted_address,
                    latitude: result.geometry.location.lat,
                    longitude: result.geometry.location.lng,
                    placeId: result.place_id,
                    ...components,
                }
            } else {
                console.error('Geocoding API error:', data.status)
                return null
            }
        } catch (error) {
            console.error('Error geocoding address:', error)
            return null
        }
    },

    /**
     * Generate a unique session token for Places API billing
     * @returns {string} UUID session token
     */
    generateSessionToken() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0
            const v = c === 'x' ? r : (r & 0x3 | 0x8)
            return v.toString(16)
        })
    },
}

export default googlePlacesService