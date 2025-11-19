import { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, Text, ScrollView, Image, TouchableOpacity, Alert, Linking } from 'react-native'
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import ThemedSafeArea from '../../components/ThemedSafeArea'
import ThemedInfoCard from '../../components/ThemedInfoCard'
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

export default function ListingDetailsScreen() {
    const { listingId } = useLocalSearchParams()
    const { user } = useAuth()
    const { getListing, deleteListing } = useListings()
    
    const [listing, setListing] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // useEffect(() => {
    //     loadListing()
    // }, [listingId])

    useFocusEffect(
        useCallback(() => {
            if (listingId) {
                loadListing()
            }
        }, [listingId])
    )

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

    return (
        <ThemedSafeArea scrollable={false}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header with Image */}
                <View style={styles.imageContainer}>
                    {listing.image ? (
                        <Image
                            source={{ uri: listing.image }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.image, styles.placeholderImage]}>
                            <Ionicons 
                                name={EVENT_TYPE_ICONS[listing.eventType] || 'calendar-outline'} 
                                size={80} 
                                color={COLORS.textTertiary} 
                            />
                        </View>
                    )}
                    
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

                    <ThemedInfoCard style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="add-outline" size={24} color={COLORS.primary}/>
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Add to Calendar</Text>
                                <Text style={styles.infoValue}>Link to Google or Apple Calendar</Text>
                            </View>
                        </View>
                    </ThemedInfoCard>

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
                        
                        <TouchableOpacity
                            style={styles.directionsButton}
                            onPress={handleGetDirections}
                        >
                            <Ionicons name="navigate" size={16} color={COLORS.primary} />
                            <Text style={styles.directionsButtonText}>Get Directions</Text>
                        </TouchableOpacity>
                    </ThemedInfoCard>

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
                    {(listing.contactPhone || listing.contactEmail) && (
                        <ThemedInfoCard style={styles.infoCard}>
                            <Text style={styles.sectionTitle}>Contact</Text>
                            
                            {listing.contactPhone && (
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
                            
                            {listing.contactEmail && (
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
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        justifyContent: 'center',
        alignItems: 'center',
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
    },
    badgeContainer: {
        position: 'absolute',
        top: SPACING.xl,
        right: SPACING.lg,
        gap: SPACING.xs,
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
        padding: SPACING.lg,
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