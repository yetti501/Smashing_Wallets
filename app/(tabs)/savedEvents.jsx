import { useState, useEffect, useCallback } from 'react'
import { 
    View, 
    StyleSheet, 
    FlatList, 
    Text,
    ActivityIndicator,
    RefreshControl
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'

import ThemedSafeArea from '../../components/ThemedSafeArea'
import ThemedHeader from '../../components/ThemedHeader'
// import ListCard from './listCard'
import ListCard from '../../components/ListCard'
import EmptyState from '../../components/EmptyState'
import { useSavedEvents } from '../../contexts/SavedEventsContext'
import { useListings } from '../../contexts/ListingsContext'
import { useAuth } from '../../contexts/AuthContext'
import { COLORS, SPACING } from '../../constants/Colors'

export default function SavedEventsScreen() {
    const { user } = useAuth()
    const { savedEvents, loading: savedLoading, refreshSavedEvents } = useSavedEvents()
    const { getListing } = useListings()
    
    const [listings, setListings] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    // Fetch full listing details for saved events
    const fetchSavedListings = async () => {
        if (!savedEvents.length) {
            setListings([])
            setLoading(false)
            return
        }

        try {
            const listingPromises = savedEvents.map(saved => 
                getListing(saved.listingId).catch(() => null)
            )
            const results = await Promise.all(listingPromises)
            
            // Filter out null results (deleted listings) and add savedAt date
            const validListings = results
                .map((listing, index) => {
                    if (!listing) return null
                    return {
                        ...listing,
                        savedAt: savedEvents[index].savedAt
                    }
                })
                .filter(Boolean)
            
            setListings(validListings)
        } catch (error) {
            console.error('Error fetching saved listings:', error)
        } finally {
            setLoading(false)
        }
    }

    // Refresh when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchSavedListings()
            }
        }, [savedEvents])
    )

    const handleRefresh = async () => {
        setRefreshing(true)
        await refreshSavedEvents()
        await fetchSavedListings()
        setRefreshing(false)
    }

    const handleListingPress = (listing) => {
        router.push({
            pathname: '(tabs)/listingDetails',
            params: { listingId: listing.$id }
        })
    }

    const handleExplore = () => {
        router.push('/(map)/map')
    }

    // Not logged in state
    if (!user) {
        return (
            <ThemedSafeArea>
                <ThemedHeader
                    title="Saved Events"
                    subtitle="Your favorited events"
                />
                <EmptyState
                    icon="heart-outline"
                    title="Log In to Save Events"
                    subtitle="Create an account to save events and access them from any device."
                    actionText="Log In"
                    onAction={() => router.push('/login')}
                />
            </ThemedSafeArea>
        )
    }

    // Loading state
    if (loading || savedLoading) {
        return (
            <ThemedSafeArea>
                <ThemedHeader
                    title="Saved Events"
                    subtitle="Your favorited events"
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading saved events...</Text>
                </View>
            </ThemedSafeArea>
        )
    }

    return (
        <ThemedSafeArea scrollable={false} edges={['top']}>
            <View style={styles.container}>
                <ThemedHeader
                    title="Saved Events"
                    subtitle={`${listings.length} saved event${listings.length !== 1 ? 's' : ''}`}
                />
                
                <FlatList
                    data={listings}
                    keyExtractor={(item) => item.$id}
                    renderItem={({ item }) => (
                        <ListCard
                            listing={item}
                            onPress={() => handleListingPress(item)}
                            currentUser={user}
                        />
                    )}
                    ListEmptyComponent={
                        <EmptyState
                            icon="heart-outline"
                            title="No Saved Events"
                            subtitle="Tap the heart icon on any event to save it here for quick access."
                            actionText="Explore Events"
                            actionIcon="map-outline"
                            onAction={handleExplore}
                        />
                    }
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={COLORS.primary}
                        />
                    }
                />
            </View>
        </ThemedSafeArea>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: SPACING.md,
        fontSize: 16,
        color: COLORS.textSecondary,
    },
})