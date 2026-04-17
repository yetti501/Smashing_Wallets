import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { databases, DATABASE_ID, ID, Query } from '../lib/appwrite'
import config from '../lib/config'
import { useAuth } from './AuthContext'

const BLOCKED_USERS_COLLECTION = config.appwrite.collections.blockedUsers
const REPORTS_COLLECTION = config.appwrite.collections.reports

const BlockedUsersContext = createContext()

export const blockedUsersService = {
    async blockUser(userId, blockedUserId) {
        try {
            const response = await databases.createDocument(
                DATABASE_ID,
                BLOCKED_USERS_COLLECTION,
                ID.unique(),
                { userId, blockedUserId }
            )
            return response
        } catch (error) {
            throw error
        }
    },

    async unblockUser(documentId) {
        try {
            await databases.deleteDocument(
                DATABASE_ID,
                BLOCKED_USERS_COLLECTION,
                documentId
            )
            return true
        } catch (error) {
            throw error
        }
    },

    async getBlockedUsers(userId) {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                BLOCKED_USERS_COLLECTION,
                [
                    Query.equal('userId', userId),
                    Query.orderDesc('$createdAt')
                ]
            )
            return response.documents
        } catch (error) {
            throw error
        }
    },

    async reportListing(userId, listingId, reportedUserId, reportType, description) {
        try {
            const response = await databases.createDocument(
                DATABASE_ID,
                REPORTS_COLLECTION,
                ID.unique(),
                {
                    userId,
                    listingId,
                    reportedUserId,
                    reportType,
                    description: description || '',
                    status: 'pending',
                }
            )
            return response
        } catch (error) {
            throw error
        }
    },
}

export const BlockedUsersProvider = ({ children }) => {
    const { user } = useAuth()
    const [blockedUsers, setBlockedUsers] = useState([])
    const [blockedUserIds, setBlockedUserIds] = useState(new Set())
    const [loading, setLoading] = useState(false)

    const clearBlockedUsers = useCallback(() => {
        setBlockedUsers([])
        setBlockedUserIds(new Set())
    }, [])

    const fetchBlockedUsers = useCallback(async (userId) => {
        if (!userId) return

        try {
            setLoading(true)
            const docs = await blockedUsersService.getBlockedUsers(userId)
            setBlockedUsers(docs)
            setBlockedUserIds(new Set(docs.map(d => d.blockedUserId)))
        } catch (err) {
            console.warn('[BlockedUsers] fetch failed:', err?.message)
        } finally {
            setLoading(false)
        }
    }, [])

    // Sync with auth state — re-fetch on login, clear on logout
    useEffect(() => {
        if (user?.$id) {
            fetchBlockedUsers(user.$id)
        } else {
            clearBlockedUsers()
        }
    }, [user?.$id, fetchBlockedUsers, clearBlockedUsers])

    const blockUser = useCallback(async (blockedUserId) => {
        if (!user) throw new Error('Must be logged in to block users')

        try {
            const newBlock = await blockedUsersService.blockUser(user.$id, blockedUserId)
            setBlockedUsers(prev => [newBlock, ...prev])
            setBlockedUserIds(prev => new Set(prev).add(blockedUserId))
            return newBlock
        } catch (err) {
            console.warn('[BlockedUsers] block failed:', err?.message)
            throw err
        }
    }, [user])

    const unblockUser = useCallback(async (blockedUserId) => {
        if (!user) throw new Error('Must be logged in to unblock users')

        const doc = blockedUsers.find(d => d.blockedUserId === blockedUserId)
        if (!doc) return

        try {
            await blockedUsersService.unblockUser(doc.$id)
            setBlockedUsers(prev => prev.filter(d => d.$id !== doc.$id))
            setBlockedUserIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(blockedUserId)
                return newSet
            })
        } catch (err) {
            console.warn('[BlockedUsers] unblock failed:', err?.message)
            throw err
        }
    }, [user, blockedUsers])

    const isUserBlocked = useCallback((userId) => {
        return blockedUserIds.has(userId)
    }, [blockedUserIds])

    const reportListing = useCallback(async (listingId, reportedUserId, reportType, description) => {
        if (!user) throw new Error('Must be logged in to report listings')
        return await blockedUsersService.reportListing(user.$id, listingId, reportedUserId, reportType, description)
    }, [user])

    const value = {
        blockedUsers,
        blockedUserIds,
        loading,
        blockUser,
        unblockUser,
        isUserBlocked,
        reportListing,
        refreshBlockedUsers: () => fetchBlockedUsers(user?.$id),
    }

    return (
        <BlockedUsersContext.Provider value={value}>
            {children}
        </BlockedUsersContext.Provider>
    )
}

export const useBlockedUsers = () => {
    const context = useContext(BlockedUsersContext)
    if (!context) {
        throw new Error('useBlockedUsers must be used within BlockedUsersProvider')
    }
    return context
}
