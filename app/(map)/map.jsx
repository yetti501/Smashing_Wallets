import React, { useState, useEffect, useRef, useMemo } from 'react'
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
import MapView, { Marker, Circle } from 'react-native-maps'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'

import { useListings } from '../../contexts/ListingsContext'
import { useAuth } from '../../contexts/AuthContext'
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/Colors'
import { EVENT_TYPES, EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '../../lib/appwrite'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Custom map style to hide default POIs
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

// Color mapping for event types
const EVENT_TYPE_COLORS = {
    [EVENT_TYPES.YARD_SALE]: '#22C55E',      // Green
    [EVENT_TYPES.GARAGE_SALE]: '#3B82F6',    // Blue
    [EVENT_TYPES.ESTATE_SALE]: '#8B5CF6',    // Purple
    [EVENT_TYPES.BAKE_SALE]: '#F59E0B',      // Orange
    [EVENT_TYPES.CRAFT_FAIR]: '#EC4899',     // Pink
    [EVENT_TYPES.FARMERS_MARKET]: '#10B981', // Teal
    [EVENT_TYPES.FLEA_MARKET]: '#6366F1',    // Indigo
    [EVENT_TYPES.SWAP_MEET]: '#EF4444',      // Red
    [EVENT_TYPES.BOOK_SALE]: '#0EA5E9',      // Sky Blue
    [EVENT_TYPES.OTHER]: '#6B7280',          // Gray
}

// Minimum distance (in km) to move before showing "Search this area" button
const MIN_MOVE_DISTANCE = 1 // 1km

export default function MapScreen() {
    const { listings } = useListings()
    const { user } = useAuth()
    const [userLocation, setUserLocation] = useState(null) // User's actual GPS location
    const [searchCenter, setSearchCenter] = useState(null) // Center point for filtering events
    const [currentMapRegion, setCurrentMapRegion] = useState(null) // Current visible map region
    const [loading, setLoading] = useState(true)
    const [searchRadius, setSearchRadius] = useState(10) // in miles by default
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [filterModalVisible, setFilterModalVisible] = useState(false)
    const [selectedEventType, setSelectedEventType] = useState(null)
    const [showPastEvents, setShowPastEvents] = useState(false)
    const [showSearchButton, setShowSearchButton] = useState(false)
    
    const mapRef = useRef(null)
    const cardAnimation = useRef(new Animated.Value(0)).current
    const searchButtonAnimation = useRef(new Animated.Value(0)).current
    const [clusterModalVisible, setClusterModalVisible] = useState(false)
    const [clusterEvents, setClusterEvents] = useState([])

    // Get user's distance unit preference (default to miles)
    const distanceUnit = user?.prefs?.distanceUnit || 'miles'
    
    // Convert between miles and km
    const milesToKm = (miles) => miles * 1.60934
    const kmToMiles = (km) => km / 1.60934
    
    // Get radius in km for calculations (internal always uses km)
    const getRadiusInKm = () => {
        return distanceUnit === 'miles' ? milesToKm(searchRadius) : searchRadius
    }
    
    // Format distance for display based on user preference
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
    
    // Get unit label
    const getUnitLabel = () => distanceUnit === 'miles' ? 'mi' : 'km'

    // Calculate distance between two points
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371 // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        return R * c
    }


    useEffect(() => {
    (async () => {
        try {
            console.log('=== LOCATION DEBUG: Starting ===');
            
            let { status } = await Location.requestForegroundPermissionsAsync()
            console.log('=== LOCATION DEBUG: Permission status:', status);
            
            const defaultLocation = {
                latitude: 33.4484,
                longitude: -112.0740,
                latitudeDelta: 0.15,
                longitudeDelta: 0.15,
            }
            
            if (status !== 'granted') {
                console.log('=== LOCATION DEBUG: Permission denied, using default ===');
                setUserLocation(defaultLocation)
                setSearchCenter(defaultLocation)
                setCurrentMapRegion(defaultLocation)
                setLoading(false)
                return
            }

            console.log('=== LOCATION DEBUG: Getting current position... ===');
            
            let currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeout: 10000,  // Add 10 second timeout
            })
            
            console.log('=== LOCATION DEBUG: Got position:', currentLocation.coords);
            
            const locationData = {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.15,
                longitudeDelta: 0.15,
            }
            
            setUserLocation(locationData)
            setSearchCenter(locationData)
            setCurrentMapRegion(locationData)
            console.log('=== LOCATION DEBUG: State updated, setting loading false ===');
            setLoading(false)
        } catch (error) {
            console.error('=== LOCATION DEBUG: Error:', error);
            const defaultLocation = {
                latitude: 33.4484,
                longitude: -112.0740,
                latitudeDelta: 0.15,
                longitudeDelta: 0.15,
            }
            setUserLocation(defaultLocation)
            setSearchCenter(defaultLocation)
            setCurrentMapRegion(defaultLocation)
            setLoading(false)
        }
    })()
}, [])

    // // Get user location
    // useEffect(() => {
    //     (async () => {
    //         try {
    //             let { status } = await Location.requestForegroundPermissionsAsync()
                
    //             const defaultLocation = {
    //                 latitude: 33.4484,
    //                 longitude: -112.0740,
    //                 latitudeDelta: 0.15,
    //                 longitudeDelta: 0.15,
    //             }
                
    //             if (status !== 'granted') {
    //                 setUserLocation(defaultLocation)
    //                 setSearchCenter(defaultLocation)
    //                 setCurrentMapRegion(defaultLocation)
    //                 setLoading(false)
    //                 return
    //             }

    //             let currentLocation = await Location.getCurrentPositionAsync({
    //                 accuracy: Location.Accuracy.Balanced,
    //             })
                
    //             const locationData = {
    //                 latitude: currentLocation.coords.latitude,
    //                 longitude: currentLocation.coords.longitude,
    //                 latitudeDelta: 0.15,
    //                 longitudeDelta: 0.15,
    //             }
                
    //             setUserLocation(locationData)
    //             setSearchCenter(locationData)
    //             setCurrentMapRegion(locationData)
    //             setLoading(false)
    //         } catch (error) {
    //             console.error('Location error:', error)
    //             const defaultLocation = {
    //                 latitude: 33.4484,
    //                 longitude: -112.0740,
    //                 latitudeDelta: 0.15,
    //                 longitudeDelta: 0.15,
    //             }
    //             setUserLocation(defaultLocation)
    //             setSearchCenter(defaultLocation)
    //             setCurrentMapRegion(defaultLocation)
    //             setLoading(false)
    //         }
    //     })()
    // }, [])

    // Animate card in/out
    useEffect(() => {
        Animated.spring(cardAnimation, {
            toValue: selectedEvent ? 1 : 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
        }).start()
    }, [selectedEvent])

    // Animate search button in/out
    useEffect(() => {
        Animated.spring(searchButtonAnimation, {
            toValue: showSearchButton ? 1 : 0,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
        }).start()
    }, [showSearchButton])

    // Handle region change complete - check if we should show search button
    const handleRegionChangeComplete = (region) => {
        setCurrentMapRegion(region)
        
        if (!searchCenter) return
        
        // Calculate distance from search center to new map center
        const distanceMoved = calculateDistance(
            searchCenter.latitude,
            searchCenter.longitude,
            region.latitude,
            region.longitude
        )
        
        // Show button if moved more than threshold
        if (distanceMoved > MIN_MOVE_DISTANCE) {
            setShowSearchButton(true)
        } else {
            setShowSearchButton(false)
        }
    }

    // Handle "Search this area" button press
    const handleSearchThisArea = () => {
        if (!currentMapRegion) return
        
        // Update search center to current map center
        setSearchCenter({
            latitude: currentMapRegion.latitude,
            longitude: currentMapRegion.longitude,
            latitudeDelta: currentMapRegion.latitudeDelta,
            longitudeDelta: currentMapRegion.longitudeDelta,
        })
        
        // Hide the button
        setShowSearchButton(false)
        
        // Deselect any selected event
        setSelectedEvent(null)
    }

    // Filter events based on search center
    const filteredEvents = useMemo(() => {
        if (!searchCenter) return []
        
        const radiusInKm = getRadiusInKm()
        
        let filtered = listings.filter(event => {
            // Must have coordinates
            if (!event.latitude || !event.longitude) return false
            
            // Filter by distance from SEARCH CENTER (not user location)
            const distance = calculateDistance(
                searchCenter.latitude,
                searchCenter.longitude,
                event.latitude,
                event.longitude
            )
            if (distance > radiusInKm) return false
            
            // Filter by event type
            if (selectedEventType && event.eventType !== selectedEventType) return false
            
            // Filter past events
            if (!showPastEvents) {
                const today = new Date().toISOString().split('T')[0]
                const eventDate = (event.date || event.startDate || '').split('T')[0]
                if (eventDate && eventDate < today) return false
            }
            
            return true
        })
        
        return filtered
    }, [listings, searchCenter, searchRadius, selectedEventType, showPastEvents, distanceUnit])

    // Cluster nearby events (within ~50 meters of each other)
    const clusteredEvents = useMemo(() => {
        const CLUSTER_DISTANCE = 0.05 // ~50 meters in km
        const clusters = []
        const processed = new Set()
        
        filteredEvents.forEach((event, index) => {
            if (processed.has(event.$id)) return
            
            // Find all events near this one
            const nearbyEvents = filteredEvents.filter((otherEvent, otherIndex) => {
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
            
            // Mark all as processed
            nearbyEvents.forEach(e => processed.add(e.$id))
            
            // Create cluster
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

    // Handle marker press
    const handleMarkerPress = (cluster) => {
        if (cluster.count > 1) {
            // Multiple events - show cluster modal
            setClusterEvents(cluster.events)
            setClusterModalVisible(true)
        } else {
            // Single event - show preview card
            setSelectedEvent(cluster.events[0])
            
            // Center map on selected marker
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
    
    // Handle selecting event from cluster
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

    // Handle card press - navigate to details
    const handleCardPress = () => {
        if (selectedEvent) {
            router.push({
                pathname: '/(tabs)/listingDetails',
                params: { listingId: selectedEvent.$id }
            })
        }
    }

    // Handle map press - deselect
    const handleMapPress = () => {
        setSelectedEvent(null)
    }

    // Recenter on user location
    const handleRecenter = () => {
        if (mapRef.current && userLocation) {
            mapRef.current.animateToRegion(userLocation, 500)
            
            // Also update search center to user location
            setSearchCenter(userLocation)
            setShowSearchButton(false)
        }
        setSelectedEvent(null)
    }

    // Handle filter pill press
    const handleFilterPillPress = (eventType) => {
        if (selectedEventType === eventType) {
            setSelectedEventType(null)
        } else {
            setSelectedEventType(eventType)
        }
    }

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString + 'T00:00:00')
        return date.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short', 
            day: 'numeric' 
        })
    }

    // Get distance and ETA text
    const getDistanceETAText = (event) => {
        if (!userLocation || !event.latitude || !event.longitude) return { distance: '', eta: '' }
        const distanceInKm = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            event.latitude,
            event.longitude
        )
        
        // Calculate ETA (assume ~25 mph city driving)
        const distanceMiles = kmToMiles(distanceInKm)
        let etaMinutes
        if (distanceMiles < 10) {
            etaMinutes = (distanceMiles / 25) * 60
        } else {
            // First 5 miles at city speed, rest at highway
            etaMinutes = ((5 / 25) + ((distanceMiles - 5) / 55)) * 60
        }
        
        // Format ETA
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

    console.log('=== RENDER DEBUG ===');
    console.log('loading:', loading);
    console.log('userLocation:', userLocation);
    console.log('====================');

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Finding your location...</Text>
            </View>
        )
    }

    if (!userLocation) {
        return (
            <View style={styles.loadingContainer}>
                <Ionicons name="location-outline" size={48} color={COLORS.textTertiary} />
                <Text style={styles.errorText}>Location not available</Text>
                <Text style={styles.errorSubtext}>Please enable location services</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {/* Map */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider="google"
                initialRegion={userLocation}
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

            {/* Header with Filter Pills */}
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
                
                {/* Filter Pills */}
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

            {/* Search This Area Button */}
            <Animated.View
                style={[
                    styles.searchAreaButtonContainer,
                    {
                        transform: [
                            {
                                translateY: searchButtonAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-100, 0],
                                })
                            }
                        ],
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

            {/* Center on Me Button - Bottom Right */}
            <TouchableOpacity
                style={styles.centerButton}
                onPress={handleRecenter}
            >
                <Ionicons name="locate" size={24} color={COLORS.primary} />
            </TouchableOpacity>

            {/* Event Preview Card */}
            <Animated.View 
                style={[
                    styles.previewCard,
                    {
                        transform: [
                            {
                                translateY: cardAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [200, 0],
                                })
                            }
                        ],
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

                        {/* Info Row */}
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

                        {/* View Details Arrow */}
                        <View style={styles.previewArrow}>
                            <Text style={styles.previewArrowText}>View Details</Text>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                        </View>
                    </TouchableOpacity>
                )}
            </Animated.View>

            {/* More Filters Modal */}
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

                            {/* Search Radius */}
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

            {/* Cluster Events Modal */}
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
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: SPACING.md,
    },
    errorSubtext: {
        fontSize: 14,
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