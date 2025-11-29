import { StyleSheet, View, FlatList, TouchableOpacity, Pressable, Text, Modal } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'


import ThemedSafeArea from '../../components/ThemedSafeArea'
import ThemedHeader from '../../components/ThemedHeader'
import ThemedInfoCard from '../../components/ThemedInfoCard'
import ListCard from './listCard'
import EmptyState from '../../components/EmptyState'
import ThemedFAB from '../../components/ThemedFAB'
import { useListings } from '../../contexts/ListingsContext'
import { useAuth } from '../../contexts/AuthContext'
import { COLORS, SPACING } from '../../constants/Colors'
import { EVENT_TYPES, EVENT_TYPE_LABELS } from '../../lib/appwrite'

export default function ViewListingScreen() {
    const { user } = useAuth()
    const {
        listings,
        loading, 
        refreshing,
        refreshList
    } = useListings()

    const [filterModalVisible, setFilterModalVisible] = useState(false)
    const [filters, setFilters] = useState({
        eventType: null, 
        search: '',
        showPastEvents: false
    })

    const getFilteredListings = () => {
        let filtered = [...listings]
        // Filter by event type
        if(filters.eventType){
            filtered = filtered.filter(l => l.eventType === filters.eventType)
        }
        // Filter by search term
        if(filters.search) {
            filtered = filtered.filter(l => 
                l.title.toLowerCase().includes(filters.search.toLowerCase()) || 
                l.location.toLowerCase(). includes(filters.search.toLowerCase())
            )
        }
        // Filter our past events 
        if(!filters.showPastEvents) {
            const today = new Date().toISOString().split('T')[0]
            filtered = filtered.filter(l => {
                const eventDate = l.date || l.startDate 
                return eventDate >= today
            })
        }

        return filtered
    }

    const filteredListings = getFilteredListings()

    //Get upcoming events count
    const getUpComingCount = () => {
        const now = new Date()
        return listings.filter(listing => {
            const eventDate = listing.date || listing.startDate
            if(!eventDate) return false
            return new Date(eventDate) > now
        }).length
    }
    // Push to open details page
    const handleListingPress = (listing) => {
        router.push({
            pathname: '(tabs)/listingDetails',
            params: {listingId: listing.$id}
        })
    }
    // Push to add new listings page 
    const handleAddListing = () => {
        if(!user) {
            alert('Please log into create an event')
            // add a redirect to the login page
            return
        } 
        router.push('/(tabs)/newListing')
    }

    const clearFilters = () => {
        setFilters({
            eventType: null, 
            search: '',
            showPastEvents: false
        })
    }

    const hasActiveFilters = filters.eventType || filters.search || filters.showPastEvents

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
            {/* Filter Button */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterButton, hasActiveFilters &&styles.filterVuttonActive]}
                    onPress={() => setFilterModalVisible(true)}
                >
                    <Ionicons
                        name="filter"
                        size={20}
                        color={hasActiveFilters ? COLORS.buttonPrimaryText : COLORS.text}
                    />
                    <Text style={[
                        styles.filterButtonText, hasActiveFilters && styles.filterButtonTextActive
                    ]}>
                        Filters
                    </Text>

                    {hasActiveFilters && (
                        <View style={styles.filterBadgeText}>
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
                    {filters.eventType && (
                        <View style={styles.activeFilters}>
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

    if (loading && listings.length === 0) {
        return (
            <ThemedSafeArea centered>
                <Text>Loading events...</Text>
            </ThemedSafeArea>
        )
    }

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <ThemedSafeArea scrollable={false} edges={['top']}>
                <View style={styles.container}>
                    <ThemedHeader
                        title="All Events"
                        subtitle="Discover Loacal Events"
                    />
                    <FlatList
                        data={filteredListings}
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
                                icon="calendar-outline"
                                title={hasActiveFilters ? "No Events Found" : "No Events Yet"}
                                subtitle={hasActiveFilters ? "Try adjusting your filters" : "Be the first to create an event!"}
                            />
                        }
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshing={refreshing}
                        onRefresh={refreshList}
                    />

                    {/* Filter Modal */}
                    <FilterModal
                        visible={filterModalVisible}
                        onClose={() => setFilterModalVisible(false)}
                        filters={filters}
                        setFilters={setFilters}
                    />
                </View>
            </ThemedSafeArea>

            {/* FAB outside ThemedSafeArea but inside the flex container */}
            {user && (
                <ThemedFAB
                    icon="add"
                    onPress={handleAddListing}
                    style={{
                        position: 'absolute',
                        right: 20,
                        bottom: 30,
                    }}
                />
            )}
        </View>
    )
    
    // return (
    //     <ThemedSafeArea scrollable={false} edges={['top']}>
    //         <View style={styles.container}>
    //             <ThemedHeader
    //                 title="All Events"
    //                 subtitle="Discover Loacal Events"
    //             />
    //             <FlatList
    //                 data={filteredListings}
    //                 keyExtractor={(item) => item.$id}
    //                 renderItem={({ item }) => (
    //                     <ListCard
    //                         listing={item}
    //                         onPress={() => handleListingPress(item)}
    //                         showAuthor={true}
    //                         currentUser={user}
    //                     />
    //                 )}
    //                 ListHeaderComponent={renderHeader}
    //                 ListEmptyComponent={
    //                     <EmptyState
    //                         icon="calendar-outline"
    //                         title={hasActiveFilters ? "No Events Found" : "No Events Yet"}
    //                         subtitle={hasActiveFilters ? "Try adjusting your filters" : "Be the first to create an event!"}
    //                     />
    //                 }
    //                 contentContainerStyle={styles.listContent}  // Fixed typo
    //                 showsVerticalScrollIndicator={false}
    //                 refreshing={refreshing}
    //                 onRefresh={refreshList}
    //             />

    //             {user && (
    //                 <ThemedFAB
    //                     icon="add"
    //                     onPress={handleAddListing}
    //                     style={styles.fab}
    //                 />
    //             )}

    //             {/* Filter Modal */}
    //             <FilterModal
    //                 visible={filterModalVisible}
    //                 onClose={() => setFilterModalVisible(false)}
    //                 filters={filters}
    //                 setFilters={setFilters}
    //             />
    //         </View>
    //     </ThemedSafeArea>
    // )
}

// Filter Modal Conent
const FilterModal = ({ visible, onClose, filters, setFilters }) => {
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
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter Events</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Event Type Filter */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterSectionTitle}>Event Type</Text>
                            <View style={styles.eventTypeGrid}>
                                <TouchableOpacity
                                    style={[
                                        styles.eventTypeButton, 
                                        !filters.eventType && styles.eventTypeButtonActive
                                    ]}
                                    onPress={() => setFilters({ ...filters, eventType: null})}
                                >
                                    <Text style={styles.eventTypeButtonText}>All</Text>
                                </TouchableOpacity>
                                {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                                    <TouchableOpacity
                                        key={key}
                                        style={[
                                            styles.eventTypeButton, 
                                            filters.eventType === key && styles.eventTypeButtonActive
                                        ]}
                                        onPress={() => setFilters({ ...filters, eventType: key})}
                                    >
                                        <Text style={styles.eventTypeButtonText}>{label}</Text>
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
        gap: SPACING.md,
        marginBottom: SPACING.md,
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
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: 16,
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
    toggleOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        marginBottom: SPACING.md,
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
        // Add both for cross-platform compatibility
        elevation: 8,        // Android
        shadowColor: '#000', // iOS
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        zIndex: 999,        // Both platforms
    }
})