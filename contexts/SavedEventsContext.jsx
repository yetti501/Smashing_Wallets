import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { databases, DATABASE_ID, ID, Query } from '../lib/appwrite'
import config from '../lib/config'
import { useAuth } from './AuthContext'

// Get the collection ID directly from config
const SAVED_EVENTS_COLLECTION = config.appwrite.collections.savedEvents

const SavedEventsContext = createContext()

export const savedEventsService = {
    /**
     * Save an event for a user
     */
    async saveEvent(userId, listingId) {
        try {
            const response = await databases.createDocument(
                DATABASE_ID,
                SAVED_EVENTS_COLLECTION,
                ID.unique(),
                {
                    userId,
                    listingId,
                    savedAt: new Date().toISOString()
                }
            )
            return response
        } catch (error) {
            if (error.code === 409) {
                throw new Error('Event already saved')
            }
            throw error
        }
    },

    /**
     * Unsave/remove an event
     */
    async unsaveEvent(documentId) {
        try {
            await databases.deleteDocument(
                DATABASE_ID,
                SAVED_EVENTS_COLLECTION,
                documentId
            )
            return true
        } catch (error) {
            throw error
        }
    },

    /**
     * Get all saved events for a user
     */
    async getSavedEvents(userId) {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                SAVED_EVENTS_COLLECTION,
                [
                    Query.equal('userId', userId),
                    Query.orderDesc('savedAt')
                ]
            )
            return response.documents
        } catch (error) {
            throw error
        }
    },

    /**
     * Check if a specific event is saved by a user
     */
    async isEventSaved(userId, listingId) {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                SAVED_EVENTS_COLLECTION,
                [
                    Query.equal('userId', userId),
                    Query.equal('listingId', listingId),
                    Query.limit(1)
                ]
            )
            return response.documents.length > 0 ? response.documents[0] : null
        } catch (error) {
            throw error
        }
    },

    /**
     * Get count of saves for a listing
     */
    async getSaveCount(listingId) {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                SAVED_EVENTS_COLLECTION,
                [
                    Query.equal('listingId', listingId)
                ]
            )
            return response.total
        } catch (error) {
            return 0
        }
    }
}

export const SavedEventsProvider = ({ children }) => {
    const { user, onLogout, onLogin } = useAuth()
    const [savedEvents, setSavedEvents] = useState([])
    const [savedListingIds, setSavedListingIds] = useState(new Set())
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    /**
     * Clear all saved events state
     */
    const clearSavedEvents = useCallback(() => {
        console.log('>>> SavedEventsContext: clearing saved events')
        setSavedEvents([])
        setSavedListingIds(new Set())
        setError(null)
    }, [])

    /**
     * Fetch saved events from database
     */
    const fetchSavedEvents = useCallback(async (userId) => {
        if (!userId) return
        
        try {
            setLoading(true)
            setError(null)
            console.log('>>> SavedEventsContext: fetching saved events for', userId)
            const events = await savedEventsService.getSavedEvents(userId)
            setSavedEvents(events)
            setSavedListingIds(new Set(events.map(e => e.listingId)))
            console.log('>>> SavedEventsContext: fetched', events.length, 'saved events')
        } catch (err) {
            setError(err.message)
            console.error('Error fetching saved events:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    // Register logout listener - clears state IMMEDIATELY when logout happens
    // Register logout listener - clears state IMMEDIATELY when logout happens
    useEffect(() => {
        console.log('>>> SavedEventsContext: registering logout listener')
        const unsubscribe = onLogout(() => {
            console.log('>>> SavedEventsContext: logout detected, clearing state')
            clearSavedEvents()
        })
        return () => {
            console.log('>>> SavedEventsContext: cleanup - unregistering logout listener')
            unsubscribe()
        }
    }, [onLogout, clearSavedEvents])

    // Register login listener - fetches saved events when user logs in
    useEffect(() => {
        const unsubscribe = onLogin((loggedInUser) => {
            console.log('>>> SavedEventsContext: login detected, fetching saved events')
            fetchSavedEvents(loggedInUser.$id)
        })
        return unsubscribe
    }, [onLogin, fetchSavedEvents])

    // Initial fetch if user is already logged in (e.g., app restart with session)
    useEffect(() => {
        if (user) {
            fetchSavedEvents(user.$id)
        }
    }, []) // Only run on mount

    /**
     * Toggle save state for an event
     */
    const toggleSaveEvent = useCallback(async (listingId) => {
        if (!user) {
            throw new Error('Must be logged in to save events')
        }

        try {
            const existingSave = savedEvents.find(e => e.listingId === listingId)
            
            if (existingSave) {
                await savedEventsService.unsaveEvent(existingSave.$id)
                setSavedEvents(prev => prev.filter(e => e.$id !== existingSave.$id))
                setSavedListingIds(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(listingId)
                    return newSet
                })
                return { saved: false }
            } else {
                const newSave = await savedEventsService.saveEvent(user.$id, listingId)
                setSavedEvents(prev => [newSave, ...prev])
                setSavedListingIds(prev => new Set(prev).add(listingId))
                return { saved: true }
            }
        } catch (err) {
            setError(err.message)
            throw err
        }
    }, [user, savedEvents])

    /**
     * Check if a listing is saved (synchronous, uses local state)
     */
    const isEventSaved = useCallback((listingId) => {
        return savedListingIds.has(listingId)
    }, [savedListingIds])

    /**
     * Get the save document for a listing
     */
    const getSaveDocument = useCallback((listingId) => {
        return savedEvents.find(e => e.listingId === listingId)
    }, [savedEvents])

    const value = {
        savedEvents,
        savedListingIds,
        loading,
        error,
        toggleSaveEvent,
        isEventSaved,
        getSaveDocument,
        refreshSavedEvents: () => fetchSavedEvents(user?.$id),
        clearSavedEvents,
        savedCount: savedEvents.length
    }

    return (
        <SavedEventsContext.Provider value={value}>
            {children}
        </SavedEventsContext.Provider>
    )
}

export const useSavedEvents = () => {
    const context = useContext(SavedEventsContext)
    if (!context) {
        throw new Error('useSavedEvents must be used within SavedEventsProvider')
    }
    return context
}