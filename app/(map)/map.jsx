import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
    View,
    StyleSheet,
    Text,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    Pressable,
    Animated,
    Dimensions,
    ScrollView,
} from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import AsyncStorage from '@react-native-async-storage/async-storage'
// useFocusEffect re-runs every time this screen becomes visible.
// This is the key fix — useEffect with [] only fires on mount,
// but in a tab navigator the screen stays mounted when you switch tabs.
// useFocusEffect fires on mount AND every time you navigate back to this tab.
import { useFocusEffect } from '@react-navigation/native'

import { useListings } from '../../contexts/ListingsContext'
import googlePlacesService from '../../lib/googlePlacesService'
import { useAuth } from '../../contexts/AuthContext'
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/Colors'
import { EVENT_TYPES, EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '../../lib/appwrite'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

// Fallback location (Phoenix, AZ) used when we can't get device location
const DEFAULT_LOCATION = {
    latitude: 33.4484,
    longitude: -112.0740,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
}

// Custom map style to hide default Google Maps POIs so our
// event markers are the only points of interest visible
const CUSTOM_MAP_STYLE = [
    {
        "featureType": "poi",
        "elementType": "labels",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "poi.business",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "poi.attraction",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "poi.government",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "poi.medical",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "poi.place_of_worship",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "poi.school",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "poi.sports_complex",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "transit",
        "elementType": "labels.icon",
        "stylers": [{ "visibility": "off" }]
    }
]

// Each event type gets its own color for map markers and filter pills
const EVENT_TYPE_COLORS = {
    [EVENT_TYPES.YARD_SALE]: '#22C55E',
    [EVENT_TYPES.GARAGE_SALE]: '#3B82F6',
    [EVENT_TYPES.ESTATE_SALE]: '#8B5CF6',
    [EVENT_TYPES.BAKE_SALE]: '#F59E0B',
    [EVENT_TYPES.CRAFT_FAIR]: '#EC4899',
    [EVENT_TYPES.FARMERS_MARKET]: '#10B981',
    [EVENT_TYPES.FLEA_MARKET]: '#6366F1',
    [EVENT_TYPES.SWAP_MEET]: '#EF4444',
    [EVENT_TYPES.BOOK_SALE]: '#0EA5E9',
    [EVENT_TYPES.OTHER]: '#6B7280',
}

// How far the user must pan the map (in km) before we show "Search this area"
const MIN_MOVE_DISTANCE = 1

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export default function MapScreen() {
    const { listings } = useListings()
    const { user } = useAuth()

    // ── Location State ──
    // userLocation: the device's actual GPS coordinates (used for distance calculations)
    // searchCenter: the center point used to filter which events are shown (moves when user taps "Search this area")
    // currentMapRegion: the region the map is currently displaying (controlled prop)
    const [userLocation, setUserLocation] = useState(null)
    const [searchCenter, setSearchCenter] = useState(null)
    const [currentMapRegion, setCurrentMapRegion] = useState(DEFAULT_LOCATION)

    // Controls the loading spinner vs map display
    const [loading, setLoading] = useState(true)

    // ── Filter State ──
    const [searchRadius, setSearchRadius] = useState(10)
    const [selectedEventType, setSelectedEventType] = useState(null)
    const [showPastEvents, setShowPastEvents] = useState(false)

    // ── UI State ──
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [filterModalVisible, setFilterModalVisible] = useState(false)
    const [showSearchButton, setShowSearchButton] = useState(false)
    const [clusterModalVisible, setClusterModalVisible] = useState(false)
    const [clusterEvents, setClusterEvents] = useState([])

    // ── Refs ──
    const mapRef = useRef(null)
    const cardAnimation = useRef(new Animated.Value(0)).current
    const searchButtonAnimation = useRef(new Animated.Value(0)).current

    // ── User Preferences ──
    // Distance unit from user profile (default miles)
    const distanceUnit = user?.prefs?.distanceUnit || 'miles'

    // ─────────────────────────────────────────────
    // UNIT CONVERSION HELPERS
    // ─────────────────────────────────────────────

    const milesToKm = (miles) => miles * 1.60934
    const kmToMiles = (km) => km / 1.60934

    // Internal calculations always use km; this converts searchRadius to km
    const getRadiusInKm = () => {
        return distanceUnit === 'miles' ? milesToKm(searchRadius) : searchRadius
    }

    // Format a km distance for display in the user's preferred unit
    const formatDistance = (distanceInKm) => {
        if (distanceUnit === 'miles') {
            const miles = kmToMiles(distanceInKm)
            if (miles < 0.1) {
                return `${Math.round(miles * 5280)} ft away`
            }
            return `${miles.toFixed(1)} mi away`
        } else {
            if (distanceInKm < 1) {
                return `${Math.round(distanceInKm * 1000)}m away`
            }
            return `${distanceInKm.toFixed(1)} km away`
        }
    }

    const getUnitLabel = () => distanceUnit === 'miles' ? 'mi' : 'km'

    // ─────────────────────────────────────────────
    // HAVERSINE DISTANCE CALCULATION
    // ─────────────────────────────────────────────
    // Returns distance in km between two lat/lng points
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371 // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    // ─────────────────────────────────────────────
    // LOCATION FETCHING
    // ─────────────────────────────────────────────
    // Tracks whether we've done the initial location fetch.
    // On first mount we show the loading spinner; on subsequent
    // tab focuses we just clear UI state without remounting the map.
    const hasLoadedOnce = useRef(false)

    useFocusEffect(
        useCallback(() => {
            let cancelled = false

            // Always reset transient UI state on focus
            setSelectedEvent(null)
            setShowSearchButton(false)

            // Only show the loading spinner on the very first load
            if (!hasLoadedOnce.current) {
                setLoading(true)
            }

            const applyRegion = (region) => {
                setUserLocation(region)
                setSearchCenter(region)
                setCurrentMapRegion(region)
                setLoading(false)
                hasLoadedOnce.current = true
            }

            // Use saved zip coordinates, fall back to re-geocoding, then Phoenix default
            const applyZipOrDefaults = async () => {
                try {
                    // First try pre-resolved coordinates saved during onboarding (onboarding currently disabled)
                    const savedCoords = await AsyncStorage.getItem('@smashing_wallets_zip_coords')
                    if (savedCoords) {
                        const { latitude, longitude } = JSON.parse(savedCoords)
                        if (latitude && longitude) {
                            const zipRegion = {
                                latitude,
                                longitude,
                                latitudeDelta: 0.15,
                                longitudeDelta: 0.15,
                            }
                            if (!cancelled) applyRegion(zipRegion)
                            return
                        }
                    }

                    // Fallback: try geocoding the saved zip code
                    const savedZip = await AsyncStorage.getItem('@smashing_wallets_zip')
                    if (savedZip) {
                        const result = await googlePlacesService.geocodeAddress(savedZip)
                        if (result && result.latitude && result.longitude) {
                            const zipRegion = {
                                latitude: result.latitude,
                                longitude: result.longitude,
                                latitudeDelta: 0.15,
                                longitudeDelta: 0.15,
                            }
                            if (!cancelled) applyRegion(zipRegion)
                            return
                        }
                    }
                } catch (error) {
                    console.error('Zip location error:', error)
                }
                if (!cancelled) applyRegion(DEFAULT_LOCATION)
            }

            const getLocation = async () => {
                try {
                    // Only check existing permission — the splash/onboarding screen
                    // was responsible for requesting location access (onboarding currently disabled).
                    const { status } = await Location.getForegroundPermissionsAsync()

                    if (status !== 'granted') {
                        if (!cancelled) await applyZipOrDefaults()
                        return
                    }

                    const location = await Promise.race([
                        Location.getCurrentPositionAsync({
                            accuracy: Location.Accuracy.Balanced,
                        }),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Location timeout')), 8000)
                        ),
                    ])

                    if (!cancelled) {
                        const userRegion = {
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                            latitudeDelta: 0.15,
                            longitudeDelta: 0.15,
                        }

                        setUserLocation(userRegion)
                        setSearchCenter(userRegion)
                        setCurrentMapRegion(userRegion)
                        setLoading(false)
                        hasLoadedOnce.current = true
                    }
                } catch (error) {
                    console.error('Location error:', error)
                    if (!cancelled) await applyZipOrDefaults()
                }
            }

            getLocation()

            return () => {
                cancelled = true
            }
        }, [])
    )

    // ─────────────────────────────────────────────
    // ANIMATIONS
    // ─────────────────────────────────────────────

    // Animate the event preview card sliding up/down when an event is selected/deselected
    useEffect(() => {
        Animated.spring(cardAnimation, {
            toValue: selectedEvent ? 1 : 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
        }).start()
    }, [selectedEvent])

    // Animate the "Search this area" button appearing/disappearing
    useEffect(() => {
        Animated.spring(searchButtonAnimation, {
            toValue: showSearchButton ? 1 : 0,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
        }).start()
    }, [showSearchButton])

    // ─────────────────────────────────────────────
    // MAP INTERACTION HANDLERS
    // ─────────────────────────────────────────────

    // Called when the user finishes panning/zooming the map.
    // If they've moved far enough from the search center, show the "Search this area" button.
    const handleRegionChangeComplete = (region) => {
        setCurrentMapRegion(region)

        if (!searchCenter) return

        const distanceMoved = calculateDistance(
            searchCenter.latitude,
            searchCenter.longitude,
            region.latitude,
            region.longitude
        )

        setShowSearchButton(distanceMoved > MIN_MOVE_DISTANCE)
    }

    // When the user taps "Search this area", update the search center
    // to wherever they've panned the map, which re-filters the events
    const handleSearchThisArea = () => {
        if (!currentMapRegion) return

        setSearchCenter({
            latitude: currentMapRegion.latitude,
            longitude: currentMapRegion.longitude,
            latitudeDelta: currentMapRegion.latitudeDelta,
            longitudeDelta: currentMapRegion.longitudeDelta,
        })

        setShowSearchButton(false)
        setSelectedEvent(null)
    }

    // Tap on the map background = deselect any selected event
    const handleMapPress = () => {
        setSelectedEvent(null)
    }

    // Re-center map on the user's actual GPS location
    const handleRecenter = () => {
        if (mapRef.current && userLocation) {
            mapRef.current.animateToRegion(userLocation, 500)
            setSearchCenter(userLocation)
            setShowSearchButton(false)
        }
        setSelectedEvent(null)
    }

    // ─────────────────────────────────────────────
    // MARKER / CLUSTER HANDLERS
    // ─────────────────────────────────────────────

    // When a marker is tapped: if it's a cluster (multiple events), show the
    // cluster modal. If it's a single event, show the preview card.
    const handleMarkerPress = (cluster) => {
        if (cluster.count > 1) {
            setClusterEvents(cluster.events)
            setClusterModalVisible(true)
        } else {
            setSelectedEvent(cluster.events[0])

            if (mapRef.current) {
                mapRef.current.animateToRegion({
                    latitude: cluster.latitude,
                    longitude: cluster.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }, 300)
            }
        }
    }

    // User picks a specific event from the cluster modal
    const handleClusterEventSelect = (event) => {
        setClusterModalVisible(false)
        setSelectedEvent(event)

        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: event.latitude,
                longitude: event.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            }, 300)
        }
    }

    // Tapping the preview card navigates to the full event details screen
    const handleCardPress = () => {
        if (selectedEvent) {
            router.push({
                pathname: '/(tabs)/listingDetails',
                params: { listingId: selectedEvent.$id }
            })
        }
    }

    // ─────────────────────────────────────────────
    // FILTER HANDLERS
    // ─────────────────────────────────────────────

    // Toggle a filter pill on/off
    const handleFilterPillPress = (eventType) => {
        setSelectedEventType(
            selectedEventType === eventType ? null : eventType
        )
    }

    // ─────────────────────────────────────────────
    // FORMATTING HELPERS
    // ─────────────────────────────────────────────

    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString + 'T00:00:00')
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        })
    }

    // Calculate distance and estimated driving time from user's location to an event
    const getDistanceETAText = (event) => {
        if (!userLocation || !event.latitude || !event.longitude) return { distance: '', eta: '' }

        const distanceInKm = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            event.latitude,
            event.longitude
        )

        // Rough ETA: ~25mph city, ~55mph highway after 5 miles
        const distanceMiles = kmToMiles(distanceInKm)
        let etaMinutes
        if (distanceMiles < 10) {
            etaMinutes = (distanceMiles / 25) * 60
        } else {
            etaMinutes = ((5 / 25) + ((distanceMiles - 5) / 55)) * 60
        }

        let etaText
        if (etaMinutes < 1) {
            etaText = '< 1 min'
        } else if (etaMinutes < 60) {
            etaText = `${Math.round(etaMinutes)} min`
        } else {
            const hours = Math.floor(etaMinutes / 60)
            const mins = Math.round(etaMinutes % 60)
            etaText = mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`
        }

        return {
            distance: formatDistance(distanceInKm),
            eta: etaText
        }
    }

    // ─────────────────────────────────────────────
    // EVENT FILTERING (memoized for performance)
    // ─────────────────────────────────────────────
    // Recalculates only when dependencies change, not on every render
    const filteredEvents = useMemo(() => {
        if (!searchCenter) return []

        const radiusInKm = getRadiusInKm()

        return listings.filter(event => {
            // Must have coordinates to show on map
            if (!event.latitude || !event.longitude) return false

            // Filter by distance from search center
            const distance = calculateDistance(
                searchCenter.latitude,
                searchCenter.longitude,
                event.latitude,
                event.longitude
            )
            if (distance > radiusInKm) return false

            // Filter by event type if one is selected
            if (selectedEventType && event.eventType !== selectedEventType) return false

            // Hide past events unless toggled on
            if (!showPastEvents) {
                const today = new Date().toISOString().split('T')[0]
                const eventDate = (event.date || event.startDate || '').split('T')[0]
                if (eventDate && eventDate < today) return false
            }

            return true
        })
    }, [listings, searchCenter, searchRadius, selectedEventType, showPastEvents, distanceUnit])

    // ─────────────────────────────────────────────
    // EVENT CLUSTERING (memoized)
    // ─────────────────────────────────────────────
    // Groups events within ~50 meters of each other into a single marker
    // so the map doesn't get cluttered with overlapping pins
    const clusteredEvents = useMemo(() => {
        const CLUSTER_DISTANCE = 0.05 // ~50 meters in km
        const clusters = []
        const processed = new Set()

        filteredEvents.forEach((event) => {
            if (processed.has(event.$id)) return

            // Find all events near this one that haven't been clustered yet
            const nearbyEvents = filteredEvents.filter((otherEvent) => {
                if (processed.has(otherEvent.$id)) return false
                if (event.$id === otherEvent.$id) return true

                const distance = calculateDistance(
                    event.latitude,
                    event.longitude,
                    otherEvent.latitude,
                    otherEvent.longitude
                )
                return distance < CLUSTER_DISTANCE
            })

            nearbyEvents.forEach(e => processed.add(e.$id))

            clusters.push({
                id: event.$id,
                latitude: event.latitude,
                longitude: event.longitude,
                events: nearbyEvents,
                count: nearbyEvents.length,
                eventType: event.eventType
            })
        })

        return clusters
    }, [filteredEvents])

    // ─────────────────────────────────────────────
    // LOADING STATE
    // ─────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Finding your location...</Text>
            </View>
        )
    }

    // ─────────────────────────────────────────────
    // MAIN RENDER
    // ─────────────────────────────────────────────
    return (
        <View style={styles.container}>
            {/* ── Map ── */}
            {/* Using initialRegion (uncontrolled) — the loading state unmounts/remounts
                MapView on each focus, so initialRegion applies the fresh location each time.
                Programmatic moves use mapRef.animateToRegion(). */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider="google"
                initialRegion={currentMapRegion}
                showsUserLocation={true}
                showsMyLocationButton={false}
                onPress={handleMapPress}
                onRegionChangeComplete={handleRegionChangeComplete}
                customMapStyle={CUSTOM_MAP_STYLE}
            >
                {/* Event markers (clustered) */}
                {clusteredEvents.map((cluster) => {
                    const isSelected = cluster.count === 1 && selectedEvent?.$id === cluster.events[0].$id
                    const markerColor = EVENT_TYPE_COLORS[cluster.eventType] || COLORS.primary
                    const iconName = EVENT_TYPE_ICONS[cluster.eventType] || 'calendar-outline'

                    return (
                        <Marker
                            key={cluster.id}
                            coordinate={{
                                latitude: cluster.latitude,
                                longitude: cluster.longitude,
                            }}
                            onPress={() => handleMarkerPress(cluster)}
                            anchor={{ x: 0.5, y: 1 }}
                        >
                            <View style={styles.markerContainer}>
                                <View style={[
                                    styles.markerBubble,
                                    { borderColor: markerColor },
                                    isSelected && styles.markerBubbleSelected,
                                    isSelected && { borderColor: markerColor, backgroundColor: markerColor }
                                ]}>
                                    {cluster.count > 1 ? (
                                        <Text style={[
                                            styles.clusterCount,
                                            { color: markerColor }
                                        ]}>{cluster.count}</Text>
                                    ) : (
                                        <Ionicons
                                            name={iconName}
                                            size={isSelected ? 20 : 16}
                                            color={isSelected ? '#FFFFFF' : markerColor}
                                        />
                                    )}
                                </View>
                                <View style={[
                                    styles.markerPointer,
                                    { borderTopColor: isSelected ? markerColor : '#FFFFFF' }
                                ]} />
                                <View style={[
                                    styles.markerPointerBorder,
                                    { borderTopColor: markerColor }
                                ]} />
                            </View>
                        </Marker>
                    )
                })}
            </MapView>

            {/* ── Header with Filter Pills ── */}
            <View style={styles.headerContainer}>
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>Nearby Events</Text>
                            <Text style={styles.headerSubtitle}>
                                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} within {searchRadius} {getUnitLabel()}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.moreFiltersButton}
                            onPress={() => setFilterModalVisible(true)}
                        >
                            <Ionicons name="options-outline" size={20} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Horizontally scrollable filter pills */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterPillsContainer}
                >
                    <TouchableOpacity
                        style={[
                            styles.filterPill,
                            !selectedEventType && styles.filterPillActive
                        ]}
                        onPress={() => setSelectedEventType(null)}
                    >
                        <Text style={[
                            styles.filterPillText,
                            !selectedEventType && styles.filterPillTextActive
                        ]}>All</Text>
                    </TouchableOpacity>

                    {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                        <TouchableOpacity
                            key={key}
                            style={[
                                styles.filterPill,
                                selectedEventType === key && styles.filterPillActive,
                                selectedEventType === key && { backgroundColor: EVENT_TYPE_COLORS[key] }
                            ]}
                            onPress={() => handleFilterPillPress(key)}
                        >
                            <View style={[
                                styles.filterPillDot,
                                { backgroundColor: EVENT_TYPE_COLORS[key] },
                                selectedEventType === key && { backgroundColor: COLORS.surface }
                            ]} />
                            <Text style={[
                                styles.filterPillText,
                                selectedEventType === key && styles.filterPillTextActive
                            ]}>{label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* ── Search This Area Button ── */}
            {/* Slides down from top when user pans the map far enough from the search center */}
            <Animated.View
                style={[
                    styles.searchAreaButtonContainer,
                    {
                        transform: [{
                            translateY: searchButtonAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-100, 0],
                            })
                        }],
                        opacity: searchButtonAnimation,
                    }
                ]}
                pointerEvents={showSearchButton ? 'auto' : 'none'}
            >
                <TouchableOpacity
                    style={styles.searchAreaButton}
                    onPress={handleSearchThisArea}
                    activeOpacity={0.9}
                >
                    <Ionicons name="refresh" size={18} color={COLORS.buttonPrimaryText} />
                    <Text style={styles.searchAreaButtonText}>Search this area</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* ── Center on Me Button ── */}
            <TouchableOpacity
                style={styles.centerButton}
                onPress={handleRecenter}
            >
                <Ionicons name="locate" size={24} color={COLORS.primary} />
            </TouchableOpacity>

            {/* ── Event Preview Card ── */}
            {/* Slides up from bottom when an event marker is tapped */}
            <Animated.View
                style={[
                    styles.previewCard,
                    {
                        transform: [{
                            translateY: cardAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [200, 0],
                            })
                        }],
                        opacity: cardAnimation,
                    }
                ]}
                pointerEvents={selectedEvent ? 'auto' : 'none'}
            >
                {selectedEvent && (
                    <TouchableOpacity
                        style={styles.previewCardContent}
                        onPress={handleCardPress}
                        activeOpacity={0.9}
                    >
                        {/* Event Type Badge */}
                        <View style={[
                            styles.eventTypeBadge,
                            { backgroundColor: EVENT_TYPE_COLORS[selectedEvent.eventType] || COLORS.primary }
                        ]}>
                            <Ionicons
                                name={EVENT_TYPE_ICONS[selectedEvent.eventType] || 'calendar-outline'}
                                size={12}
                                color={COLORS.buttonPrimaryText}
                            />
                            <Text style={styles.eventTypeBadgeText}>
                                {EVENT_TYPE_LABELS[selectedEvent.eventType] || 'Event'}
                            </Text>
                        </View>

                        {/* Title */}
                        <Text style={styles.previewTitle} numberOfLines={1}>
                            {selectedEvent.title}
                        </Text>

                        {/* Info Row: date, time, distance, ETA */}
                        <View style={styles.previewInfoRow}>
                            <View style={styles.previewInfoItem}>
                                <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
                                <Text style={styles.previewInfoText}>
                                    {formatDate(selectedEvent.date || selectedEvent.startDate)}
                                </Text>
                            </View>

                            {selectedEvent.startTime && (
                                <View style={styles.previewInfoItem}>
                                    <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                                    <Text style={styles.previewInfoText}>
                                        {selectedEvent.startTime}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.previewInfoItem}>
                                <Ionicons name="car-outline" size={14} color={COLORS.primary} />
                                <Text style={[styles.previewInfoText, { color: COLORS.primary }]}>
                                    {getDistanceETAText(selectedEvent).distance}
                                </Text>
                            </View>

                            <View style={styles.previewInfoItem}>
                                <Ionicons name="time" size={14} color={COLORS.primary} />
                                <Text style={[styles.previewInfoText, { color: COLORS.primary }]}>
                                    {getDistanceETAText(selectedEvent).eta}
                                </Text>
                            </View>
                        </View>

                        {/* Location */}
                        <View style={styles.previewLocation}>
                            <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                            <Text style={styles.previewLocationText} numberOfLines={1}>
                                {selectedEvent.location}
                            </Text>
                        </View>

                        {/* View Details link */}
                        <View style={styles.previewArrow}>
                            <Text style={styles.previewArrowText}>View Details</Text>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                        </View>
                    </TouchableOpacity>
                )}
            </Animated.View>

            {/* ── More Filters Modal ── */}
            <Modal
                visible={filterModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setFilterModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <Pressable onPress={() => {}}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>More Filters</Text>
                                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={COLORS.text} />
                                </TouchableOpacity>
                            </View>

                            {/* Show Past Events Toggle */}
                            <TouchableOpacity
                                style={styles.toggleOption}
                                onPress={() => setShowPastEvents(!showPastEvents)}
                            >
                                <Text style={styles.toggleLabel}>Show Past Events</Text>
                                <Ionicons
                                    name={showPastEvents ? "checkbox" : "square-outline"}
                                    size={24}
                                    color={COLORS.primary}
                                />
                            </TouchableOpacity>

                            {/* Search Radius Options */}
                            <View style={styles.radiusSection}>
                                <Text style={styles.radiusSectionTitle}>Search Radius</Text>
                                <View style={styles.radiusOptions}>
                                    {[5, 10, 25, 50].map((radius) => (
                                        <TouchableOpacity
                                            key={radius}
                                            style={[
                                                styles.radiusOption,
                                                searchRadius === radius && styles.radiusOptionActive
                                            ]}
                                            onPress={() => setSearchRadius(radius)}
                                        >
                                            <Text style={[
                                                styles.radiusOptionText,
                                                searchRadius === radius && styles.radiusOptionTextActive
                                            ]}>{radius} {getUnitLabel()}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={() => setFilterModalVisible(false)}
                            >
                                <Text style={styles.applyButtonText}>Apply</Text>
                            </TouchableOpacity>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>

            {/* ── Cluster Events Modal ── */}
            {/* Shows a list when multiple events are at the same location */}
            <Modal
                visible={clusterModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setClusterModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setClusterModalVisible(false)}
                >
                    <View style={styles.clusterModalContent}>
                        <Pressable onPress={() => {}}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {clusterEvents.length} Events at this Location
                                </Text>
                                <TouchableOpacity onPress={() => setClusterModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={COLORS.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.clusterEventsList}>
                                {clusterEvents.map((event) => (
                                    <TouchableOpacity
                                        key={event.$id}
                                        style={styles.clusterEventItem}
                                        onPress={() => handleClusterEventSelect(event)}
                                    >
                                        <View style={[
                                            styles.clusterEventIcon,
                                            { backgroundColor: EVENT_TYPE_COLORS[event.eventType] || COLORS.primary }
                                        ]}>
                                            <Ionicons
                                                name={EVENT_TYPE_ICONS[event.eventType] || 'calendar-outline'}
                                                size={16}
                                                color="#FFFFFF"
                                            />
                                        </View>
                                        <View style={styles.clusterEventInfo}>
                                            <Text style={styles.clusterEventTitle} numberOfLines={1}>
                                                {event.title}
                                            </Text>
                                            <Text style={styles.clusterEventMeta}>
                                                {EVENT_TYPE_LABELS[event.eventType]} • {formatDate(event.date || event.startDate)}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </View>
    )
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        gap: SPACING.md,
    },
    loadingText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },

    // Header
    headerContainer: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
    },
    header: {
        marginHorizontal: SPACING.lg,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        ...SHADOWS.medium,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    moreFiltersButton: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.surfaceSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Filter Pills
    filterPillsContainer: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        gap: SPACING.sm,
    },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.full,
        marginRight: SPACING.sm,
        ...SHADOWS.small,
    },
    filterPillActive: {
        backgroundColor: COLORS.primary,
    },
    filterPillDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    filterPillText: {
        fontSize: 13,
        fontWeight: '500',
        color: COLORS.text,
    },
    filterPillTextActive: {
        color: COLORS.buttonPrimaryText,
    },

    // Search This Area Button
    searchAreaButtonContainer: {
        position: 'absolute',
        top: 180,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    searchAreaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.full,
        ...SHADOWS.medium,
    },
    searchAreaButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.buttonPrimaryText,
    },

    // Center Button
    centerButton: {
        position: 'absolute',
        bottom: SPACING.lg,
        right: SPACING.lg,
        width: 48,
        height: 48,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },

    // Markers
    markerContainer: {
        alignItems: 'center',
    },
    markerBubble: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    markerBubbleSelected: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 3,
    },
    markerPointer: {
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#FFFFFF',
        marginTop: -2,
    },
    markerPointerBorder: {
        position: 'absolute',
        bottom: -12,
        width: 0,
        height: 0,
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderTopWidth: 12,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        zIndex: -1,
    },
    clusterCount: {
        fontSize: 14,
        fontWeight: 'bold',
    },

    // Preview Card
    previewCard: {
        position: 'absolute',
        bottom: 30,
        left: SPACING.lg,
        right: SPACING.lg,
    },
    previewCardContent: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        ...SHADOWS.large,
    },
    eventTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: RADIUS.full,
        marginBottom: SPACING.sm,
    },
    eventTypeBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.buttonPrimaryText,
        textTransform: 'uppercase',
    },
    previewTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    previewInfoRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.md,
        marginBottom: SPACING.sm,
    },
    previewInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    previewInfoText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    previewLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: SPACING.sm,
    },
    previewLocationText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        flex: 1,
    },
    previewArrow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    previewArrowText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: SPACING.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    toggleOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.lg,
    },
    toggleLabel: {
        fontSize: 16,
        color: COLORS.text,
    },
    radiusSection: {
        marginBottom: SPACING.lg,
    },
    radiusSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.md,
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
    radiusOptionTextActive: {
        color: COLORS.buttonPrimaryText,
    },
    applyButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.lg,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        marginTop: SPACING.md,
    },
    applyButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.buttonPrimaryText,
    },

    // Cluster Modal Styles
    clusterModalContent: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: SPACING.xl,
        maxHeight: '60%',
    },
    clusterEventsList: {
        marginTop: SPACING.md,
    },
    clusterEventItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    clusterEventIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    clusterEventInfo: {
        flex: 1,
    },
    clusterEventTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    clusterEventMeta: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
})