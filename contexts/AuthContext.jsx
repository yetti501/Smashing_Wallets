import { account } from '../lib/appwrite'
import { ID } from 'appwrite'
import { router } from 'expo-router'
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const AuthContext = createContext()

export const authService = {
    async register(email, password, name) {
        try { 
            const response = await account.create(
                ID.unique(), 
                email, 
                password, 
                name
            )
            // Auto-login after registration
            await account.createEmailPasswordSession(email, password)
            return response
        } catch (error) {
            throw error
        }
    },

    async login(email, password) {
        try { 
            const session = await account.createEmailPasswordSession(email, password)
            return session
        } catch (error) {
            throw error
        }
    }, 

    async logout() {
        try { 
            await account.deleteSession('current')
        } catch (error) {
            throw error
        }
    },

    // ============================================
    // READ USER DATA
    // ============================================
    async getCurrentUser() {
        try { 
            return await account.get()
        } catch (error) {
            return null
        }
    },

    async getSessions() {
        try{
            return await account.listSessions()
        } catch (error) {
            throw error
        }
    },

    // ============================================
    // UPDATE USER PROFILE
    // ============================================
    async updateName(name) {
        try {
            await account.updateName(name)
            return await account.get()
        } catch (error) {
            throw error
        }
    },

    async updateEmail(email, password){
        try {
            // Requires current password for security 
            await account.updateEmail(email, password)
            return await account.get()
        } catch (error) {
            throw error
        }
    },

    async updatePassword(newPassword, oldPassword) {
        try {
            await account.updatePassword(newPassword, oldPassword)
            return await account.get()
        } catch (error) {
            throw error
        }
    },

    async updatePhone(phone, password){
        try {
            await account.updatePhone(phone, password)
            return await account.get()
        } catch (error) {
            throw error
        }
    },

    async updatePreferences(prefs){
        try {
            await account.updatePrefs(prefs)
            return await account.get()
        } catch (error) {
            throw error
        }
    },

    // ============================================
    // EMAIL VERIFICATION
    // ============================================
    async sendEmailVerification(redirectUrl){
        try {
            await account.createVerification(redirectUrl)
        } catch (error) {
            throw error
        }
    },

    async confirmEmailVerification(userId, secret) {
        try { 
            await account.updateVerification(userId, secret)
            return await account.get()
        } catch (error) {
            throw error
        }
    },

    // ============================================
    // PHONE VERIFICATION
    // ============================================
    async sendPhoneVerification() {
        try {
            await account.createPhoneVerification()
        } catch (error) {
            throw error
        }
    },

    async confirmPhoneVerification(userId, secret) {
        try {
            await account.updatePhoneVerification(userId, secret)
            return await account.get()
        } catch (error) {
            throw error
        }
    }, 

    // ============================================
    // PASSWORD RECOVERY
    // ============================================
    async resetPassword(email, redirectUrl) {
        try { 
            await account.createRecovery(email, redirectUrl)
        } catch (error) {
            throw error
        }
    },

    async completePasswordRecovery(userId, secret, newPassword) {
        try {
            await account.updateRecovery(userId, secret, newPassword)
        } catch (error) {
            throw error
        }
    },

    // ============================================
    // SESSION MANAGEMENT
    // ============================================
    async deleteSession(sessionId) {
        try {
            await account.deleteSession(sessionId)
        } catch (error) {
            throw error
        }
    },

    async deleteAllSessions() {
        try {
            await account.deleteSessions()
        } catch (error) {
            throw error
        }
    },

    // ============================================
    // ACCOUNT DELETION
    // ============================================
    async deleteAccount() {
        try {
            await account.delete()
        } catch (error) {
            throw error
        }
    }
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

        console.log('>>> AuthProvider render, user:', user ? user.$id : null)

    
    // Store logout and login listeners
    const logoutListenersRef = useRef(new Set())
    const loginListenersRef = useRef(new Set())

    // useEffect(() => {
    //     checkUser()
    // }, [])

    const [initialized, setInitialized] = useState(false)

    useEffect(() => {
        if (!initialized) {
            checkUser()
            setInitialized(true)
        }
    }, [initialized])

    const checkUser = async () => {
    console.log('>>> AuthContext: checkUser called')
    try {
        const currentUser = await authService.getCurrentUser()
        console.log('>>> AuthContext: checkUser got user:', currentUser ? currentUser.$id : null)
        setUser(currentUser)
    } catch (error) {
        console.log('>>> AuthContext: checkUser error:', error)
        setUser(null)
    } finally {
        setLoading(false)
    }
}

    // ============================================
    // LOGIN/LOGOUT LISTENER SYSTEM
    // ============================================
    
    /**
     * Register a callback to be called when user logs out
     * Returns an unsubscribe function
     */
    const onLogout = useCallback((callback) => {
        logoutListenersRef.current.add(callback)
        return () => {
            logoutListenersRef.current.delete(callback)
        }
    }, [])

    /**
     * Register a callback to be called when user logs in
     * Returns an unsubscribe function
     */
    const onLogin = useCallback((callback) => {
        loginListenersRef.current.add(callback)
        return () => {
            loginListenersRef.current.delete(callback)
        }
    }, [])

    /**x
     * Notify all logout listeners
     */
    const notifyLogoutListeners = useCallback(() => {
    console.log('>>> AuthContext: notifyLogoutListeners called, listeners:', logoutListenersRef.current.size)
    logoutListenersRef.current.forEach(callback => {
        try {
            console.log('>>> AuthContext: calling a logout listener')
            callback()
        } catch (error) {
            console.error('Error in logout listener:', error)
        }
    })
}, [])

    /**
     * Notify all login listeners
     */
    const notifyLoginListeners = useCallback((loggedInUser) => {
        loginListenersRef.current.forEach(callback => {
            try {
                callback(loggedInUser)
            } catch (error) {
                console.error('Error in login listener:', error)
            }
        })
    }, [])

    // ============================================
    // AUTHENTICATION METHODS
    // ============================================
    const login = async (email, password) => {
        const session = await authService.login(email, password)
        await checkUser()
        
        const loggedInUser = await authService.getCurrentUser()
        notifyLoginListeners(loggedInUser)
        
        // router.replace('/')  // <-- Add this line
        
        return session
    }

    const register = async (email, password, name) => {
        const response = await authService.register(email, password, name)
        await checkUser()
        
        // Get the updated user and notify listeners
        const loggedInUser = await authService.getCurrentUser()
        notifyLoginListeners(loggedInUser)
        
        return response
    }

    const logout = async () => {
        console.log('>>> AuthContext: logout called')
        
        // Clear user state FIRST
        setUser(null)
        
        try {
            await authService.logout()
            console.log('>>> AuthContext: appwrite logout successful')
        } catch (error) {
            console.error('Server logout error:', error)
        }
        
        // Verify user is actually logged out
        const checkResult = await authService.getCurrentUser()
        console.log('>>> AuthContext: after logout, getCurrentUser returns:', checkResult)
        
        notifyLogoutListeners()
        // router.replace('/')
    }

    // ============================================
    // UPDATE USER METHODS
    // ============================================
    const updateUserName = async(name) => {
        const updatedUser = await authService.updateName(name)
        setUser(updatedUser)
        return updatedUser
    }

    const updateUserEmail = async(email, password) => {
        const updatedUser = await authService.updateEmail(email, password)
        setUser(updatedUser)
        return updatedUser
    }

    const updateUserPassword = async(newPassword, oldPassword) => {
        const updatedUser = await authService.updatePassword(newPassword, oldPassword)
        setUser(updatedUser)
        return updatedUser
    }

    const updateUserPhone = async(phone, password) => {
        const updatedUser = await authService.updatePhone(phone, password)
        setUser(updatedUser)
        return updatedUser
    }

    const updateUserPreferences = async(prefs) => {
        const updatedUser = await authService.updatePreferences(prefs)
        setUser(updatedUser)
        return updatedUser
    }

    // ============================================
    // VERIFICATION METHODS
    // ============================================
    const sendEmailVerification = async (redirectUrl) => {
        await authService.sendEmailVerification(redirectUrl)
    }

    const confirmEmailVerification = async (userId, secret) => {
        const updatedUser = await authService.confirmEmailVerification(userId, secret)
        setUser(updatedUser)
        return updatedUser
    }

    const sendPhoneVerification = async () => {
        await authService.sendPhoneVerification()
    }

    const confirmPhoneVerification = async (userId, secret) => {
        const updatedUser = await authService.confirmPhoneVerification(userId, secret)
        setUser(updatedUser)
        return updatedUser
    }

    // ============================================
    // SESSION METHODS
    // ============================================
    const getSessions = async () => {
        return await authService.getSessions()
    }

    const deleteSession = async (sessionId) => {
        await authService.deleteSession(sessionId)
        await checkUser()
    }

    const deleteAllSessions = async () => {
        await authService.deleteAllSessions()
        setUser(null)
        notifyLogoutListeners()
    }

    // ============================================
    // ACCOUNT DELETION
    // ============================================
    const deleteAccount = async () => {
        await authService.deleteAccount()
        setUser(null)
        notifyLogoutListeners()
    }

    const value = {
        user,
        loading,
        // Auth
        login,
        register,
        logout,
        // Update Profile
        updateUserName,
        updateUserEmail,
        updateUserPassword,
        updateUserPhone,
        updateUserPreferences,
        // Verification
        sendEmailVerification,
        confirmEmailVerification,
        sendPhoneVerification,
        confirmPhoneVerification,
        // Sessions
        getSessions,
        deleteSession,
        deleteAllSessions,
        // Account
        deleteAccount,
        // Utility
        checkUser,
        authService,
        // Auth event listeners
        onLogout,
        onLogin
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext) 
    if(!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}