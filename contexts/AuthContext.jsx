import { account } from '../lib/appwrite'
import { ID } from 'appwrite'
import React, { createContext, useContext, useState, useEffect } from 'react'

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
            // redirect URL example: 
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
            // WARNING: This permanently deletes the user account
            await account.delete()
        } catch (error) {
            throw error
        }
    }
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkUser()
    }, [])

    const checkUser = async () => {
        try {
            const currentUser = await authService.getCurrentUser()
            setUser(currentUser)
        } catch (error) {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    // ============================================
    // AUTHENTICATION METHODS
    // ============================================
    const login = async (email, password) => {
        const session = await authService.login(email, password)
        await checkUser()
        return session
    }

    const register = async (email, password, name) => {
        const response = await authService.register(email, password, name)
        await checkUser()
        return response
    }

    const logout = async () => {
        await authService.logout()
        setUser(null)
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
    }

    // ============================================
    // ACCOUNT DELETION
    // ============================================
    const deleteAccount = async () => {
        await authService.deleteAccount()
        setUser(null)
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
        authService
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