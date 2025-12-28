import { databases, DATABASE_ID, COLLECTIONS, ID } from '../lib/appwrite'
import { Query } from 'appwrite'
import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const ListingsContext = createContext() 

export const listingService = {
    // ============================================
    // CREATE
    // ============================================
    async createListing(listingData) {
        try {
            if(!listingData.userId) {
                throw new Error('userId is required')
            }
            if(!listingData.title) {
                throw new Error('title is required')
            }
            if(!listingData.location) {
                throw new Error('location is required')
            }
            if(!listingData.eventType) {
                throw new Error('eventType is required')
            }

            const response = await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.LISTINGS,
                ID.unique(),
                {
                    ...listingData, 
                    status: listingData.status || 'active',
                    featured: listingData.featured || false,
                    isRecurring: listingData.isRecurring || false, 
                    multiday: listingData.multiday || false, 
                    tags: listingData.tags || [],
                    images: listingData.images || [],
                }
            )
            return response
        } catch (error) {
            throw error
        }
    },
    // ============================================
    // READ
    // ============================================
    async getListing(listingId) {
        try {
            const response = await databases.getDocument(
                DATABASE_ID, 
                COLLECTIONS.LISTINGS,
                listingId
            )
            return response
        } catch (error) {
            throw error
        }
    },

    async getAllListings(queries = []) {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.LISTINGS,
                queries
            )
            return response.documents
        } catch (error) {
            throw error
        }
    },
    // ============================================
    // UPDATE
    // ============================================
    async updateListing(listingId, updates) {
        try {
            const response = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.LISTINGS,
                listingId,
                updates
            )
            return response
        } catch (error) {
            throw error
        }
    },

    // ============================================
    // DELETE
    // ============================================
    async deleteListing(listingId) {
        try {
            await databases.deleteDocument(
                DATABASE_ID,
                COLLECTIONS.LISTINGS,
                listingId
            )
            return true
        } catch (error) {
            throw error
        }
    }

}

export const ListingsProvider = ({ children }) => {
    const [listings, setListings] = useState([])
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState(null)
    const { user, onLogout, onLogin } = useAuth()

    // Extracted and reusable fetch function
    const fetchListings = async () => {
        try {
            console.log('>>> ListingsContext: fetching listings')
            const fetchedListings = await listingService.getAllListings([
                Query.orderDesc('$createdAt')
            ])
            setListings(fetchedListings)
            setError(null)
        } catch (error) {
            setError(error.message)
            console.error('Error fetching listings:', error)
        }
    }

    // Initial load
    useEffect(() => {
        const loadListings = async () => { 
            setLoading(true)
            await fetchListings()
            setLoading(false)
        }
        loadListings()
    }, [])

    // Register for login/logout events to refresh listings
    useEffect(() => {
        console.log('>>> ListingsContext: registering login/logout listeners')
        
        const unsubscribeLogout = onLogout(() => {
            console.log('>>> ListingsContext: logout detected, refreshing listings')
            fetchListings()
        })

        const unsubscribeLogin = onLogin(() => {
            console.log('>>> ListingsContext: login detected, refreshing listings')
            fetchListings()
        })

        return () => {
            console.log('>>> ListingsContext: cleanup - unregistering listeners')
            unsubscribeLogout()
            unsubscribeLogin()
        }
    }, [onLogout, onLogin])

    // Function to refresh listings (for pull-to-refresh)
    const refreshList = async () => {
        setRefreshing(true)
        await fetchListings()
        setRefreshing(false)
    }


    // Function to create a listing
    const createListing = async (listingData) => {
        try {
            setLoading(true)
            setError(null)
        
            // Automatically add userId from the authenticated user
            const dataWithUserId = {
                ...listingData,
                userId: user.$id
            }
        
            const newListing = await listingService.createListing(dataWithUserId)
            setListings(prev => [newListing, ...prev])
            return newListing
        } catch (err) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const updateListing = async (listingId, updates) => {
        try {
            setLoading(true)
            setError(null)

            const updatedListing = await listingService.updateListing(listingId, updates)

            setListings(prev => prev.map(listing => 
                listing.$id === listingId ? updatedListing : listing
            ))

            return updatedListing
        } catch (error) {
            setError(error.message)
            throw error
        } finally {
            setLoading(false)
        }
    }

    const deleteListing = async (listingId) => {
        try { 
            setLoading(true)
            setError(null)

            await listingService.deleteListing(listingId)

            // Remove the listing from state
            setListings(prev => prev.filter(listing => listing.$id !== listingId))

            return true
        } catch (error) {
            setError(error.message)
            return error
        } finally {
            setLoading(false)
        }
    }

    const value = {
        listings,
        loading,
        refreshing,
        error,
        createListing,
        refreshList,
        getListing: listingService.getListing,
        updateListing,
        deleteListing
    }

    return (
        <ListingsContext.Provider value={value}>
            {children}
        </ListingsContext.Provider>
    )
}

export const useListings = () => {
    const context = useContext(ListingsContext)
    if(!context) {
        throw new Error('useListings must be used within ListingsProvider')
    }
    return context
}