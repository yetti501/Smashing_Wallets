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
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/Colors'
import { EVENT_TYPES, EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '../../lib/appwrite'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

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

export default function MapScreen() {
    const { listings } = useListings()
    const [location, setLocation] = useState(null)
    const [loading, setLoading] = useState(true)
    const [searchRadius, setSearchRadius] = useState(10) // km
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [filterModalVisible, setFilterModalVisible] = useState(false)
    const [selectedEventType, setSelectedEventType] = useState(null)
    const [showPastEvents, setShowPastEvents] = useState(false)
    
    const mapRef = useRef(null)
    const cardAnimation = useRef(new Animated.Value(0)).current

    // Get user location
    useEffect(() => {
        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync()
                
                if (status !== 'granted') {
                    // Default to Phoenix if no permission
                    setLocation({
                        latitude: 33.4484,
                        longitude: -112.0740,
                        latitudeDelta: 0.15,
                        longitudeDelta: 0.15,
                    })
                    setLoading(false)
                    return
                }

                let currentLocation = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                })
                
                setLocation({
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                    latitudeDelta: 0.15,
                    longitudeDelta: 0.15,
                })
                setLoading(false)
            } catch (error) {
                console.error('Location error:', error)
                // Default location on error
                setLocation({
                    latitude: 33.4484,
                    longitude: -112.0740,
                    latitudeDelta: 0.15,
                    longitudeDelta: 0.15,
                })
                setLoading(false)
            }
        })()
    }, [])

    // Animate card in/out
    useEffect(() => {
        Animated.spring(cardAnimation, {
            toValue: selectedEvent ? 1 : 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
        }).start()
    }, [selectedEvent])

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

    // Filter events
    const filteredEvents = useMemo(() => {
        if (!location) return []
        
        let filtered = listings.filter(event => {
            // Must have coordinates
            if (!event.latitude || !event.longitude) return false
            
            // Filter by distance
            const distance = calculateDistance(
                location.latitude,
                location.longitude,
                event.latitude,
                event.longitude
            )
            if (distance > searchRadius) return false
            
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
    }, [listings, location, searchRadius, selectedEventType, showPastEvents])

    // Handle marker press
    const handleMarkerPress = (event) => {
        setSelectedEvent(event)
        
        // Center map on selected marker
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

    // Recenter on user
    const handleRecenter = () => {
        if (mapRef.current && location) {
            mapRef.current.animateToRegion(location, 500)
        }
        setSelectedEvent(null)
    }

    // Handle filter pill press
    const handleFilterPillPress = (eventType) => {
        if (selectedEventType === eventType) {
            setSelectedEventType(null) // Deselect if already selected
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

    // Get distance text
    const getDistanceText = (event) => {
        if (!location || !event.latitude || !event.longitude) return ''
        const distance = calculateDistance(
            location.latitude,
            location.longitude,
            event.latitude,
            event.longitude
        )
        if (distance < 1) {
            return `${Math.round(distance * 1000)}m away`
        }
        return `${distance.toFixed(1)} km away`
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Finding your location...</Text>
            </View>
        )
    }

    if (!location) {
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
                initialRegion={location}
                showsUserLocation={true}
                showsMyLocationButton={false}
                onPress={handleMapPress}
            >
                {/* Search radius circle */}
                {/* <Circle
                    center={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                    }}
                    radius={searchRadius * 1000}
                    fillColor="rgba(255, 87, 71, 0.08)"
                    strokeColor="rgba(255, 87, 71, 0.3)"
                    strokeWidth={2}
                /> */}

                {/* Event markers */}
                {filteredEvents.map((event) => (
                    <Marker
                        key={event.$id}
                        coordinate={{
                            latitude: event.latitude,
                            longitude: event.longitude,
                        }}
                        onPress={() => handleMarkerPress(event)}
                    >
                        <View style={[
                            styles.markerDot,
                            { backgroundColor: EVENT_TYPE_COLORS[event.eventType] || COLORS.primary },
                            selectedEvent?.$id === event.$id && styles.markerDotSelected
                        ]}>
                            {selectedEvent?.$id === event.$id && (
                                <View style={styles.markerDotInner} />
                            )}
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Header with Filter Pills */}
            <View style={styles.headerContainer}>
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>Nearby Events</Text>
                            <Text style={styles.headerSubtitle}>
                                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} within {searchRadius} km
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
                                <Ionicons name="navigate-outline" size={14} color={COLORS.primary} />
                                <Text style={[styles.previewInfoText, { color: COLORS.primary }]}>
                                    {getDistanceText(selectedEvent)}
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
                                            ]}>{radius} km</Text>
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
    
    // Center Button
    centerButton: {
        position: 'absolute',
        bottom: 100,
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
    markerDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    markerDotSelected: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 4,
    },
    markerDotInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.surface,
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
})