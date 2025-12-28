import { StyleSheet, View, TouchableOpacity, Image, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SPACING, RADIUS } from '../../constants/Colors'
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '../../lib/appwrite'
import { formatDate, formatDateRange, isHappeningSoon } from '../../utils/dateHelpers'
import SaveButton from '../../components/SaveButton'

const ListCard = ({ listing, onPress, showAuthor = false, currentUser }) => {
    const isOwner = currentUser && listing.userId === currentUser.$id

    // Determine which date to display
    const getDisplayDate = () => {
        if(listing.multiday && listing.startDate && listing.endDate) {
            return formatDateRange(listing.startDate, listing.endDate)
        }
        return formatDate(listing.date || listing.startDate)
    }

    // Format time
    const formatTime = (startTime, endTime) => {
        if(!startTime && !endTime) return null
        if (startTime && endTime) return `${startTime} - ${endTime}`
        if (startTime) return `Starting at ${startTime}`
        return null
    }

    const timeDisplay = formatTime(listing.startTime, listing.endTime)
    const eventDate = listing.date || listing.startDate
    
    // Get first image or null
    const displayImage = listing.image || (listing.images && listing.images[0]) || null

    return (
        <TouchableOpacity
            style={[styles.card, isOwner && styles.ownerCard]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Image */}
            <View style={styles.imageContainer}>
                {displayImage ? (
                    <Image
                        source={{ uri: displayImage }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.image, styles.placeholderImage]}>
                        <Ionicons
                            name={EVENT_TYPE_ICONS[listing.eventType] || 'calendar-outline'}
                            size={60}
                            color={COLORS.textTertiary}
                        />
                    </View>
                )}
                
                {/* Save Button - Top Left (show for non-owners) */}
                {!isOwner && (
                    <View style={styles.saveButtonContainer}>
                        <SaveButton 
                            listingId={listing.$id}
                            size="medium"
                            variant="icon"
                        />
                    </View>
                )}
            </View>

            {/* Badges */}
            <View style={styles.badgeContainer}>
                {isOwner && (
                    <View style={[styles.badge, styles.ownerBadge]}>
                        <Ionicons name="person" size={14} color={COLORS.badgeText} />
                        <Text style={styles.badgeText}>Your Event</Text>
                    </View>
                )}
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
                    {isHappeningSoon(eventDate) && (
                        <View style={[styles.badge, styles.soonBadge]}>
                            <Ionicons name="time" size={14} color={COLORS.badgeText} />
                            <Text style={styles.badgeText}>Soon!</Text>
                        </View>
                    )}
            </View>

            {/* Content */}
            <View style={styles.contentRow}>
                <View style={styles.content}>
                    {/* Event Type */}
                    <View style={styles.eventTypeRow}>
                        <Ionicons 
                            name={EVENT_TYPE_ICONS[listing.eventType] || 'calendar-outline'} 
                            size={16} 
                            color={COLORS.primary} 
                        />
                        <Text style={styles.eventType}>
                            {EVENT_TYPE_LABELS[listing.eventType] || listing.eventType}
                        </Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.title} numberOfLines={2}>
                        {listing.title}
                    </Text>

                    {/* Date */}
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.infoText}>
                            {getDisplayDate()}
                        </Text>
                    </View>

                    {/* Time */}
                    {timeDisplay && (
                        <View style={styles.infoRow}>
                            <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                            <Text style={styles.infoText}>
                                {timeDisplay}
                            </Text>
                        </View>
                    )}

                    {/* Location */}
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.infoText} numberOfLines={1}>
                                {listing.location}
                            </Text>
                            {listing.area && (
                                <Text style={styles.area} numberOfLines={1}>
                                    {listing.area}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Tags */}
                    {listing.tags && listing.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                            {listing.tags.slice(0, 3).map((tag, index) => (
                                <View key={index} style={styles.tag}>
                                    <Text style={styles.tagText}>#{tag}</Text>
                                </View>
                            ))}
                            {listing.tags.length > 3 && (
                                <Text style={styles.moreTagsText}>
                                    +{listing.tags.length - 3}
                                </Text>
                            )}
                        </View>
                    )}

                    {/* Price */}
                    {listing.price && (
                        <Text style={styles.price}>{listing.price}</Text>
                    )}
                </View>
                {/* Arrow */}
                <View style={styles.arrowContainer}>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
                </View>
            </View>
        </TouchableOpacity>
    )
}

export default ListCard

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        marginBottom: SPACING.lg,
        overflow: 'hidden',
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    imageContainer: {
        width: '100%',
        height: 180,
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
    saveButtonContainer: {
        position: 'absolute',
        top: SPACING.md,
        left: SPACING.md,
    },
    badgeContainer: {
        position: 'absolute',
        top: SPACING.md,
        right: SPACING.md,
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
    recurringBadge: {
        backgroundColor: '#8B5CF6', // Purple for recurring
    },
    soonBadge: {
        backgroundColor: COLORS.warning,
    },
    badgeText: {
        color: COLORS.badgeText,
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        padding: SPACING.lg,
        flex: 1
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 2,
        borderTopColor: COLORS.primary,
    },
    eventTypeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: SPACING.sm,
    },
    eventType: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: SPACING.xs,
    },
    infoText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        flex: 1,
    },
    area: {
        fontSize: 12,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.xs,
        marginTop: SPACING.sm,
        marginBottom: SPACING.xs,
    },
    tag: {
        backgroundColor: COLORS.surfaceSecondary,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: RADIUS.sm,
    },
    tagText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '500',
    },
    moreTagsText: {
        fontSize: 12,
        color: COLORS.textTertiary,
        paddingVertical: 4,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginTop: SPACING.xs,
    },
    arrowContainer: {
        right: SPACING.lg,
    },
    ownerBadge: {
        backgroundColor: COLORS.primary
    },
    ownerCard: {
        backgroundColor: 'rgba(255, 87, 71, 0.25)',
    }
})