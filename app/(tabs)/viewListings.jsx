import { StyleSheet, View, FlatList, TouchableOpacity, Pressable, Text, Modal, Alert, ActivityIndicator } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useState, useCallback, useEffect } from 'react'

import ThemedSafeArea from '../../components/ThemedSafeArea'
import ThemedHeader from '../../components/ThemedHeader'
import ThemedInfoCard from '../../components/ThemedInfoCard'
// import ListCard from './listCard'
import ListCard from '../../components/ListCard'
import EmptyState from '../../components/EmptyState'
import ThemedFAB from '../../components/ThemedFAB'
import { useListings } from '../../contexts/ListingsContext'
import { useSavedEvents } from '../../contexts/SavedEventsContext'
import { useAuth } from '../../contexts/AuthContext'
import { COLORS, SPACING } from '../../constants/Colors'
import { EVENT_TYPES, EVENT_TYPE_LABELS } from '../../lib/appwrite'

export default function ViewListingScreen() {
    const { user, loading: authLoading, checkUser } = useAuth()
    const {
        listings,
        loading, 
        refreshing,
        refreshList
    } = useListings()
    const { savedListingIds, savedCount } = useSavedEvents()

    const [initialLoad, setInitialLoad] = useState(true)
    const [filterModalVisible, setFilterModalVisible] = useState(false)
    const [filters, setFilters] = useState({
        eventType: null, 
        search: '',
        showPastEvents: false,
        showSavedOnly: false
    })

    // DEBUG - remove after confirming fix
    console.log('=== RENDER STATE ===')
    console.log('user:', user ? user.$id : null)
    console.log('savedCount:', savedCount)

    useFocusEffect(
        useCallback(() => {
            console.log('>>> useFocusEffect: screen focused, user:', user?.$id)
            checkUser()  // Re-check auth state when screen is focused
            refreshList().finally(() => setInitialLoad(false))
        }, [])
    )

    // Separately, respond to user changes
    useEffect(() => {
        console.log('>>> useEffect: user changed to:', user ? user.$id : null)
    }, [user])

    // Reset saved filter if user logs out
    useEffect(() => {
        if (!user && filters.showSavedOnly) {
            setFilters(prev => ({
                ...prev,
                showSavedOnly: false
            }))
        }
    }, [user])

    const getFilteredListings = () => {
        let filtered = [...listings]
        
        // Filter by saved events only
        if (filters.showSavedOnly) {
            filtered = filtered.filter(l => savedListingIds.has(l.$id))
        }
        
        // Filter by event type
        if (filters.eventType) {
            filtered = filtered.filter(l => l.eventType === filters.eventType)
        }
        
        // Filter by search term
        if (filters.search) {
            filtered = filtered.filter(l => 
                l.title.toLowerCase().includes(filters.search.toLowerCase()) || 
                l.location.toLowerCase().includes(filters.search.toLowerCase())
            )
        }
        
        // Filter out past events 
        if (!filters.showPastEvents) {
            const today = new Date().toISOString().split('T')[0]
            filtered = filtered.filter(l => {
                const eventDate = l.date || l.startDate 
                return eventDate >= today
            })
        }

        return filtered
    }

    const filteredListings = getFilteredListings()

    // Get upcoming events count
    const getUpComingCount = () => {
        const now = new Date()
        return listings.filter(listing => {
            const eventDate = listing.date || listing.startDate
            if (!eventDate) return false
            return new Date(eventDate) > now
        }).length
    }
    
    // Push to open details page
    const handleListingPress = (listing) => {
        router.push({
            pathname: '(tabs)/listingDetails',
            params: { listingId: listing.$id }
        })
    }
    
    // Push to add new listings page 
    const handleAddListing = () => {
        if (!user) {
            Alert.alert(
                'Login Required',
                'Please log in to create an event.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Log In', onPress: () => router.push('/login') }
                ]
            )
            return
        } 
        router.push('/(tabs)/newListing')
    }

    const clearFilters = () => {
        setFilters({
            eventType: null, 
            search: '',
            showPastEvents: false,
            showSavedOnly: false
        })
    }

    const handleSavedFilterPress = () => {
        if (!user) {
            Alert.alert(
                'Login Required',
                'Create an account or log in to save events and filter by your favorites.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Log In', onPress: () => router.push('/login') }
                ]
            )
            return
        }
        setFilters(prev => ({ ...prev, showSavedOnly: !prev.showSavedOnly }))
    }

    const hasActiveFilters = filters.eventType || filters.search || filters.showPastEvents || filters.showSavedOnly

    const renderHeader = () => (
        <View>
            {/* Stats Card */}
            <View style={styles.statsContainer}>
                <ThemedInfoCard style={styles.statCard}>
                    <Text style={styles.statNumber}>{listings.length}</Text>
                    <Text style={styles.statLabel}>Total Events</Text>
                </ThemedInfoCard>

                <ThemedInfoCard style={styles.statCard}>
                    <Text style={styles.statNumber}>
                        {getUpComingCount()}
                    </Text>
                    <Text style={styles.statLabel}>Upcoming</Text>
                </ThemedInfoCard>
            </View>
            
            {/* Filter Buttons Row */}
            <View style={styles.filterContainer}>
                {/* Saved Events Quick Filter */}
                <TouchableOpacity
                    style={[
                        styles.savedFilterButton,
                        filters.showSavedOnly && styles.savedFilterButtonActive
                    ]}
                    onPress={handleSavedFilterPress}
                >
                    <Ionicons
                        name={filters.showSavedOnly ? "heart" : "heart-outline"}
                        size={18}
                        color={filters.showSavedOnly ? COLORS.buttonPrimaryText : COLORS.primary}
                    />
                    <Text style={[
                        styles.savedFilterText,
                        filters.showSavedOnly && styles.savedFilterTextActive
                    ]}>
                        Saved {user && savedCount > 0 ? `(${savedCount})` : ''}
                    </Text>
                </TouchableOpacity>

                {/* Main Filter Button */}
                <TouchableOpacity
                    style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
                    onPress={() => setFilterModalVisible(true)}
                >
                    <Ionicons
                        name="filter"
                        size={20}
                        color={hasActiveFilters ? COLORS.buttonPrimaryText : COLORS.text}
                    />
                    <Text style={[
                        styles.filterButtonText, 
                        hasActiveFilters && styles.filterButtonTextActive
                    ]}>
                        Filters
                    </Text>

                    {hasActiveFilters && (
                        <View style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>
                                {Object.values(filters).filter(v => v && v !== '').length}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                {hasActiveFilters && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={clearFilters}
                    >
                        <Text style={styles.clearButtonText}>Clear</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <View style={styles.activeFiltersContainer}>
                    {filters.showSavedOnly && (
                        <View style={[styles.activeFilter, styles.savedActiveFilter]}>
                            <Ionicons name="heart" size={12} color={COLORS.buttonPrimaryText} />
                            <Text style={styles.activeFilterText}>Saved Events</Text>
                        </View>
                    )}
                    {filters.eventType && (
                        <View style={styles.activeFilter}>
                            <Text style={styles.activeFilterText}>
                                {EVENT_TYPE_LABELS[filters.eventType]}
                            </Text>
                        </View>
                    )}
                    {filters.showPastEvents && (
                        <View style={styles.activeFilter}>
                            <Text style={styles.activeFilterText}>
                                Past Events
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    )

    // Get empty state content based on filters
    const getEmptyStateContent = () => {
        if (filters.showSavedOnly) {
            return {
                icon: "heart-outline",
                title: "No Saved Events",
                subtitle: "Tap the heart icon on any event to save it here for quick access."
            }
        }
        if (hasActiveFilters) {
            return {
                icon: "search-outline",
                title: "No Events Found",
                subtitle: "Try adjusting your filters to see more events."
            }
        }
        return {
            icon: "calendar-outline",
            title: "No Events Yet",
            subtitle: "Be the first to create an event in your area!"
        }
    }

    const emptyState = getEmptyStateContent()

    // Show loading only on initial load
    if (authLoading || initialLoad) {
        return (
            <ThemedSafeArea centered>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading events...</Text>
            </ThemedSafeArea>
        )
    }
    
    return (
        <ThemedSafeArea scrollable={false} extraBottomPadding={0} edges={['top']}>
            <View style={styles.container}>
                <ThemedHeader
                    title={filters.showSavedOnly ? "Saved Events" : "All Events"}
                    subtitle={filters.showSavedOnly ? `${filteredListings.length} saved event${filteredListings.length !== 1 ? 's' : ''}` : "Discover Local Events"}
                />
                <FlatList
                    key={user?.$id || 'logged-out'}
                    data={filteredListings}
                    extraData={user}
                    keyExtractor={(item) => item.$id}
                    renderItem={({ item }) => (
                        <ListCard
                            listing={item}
                            onPress={() => handleListingPress(item)}
                            showAuthor={true}
                            currentUser={user}
                        />
                    )}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={
                        <EmptyState
                            icon={emptyState.icon}
                            title={emptyState.title}
                            subtitle={emptyState.subtitle}
                        />
                    }
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshing={refreshing}
                    onRefresh={refreshList}
                />

                {user && (
                    <ThemedFAB
                        icon="add"
                        onPress={handleAddListing}
                        style={styles.fab}
                    />
                )}

                {/* Filter Modal */}
                <FilterModal
                    visible={filterModalVisible}
                    onClose={() => setFilterModalVisible(false)}
                    filters={filters}
                    setFilters={setFilters}
                    user={user}
                />
            </View>
        </ThemedSafeArea>
    )
}

// Filter Modal Content
const FilterModal = ({ visible, onClose, filters, setFilters, user }) => {
    const handleSavedToggle = () => {
        if (!user) {
            Alert.alert(
                'Login Required',
                'Create an account or log in to save events and filter by your favorites.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Log In', onPress: () => {
                        onClose()
                        router.push('/login')
                    }}
                ]
            )
            return
        }
        setFilters({ ...filters, showSavedOnly: !filters.showSavedOnly })
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <Pressable 
                style={styles.modalOverlay}
                onPress={onClose}
            >
                <View style={styles.modalContent}>
                    <Pressable onPress={() => {}}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter Events</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Saved Events Toggle */}
                        <TouchableOpacity
                            style={styles.toggleOption}
                            onPress={handleSavedToggle}
                        >
                            <View style={styles.toggleLabelRow}>
                                <Ionicons 
                                    name={filters.showSavedOnly ? "heart" : "heart-outline"} 
                                    size={20} 
                                    color={COLORS.primary} 
                                />
                                <Text style={styles.toggleLabel}>Saved Events Only</Text>
                            </View>
                            <Ionicons
                                name={filters.showSavedOnly ? "checkbox" : "square-outline"}
                                size={24}
                                color={COLORS.primary}
                            />
                        </TouchableOpacity>

                        {/* Event Type Filter */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterSectionTitle}>Event Type</Text>
                            <View style={styles.eventTypeGrid}>
                                <TouchableOpacity
                                    style={[
                                        styles.eventTypeButton,
                                        !filters.eventType && styles.eventTypeButtonActive
                                    ]}
                                    onPress={() => setFilters({ ...filters, eventType: null })}
                                >
                                    <Text style={[
                                        styles.eventTypeButtonText,
                                        !filters.eventType && styles.eventTypeButtonTextActive
                                    ]}>All</Text>
                                </TouchableOpacity>
                                {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                                    <TouchableOpacity
                                        key={key}
                                        style={[
                                            styles.eventTypeButton, 
                                            filters.eventType === key && styles.eventTypeButtonActive
                                        ]}
                                        onPress={() => setFilters({ ...filters, eventType: key })}
                                    >
                                        <Text style={[
                                            styles.eventTypeButtonText,
                                            filters.eventType === key && styles.eventTypeButtonTextActive
                                        ]}>{label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Show Past Events Toggle */}
                        <TouchableOpacity
                            style={styles.toggleOption}
                            onPress={() => setFilters({
                                ...filters, 
                                showPastEvents: !filters.showPastEvents
                            })}
                        >
                            <Text style={styles.toggleLabel}>Show Past Events</Text>
                            <Ionicons
                                name={filters.showPastEvents ? "checkbox" : "square-outline"}
                                size={24}
                                color={COLORS.primary}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={onClose}
                        >
                            <Text style={styles.applyButtonText}>Apply Filters</Text>
                        </TouchableOpacity>
                    </Pressable>
                </View>
            </Pressable>
        </Modal>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: 20,
        flexGrow: 1,
    },
    loadingText: {
        marginTop: SPACING.md,
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.lg,
        marginTop: SPACING.md,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: SPACING.lg,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    savedFilterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    savedFilterButtonActive: {
        backgroundColor: COLORS.primary,
    },
    savedFilterText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    savedFilterTextActive: {
        color: COLORS.buttonPrimaryText,
    },
    filterButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        padding: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    filterButtonTextActive: {
        color: COLORS.buttonPrimaryText,
    },
    filterBadge: {
        backgroundColor: COLORS.buttonPrimaryText,
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    clearButton: {
        padding: SPACING.md,
    },
    clearButtonText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    activeFiltersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    activeFilter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: 16,
    },
    savedActiveFilter: {
        backgroundColor: COLORS.primary,
    },
    activeFilterText: {
        fontSize: 12,
        color: COLORS.buttonPrimaryText,
        fontWeight: '600',
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
        maxHeight: '80%',
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
    filterSection: {
        marginBottom: SPACING.xl,
    },
    filterSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    eventTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    eventTypeButton: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    eventTypeButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    eventTypeButtonText: {
        fontSize: 14,
        color: COLORS.text,
    },
    eventTypeButtonTextActive: {
        color: COLORS.buttonPrimaryText,
    },
    toggleOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        marginBottom: SPACING.md,
    },
    toggleLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    toggleLabel: {
        fontSize: 16,
        color: COLORS.text,
    },
    applyButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.lg,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: SPACING.md,
    },
    applyButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.buttonPrimaryText,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        zIndex: 999,
    }
})