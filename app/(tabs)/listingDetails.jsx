import { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native'
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import ThemedSafeArea from '../../components/ThemedSafeArea'
import ThemedInfoCard from '../../components/ThemedInfoCard'
import ImageGallery from '../../components/ImageGallery'
import SaveButton from '../../components/SaveButton'
import ShareButton from '../../components/ShareButton'
import { useListings } from '../../contexts/ListingsContext'
import { useAuth } from '../../contexts/AuthContext'
import { COLORS, SPACING, RADIUS } from '../../constants/Colors'
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '../../lib/appwrite'
import { 
    formatDate, 
    formatDateRange, 
    getRelativeTimeString, 
    isHappeningSoon,
    isPast 
} from '../../utils/dateHelpers'
import { calendarService } from '../../lib/calendarService'
import { locationService } from '../../lib/locationService'

export default function ListingDetailsScreen() {
    const { listingId } = useLocalSearchParams()
    const { user } = useAuth()
    const { getListing, deleteListing } = useListings()
    
    const [listing, setListing] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [addingToCalendar, setAddingToCalendar] = useState(false)
    const [userLocation, setUserLocation] = useState(null)
    const [distanceInfo, setDistanceInfo] = useState(null)

    useFocusEffect(
        useCallback(() => {
            if (listingId) {
                loadListing()
            }
        }, [listingId])
    )

    // Get user location on mount
    useEffect(() => {
        const getLocation = async () => {
            const location = await locationService.getCurrentLocation()
            if (location) {
                setUserLocation(location)
            }
        }
        getLocation()
    }, [])

    // Calculate distance when we have both location and listing
    useEffect(() => {
        if (userLocation && listing?.latitude && listing?.longitude) {
            const info = locationService.getDistanceAndETA(userLocation, listing, 'miles')
            setDistanceInfo(info)
        }
    }, [userLocation, listing])

    const loadListing = async () => {
        try {
            setLoading(true)
            const data = await getListing(listingId)
            setListing(data)
        } catch (err) {
            setError(err.message)
            console.error('Error loading listing:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = () => {
        router.push({
            pathname: '/(tabs)/editListing',
            params: { listingId: listing.$id }
        })
    }

    const handleDelete = () => {
        Alert.alert(
            'Delete Event',
            'Are you sure you want to delete this event? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteListing(listing.$id)
                            Alert.alert('Success', 'Event deleted successfully')
                            router.back()
                        } catch (error) {
                            Alert.alert('Error', error.message)
                        }
                    }
                }
            ]
        )
    }

    const handleCallPhone = () => {
        if (listing.contactPhone) {
            Linking.openURL(`tel:${listing.contactPhone}`)
        }
    }

    const handleEmailContact = () => {
        if (listing.contactEmail) {
            Linking.openURL(`mailto:${listing.contactEmail}`)
        }
    }

    const handleGetDirections = () => {
        const address = encodeURIComponent(listing.location)
        const url = `https://www.google.com/maps/search/?api=1&query=${address}`
        Linking.openURL(url)
    }

    const handleAddToCalendar = async () => {
        if (!listing || addingToCalendar) return
        
        setAddingToCalendar(true)
        
        try {
            let result
            
            if (listing.multiday && listing.startDate && listing.endDate) {
                result = await calendarService.addMultiDayToCalendar(listing)
            } else {
                result = await calendarService.addToCalendar(listing)
            }
            
            if (result.success) {
                Alert.alert(
                    'Added to Calendar',
                    `"${listing.title}" has been added to your calendar.`,
                    [{ text: 'OK' }]
                )
            } else if (result.error && result.error !== 'Permission denied') {
                Alert.alert(
                    'Error',
                    'Could not add event to calendar. Please try again.',
                    [{ text: 'OK' }]
                )
            }
        } catch (error) {
            console.error('Error adding to calendar:', error)
            Alert.alert(
                'Error',
                'Something went wrong. Please try again.',
                [{ text: 'OK' }]
            )
        } finally {
            setAddingToCalendar(false)
        }
    }

    // Get images array - handle both old single image and new images array
    const getImages = () => {
        if (listing.images && listing.images.length > 0) {
            return listing.images
        }
        if (listing.image) {
            return [listing.image]
        }
        return []
    }

    // Check if current user is the owner
    const isOwner = user && listing && user.$id === listing.userId

    if (loading) {
        return (
            <ThemedSafeArea centered>
                <Text>Loading event details...</Text>
            </ThemedSafeArea>
        )
    }

    if (error || !listing) {
        return (
            <ThemedSafeArea centered>
                <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
                <Text style={styles.errorText}>
                    {error || 'Event not found'}
                </Text>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </ThemedSafeArea>
        )
    }

    // Format dates
    const getDisplayDate = () => {
        if (listing.multiday && listing.startDate && listing.endDate) {
            return formatDateRange(listing.startDate, listing.endDate)
        }
        return formatDate(listing.date || listing.startDate)
    }

    const eventDate = listing.date || listing.startDate
    const relativeTime = getRelativeTimeString(eventDate)
    const eventIsPast = isPast(eventDate)
    const images = getImages()

    return (
        <ThemedSafeArea scrollable={false} extraBottomPadding={0} edges={['top']}>
            <ScrollView 
                style={styles.container} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 0 }}
            >
                {/* Image Gallery */}
                <View style={styles.imageContainer}>
                    <ImageGallery 
                        images={images}
                        placeholderIcon={EVENT_TYPE_ICONS[listing.eventType] || 'calendar-outline'}
                        height={300}
                    />
                    
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButtonOverlay}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.buttonPrimaryText} />
                    </TouchableOpacity>

                    {/* Badges */}
                    <View style={styles.badgeContainer}>
                        {listing.featured && (
                            <View style={styles.badge}>
                                <Ionicons name="star" size={14} color={COLORS.badgeText} />
                                <Text style={styles.badgeText}>Featured</Text>
                            </View>
                        )}
                        {listing.multiday && (
                            <View style={[styles.badge, styles.multidayBadge]}>
                                <Ionicons name="calendar" size={14} color={COLORS.badgeText} />
                                <Text style={styles.badgeText}>Multi-Day</Text>
                            </View>
                        )}
                        {listing.isRecurring && (
                            <View style={[styles.badge, styles.recurringBadge]}>
                                <Ionicons name="repeat" size={14} color={COLORS.badgeText} />
                                <Text style={styles.badgeText}>Recurring</Text>
                            </View>
                        )}
                        {isHappeningSoon(eventDate) && !eventIsPast && (
                            <View style={[styles.badge, styles.soonBadge]}>
                                <Ionicons name="time" size={14} color={COLORS.badgeText} />
                                <Text style={styles.badgeText}>Soon!</Text>
                            </View>
                        )}
                        {eventIsPast && (
                            <View style={[styles.badge, styles.pastBadge]}>
                                <Text style={styles.badgeText}>Past Event</Text>
                            </View>
                        )}
                    </View>

                    {/* Save and Share Buttons */}
                    <View style={styles.actionButtonsContainer}>
                        <ShareButton 
                            listing={listing}
                            size="medium"
                            variant="icon"
                        />
                        {!isOwner && (
                            <SaveButton 
                                listingId={listing.$id}
                                size="medium"
                                variant="icon"
                            />
                        )}
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Event Type */}
                    <View style={styles.eventTypeRow}>
                        <Ionicons 
                            name={EVENT_TYPE_ICONS[listing.eventType] || 'calendar-outline'} 
                            size={20} 
                            color={COLORS.primary} 
                        />
                        <Text style={styles.eventType}>
                            {EVENT_TYPE_LABELS[listing.eventType] || listing.eventType}
                        </Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{listing.title}</Text>

                    {/* Relative Time */}
                    <Text style={styles.relativeTime}>{relativeTime}</Text>

                    {/* Price */}
                    {listing.price && (
                        <Text style={styles.price}>{listing.price}</Text>
                    )}

                    {/* Date & Time Card */}
                    <ThemedInfoCard style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Date</Text>
                                <Text style={styles.infoValue}>{getDisplayDate()}</Text>
                            </View>
                        </View>

                        {(listing.startTime || listing.endTime) && (
                            <View style={styles.infoRow}>
                                <Ionicons name="time-outline" size={24} color={COLORS.primary} />
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>Time</Text>
                                    <Text style={styles.infoValue}>
                                        {listing.startTime && listing.endTime 
                                            ? `${listing.startTime} - ${listing.endTime}`
                                            : listing.startTime 
                                            ? `Starting at ${listing.startTime}`
                                            : listing.endTime}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </ThemedInfoCard>

                    {/* Location Card */}
                    <ThemedInfoCard style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={24} color={COLORS.primary} />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Location</Text>
                                <Text style={styles.infoValue}>{listing.location}</Text>
                                {listing.area && (
                                    <Text style={styles.areaText}>{listing.area}</Text>
                                )}
                            </View>
                        </View>

                        {/* Distance and ETA */}
                        {distanceInfo && (
                            <View style={styles.distanceETARow}>
                                <View style={styles.distanceItem}>
                                    <Ionicons name="car-outline" size={18} color={COLORS.primary} />
                                    <Text style={styles.distanceText}>{distanceInfo.distance}</Text>
                                </View>
                                <View style={styles.etaItem}>
                                    <Ionicons name="time-outline" size={18} color={COLORS.primary} />
                                    <Text style={styles.etaText}>{distanceInfo.eta} drive</Text>
                                </View>
                            </View>
                        )}
                        
                        <TouchableOpacity
                            style={styles.directionsButton}
                            onPress={handleGetDirections}
                        >
                            <Ionicons name="navigate" size={16} color={COLORS.primary} />
                            <Text style={styles.directionsButtonText}>Get Directions</Text>
                        </TouchableOpacity>
                    </ThemedInfoCard>

                    {/* Add to Calendar */}
                    <TouchableOpacity 
                        onPress={handleAddToCalendar}
                        disabled={addingToCalendar}
                        activeOpacity={0.7}
                    >
                        <ThemedInfoCard style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                {addingToCalendar ? (
                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                ) : (
                                    <Ionicons name="add-circle-outline" size={24} color={COLORS.primary}/>
                                )}
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>Add to Calendar</Text>
                                    <Text style={styles.infoValue}>
                                        {addingToCalendar ? 'Adding...' : 'Save to Google or Apple Calendar'}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
                            </View>
                        </ThemedInfoCard>
                    </TouchableOpacity>

                    {/* Description */}
                    {listing.description && (
                        <ThemedInfoCard style={styles.infoCard}>
                            <Text style={styles.sectionTitle}>About</Text>
                            <Text style={styles.description}>{listing.description}</Text>
                        </ThemedInfoCard>
                    )}

                    {/* Tags */}
                    {listing.tags && listing.tags.length > 0 && (
                        <ThemedInfoCard style={styles.infoCard}>
                            <Text style={styles.sectionTitle}>Tags</Text>
                            <View style={styles.tagsContainer}>
                                {listing.tags.map((tag, index) => (
                                    <View key={index} style={styles.tag}>
                                        <Text style={styles.tagText}>#{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        </ThemedInfoCard>
                    )}

                    {/* Contact Information */}
                    {((listing.contactPhone && listing.showPhone !== false) || 
                      (listing.contactEmail && listing.showEmail !== false)) && (
                        <ThemedInfoCard style={styles.infoCard}>
                            <Text style={styles.sectionTitle}>Contact</Text>
                            
                            {listing.contactPhone && listing.showPhone !== false && (
                                <TouchableOpacity
                                    style={styles.contactButton}
                                    onPress={handleCallPhone}
                                >
                                    <Ionicons name="call-outline" size={20} color={COLORS.primary} />
                                    <Text style={styles.contactButtonText}>
                                        {listing.contactPhone}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            
                            {listing.contactEmail && listing.showEmail !== false && (
                                <TouchableOpacity
                                    style={styles.contactButton}
                                    onPress={handleEmailContact}
                                >
                                    <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
                                    <Text style={styles.contactButtonText}>
                                        {listing.contactEmail}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </ThemedInfoCard>
                    )}

                    {/* Owner Actions */}
                    {isOwner && (
                        <View style={styles.ownerActions}>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={handleEdit}
                            >
                                <Ionicons name="create-outline" size={20} color={COLORS.buttonPrimaryText} />
                                <Text style={styles.editButtonText}>Edit Event</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={handleDelete}
                            >
                                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                                <Text style={styles.deleteButtonText}>Delete Event</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </ThemedSafeArea>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    imageContainer: {
        width: '100%',
        height: 300,
        backgroundColor: COLORS.surfaceSecondary,
    },
    backButtonOverlay: {
        position: 'absolute',
        top: SPACING.xl,
        left: SPACING.lg,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    actionButtonsContainer: {
        position: 'absolute',
        top: SPACING.xl,
        right: SPACING.lg,
        flexDirection: 'row',
        gap: SPACING.sm,
        zIndex: 10,
    },
    badgeContainer: {
        position: 'absolute',
        bottom: SPACING.lg,
        left: SPACING.lg,
        gap: SPACING.xs,
        flexDirection: 'row',
        flexWrap: 'wrap',
        zIndex: 10,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.full,
        gap: 4,
    },
    multidayBadge: {
        backgroundColor: COLORS.info,
    },
    recurringBadge: {
        backgroundColor: '#8B5CF6',
    },
    soonBadge: {
        backgroundColor: COLORS.warning,
    },
    pastBadge: {
        backgroundColor: COLORS.textTertiary,
    },
    badgeText: {
        color: COLORS.badgeText,
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.lg,
        paddingBottom: 0,
    },
    eventTypeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: SPACING.sm,
    },
    eventType: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    relativeTime: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },
    price: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: SPACING.lg,
    },
    infoCard: {
        marginBottom: SPACING.lg,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACING.md,
        marginBottom: SPACING.md,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    areaText: {
        fontSize: 14,
        color: COLORS.textTertiary,
        marginTop: 4,
    },
    distanceETARow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.lg,
        paddingVertical: SPACING.md,
        marginTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    distanceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    distanceText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },
    etaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    etaText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },
    directionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: SPACING.sm,
    },
    directionsButtonText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    description: {
        fontSize: 16,
        color: COLORS.textSecondary,
        lineHeight: 24,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    tag: {
        backgroundColor: COLORS.surfaceSecondary,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.md,
    },
    tagText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    contactButtonText: {
        fontSize: 16,
        color: COLORS.text,
    },
    ownerActions: {
        marginTop: SPACING.lg,
        gap: SPACING.md,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.primary,
        padding: SPACING.lg,
        borderRadius: RADIUS.md,
    },
    editButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.buttonPrimaryText,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.surface,
        padding: SPACING.lg,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.error,
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.error,
    },
    errorText: {
        fontSize: 16,
        color: COLORS.error,
        marginTop: SPACING.lg,
        marginBottom: SPACING.lg,
        textAlign: 'center',
    },
    backButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.buttonPrimaryText,
    },
})

