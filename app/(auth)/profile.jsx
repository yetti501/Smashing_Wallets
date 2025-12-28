import { useState, useEffect } from 'react'
import { View, StyleSheet, Alert, TouchableOpacity, Modal, Text, } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { COLORS } from '../../constants/Colors'
import { useAuth } from '../../contexts/AuthContext'
import ThemedHeader from '../../components/ThemedHeader'
import ThemedButton from '../../components/ThemedButton'
import ThemedInfoCard from '../../components/ThemedInfoCard'
import ThemedInfoContent from '../../components/ThemedInfoContent'
import ThemedTextInput from '../../components/ThemedTextInput'
import ThemedSafeArea from '../../components/ThemedSafeArea'

export default function ProfileScreen() {
    const { user, logout, updateUserName, updateUserPhone, updateUserPreferences, deleteAccount, loading: authLoading } = useAuth()
    const [loading, setLoading] = useState(false)
    const [editModalVisible, setEditModalVisible] = useState(false)
    const [deleteModalVisible, setDeleteModalVisible] = useState(false)
    const [editField, setEditField] = useState('')
    const [editValue, setEditValue] = useState('')
    const [password, setPassword] = useState('')
    const [deleteConfirmText, setDeleteConfirmText] = useState('')
    
    // Get current distance unit from user prefs (default to miles)
    const distanceUnit = user?.prefs?.distanceUnit || 'miles'

    useEffect(() => {
        if(!authLoading && !user) {
            router.replace('/login')
        }
    }, [user, authLoading])

    const formatDate = (dateString) => {
        if(!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Format phone number for display
    const formatPhoneDisplay = (phone) => {
        if (!phone) return 'Not set'
        // If it's already formatted or has country code, return as-is
        if (phone.includes('(') || phone.startsWith('+')) return phone
        // Basic US formatting for 10 digits
        const cleaned = phone.replace(/\D/g, '')
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
        }
        return phone
    }

    // Format phone for Appwrite (needs +country code)
    const formatPhoneForAPI = (phone) => {
        const cleaned = phone.replace(/\D/g, '')
        // If it already has country code (11+ digits starting with 1 for US)
        if (cleaned.length === 11 && cleaned.startsWith('1')) {
            return `+${cleaned}`
        }
        // Assume US number if 10 digits
        if (cleaned.length === 10) {
            return `+1${cleaned}`
        }
        // If already has + sign, return as-is
        if (phone.startsWith('+')) {
            return phone
        }
        return `+${cleaned}`
    }

    // Toggle distance unit preference
    const handleToggleDistanceUnit = async () => {
        const newUnit = distanceUnit === 'miles' ? 'km' : 'miles'
        setLoading(true)
        try {
            await updateUserPreferences({ 
                ...user.prefs,
                distanceUnit: newUnit 
            })
        } catch (error) {
            Alert.alert('Error', 'Failed to update preference')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        Alert.alert(
            'Confirm Logout', 
            'Are you sure you want to log out?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Logout', 
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true)
                        try {
                            await logout()
                            // Navigate to map (public screen) after logout
                            router.replace('/(map)/map')
                        } catch (error) {
                            Alert.alert('Error', error.message || 'Failed to Logout')
                        } finally {
                            setLoading(false)
                        }
                    }
                }
            ]
        )
    }

    const handleEditfield = (field, currentValue) => {
        setEditField(field)
        setEditValue(currentValue || '')
        setPassword('') // Reset password field
        setEditModalVisible(true)
    }

    const handleSaveEdit = async () => {
        if(!editValue.trim()) {
            Alert.alert('Error', 'Field cannot be empty')
            return
        }

        // Phone requires password
        if (editField === 'phone' && !password.trim()) {
            Alert.alert('Error', 'Password is required to update phone number')
            return
        }

        setLoading(true)
        try {
            if(editField === 'name') {
                await updateUserName(editValue)
                Alert.alert('Success', 'Name updated successfully!')
            } else if (editField === 'phone') {
                const formattedPhone = formatPhoneForAPI(editValue)
                await updateUserPhone(formattedPhone, password)
                Alert.alert('Success', 'Phone number updated successfully!')
            }
            setEditModalVisible(false)
            setPassword('') // Clear password after save
        } catch (error) {
            // Handle specific Appwrite errors
            let errorMessage = error.message || 'Failed to update'
            if (error.code === 401 || error.message?.includes('Invalid credentials')) {
                errorMessage = 'Incorrect password. Please try again.'
            } else if (error.message?.includes('Invalid phone')) {
                errorMessage = 'Invalid phone number format. Please enter a valid phone number.'
            }
            Alert.alert('Error', errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleCloseModal = () => {
        setEditModalVisible(false)
        setPassword('')
        setEditValue('')
    }

    // Delete Account Handler
    const handleDeleteAccount = () => {
        // First confirmation
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Continue', 
                    style: 'destructive',
                    onPress: () => setDeleteModalVisible(true)
                }
            ]
        )
    }

    const confirmDeleteAccount = async () => {
        // Check if user typed DELETE correctly
        if (deleteConfirmText !== 'DELETE') {
            Alert.alert('Error', 'Please type DELETE to confirm')
            return
        }

        setLoading(true)
        try {
            // Delete the account
            await deleteAccount()
            
            // Close modal and navigate to login
            setDeleteModalVisible(false)
            setDeleteConfirmText('')
            
            Alert.alert(
                'Account Deleted',
                'Your account has been permanently deleted.',
                [{ text: 'OK', onPress: () => router.replace('/login') }]
            )
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to delete account. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleCloseDeleteModal = () => {
        setDeleteModalVisible(false)
        setDeleteConfirmText('')
    }

    // Check if current field requires password
    const requiresPassword = editField === 'phone' || editField === 'email'

    // Get keyboard type based on field
    const getKeyboardType = () => {
        switch (editField) {
            case 'phone':
                return 'phone-pad'
            case 'email':
                return 'email-address'
            default:
                return 'default'
        }
    }

    const menuItems = [
        { icon: 'key-outline', title: 'Change Password', onPress: () => router.push('/forgot') },
        { icon: 'help-circle-outline', title: 'Help & Support', onPress: () => Alert.alert('Help & Support', 'Coming soon!') },
        { icon: 'document-text-outline', title: 'Terms of Service', onPress: () => router.push('/termsOfService') },
        { icon: 'shield-checkmark-outline', title: 'Privacy Policy', onPress: () => router.push('/privacyPolicy') },
        { icon: 'trash-outline', title: 'Delete Account', onPress: handleDeleteAccount, destructive: true },
    ]

    if(authLoading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        )
    }

    if(!user) {
        return null
    }

    return (
        <ThemedSafeArea centered>
            <ThemedHeader
                title="Profile"
                subtitle="Manage your account"
            />

            {/* User Info Card */}
            <View style={styles.userCard}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{user.name?.charAt(0).toUpperCase() || 'U'}</Text>
                </View>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                {/* Email verification Badge */}
                <View style={[
                    styles.verificationBadge,
                    user.emailVerification ? styles.verifiedBadge : styles.unverifiedBadge
                ]}>
                    <Text style={styles.badgeText}>
                        {user.emailVerification ? '✓ Email Verified' : '⚠ Email Not Verified'}
                    </Text>
                </View>
            </View>

            {/* Account Information Section */}
            <ThemedInfoCard title="Account Information">
                {/* Name Field {Editable} */}
                <ThemedInfoContent
                    infoLabel='Name'
                    infoValue={user.name}
                    hasEdit={true}
                    onPress={() => handleEditfield('name', user.name)}
                />

                {/* Email Field (Read-only) */}
                <ThemedInfoContent
                    infoLabel="Email"
                    infoValue={user.email}
                    hasEdit={false}
                />

                {/* Phone Number */}
                <ThemedInfoContent 
                    infoLabel="Phone"
                    infoValue={formatPhoneDisplay(user.phone)}
                    hasEdit={true}
                    onPress={() => handleEditfield('phone', user.phone)}
                />

                {/* Distance Unit Preference */}
                <View style={styles.preferenceRow}>
                    <View style={styles.preferenceInfo}>
                        <Text style={styles.preferenceLabel}>Distance Unit</Text>
                        <Text style={styles.preferenceValue}>
                            {distanceUnit === 'miles' ? 'Miles' : 'Kilometers'}
                        </Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.unitToggle}
                        onPress={handleToggleDistanceUnit}
                        disabled={loading}
                    >
                        <View style={[
                            styles.unitOption,
                            distanceUnit === 'miles' && styles.unitOptionActive
                        ]}>
                            <Text style={[
                                styles.unitOptionText,
                                distanceUnit === 'miles' && styles.unitOptionTextActive
                            ]}>mi</Text>
                        </View>
                        <View style={[
                            styles.unitOption,
                            distanceUnit === 'km' && styles.unitOptionActive
                        ]}>
                            <Text style={[
                                styles.unitOptionText,
                                distanceUnit === 'km' && styles.unitOptionTextActive
                            ]}>km</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Account Status */}
                <ThemedInfoContent
                    infoLabel="Account Status"
                    infoValue={user.status ? 'Active' : 'Inactive'}
                    hasEdit={false}
                />

                {/* Account ID (Read-only) */}
                <ThemedInfoContent
                    infoLabel="Account ID"
                    infoValue={user.$id}
                    hasEdit={false}
                />
            </ThemedInfoCard>

            <ThemedInfoCard sectionTitle="Account Timeline">
                {/* Account Created */}
                <ThemedInfoContent
                    infoLabel="Account Created"
                    infoValue={formatDate(user.$createdAt)}
                    hasEdit={false}
                />
                {/* Account Last Updated */}
                <ThemedInfoContent
                    infoLabel="Last Updated"
                    infoValue={formatDate(user.$updatedAt)}
                    hasEdit={false}
                />
            </ThemedInfoCard>

            {/* Menu Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Settings</Text>
                {menuItems.map((item, index) => (
                    <TouchableOpacity 
                        key={index}
                        style={[
                            styles.menuItem,
                            index === menuItems.length - 1 && styles.menuItemLast
                        ]}
                        onPress={item.onPress}
                    >
                        <Ionicons 
                            name={item.icon} 
                            size={22} 
                            color={item.destructive ? COLORS.error : COLORS.text} 
                            style={styles.menuIcon}
                        />
                        <Text style={[
                            styles.menuText,
                            item.destructive && styles.menuTextDestructive
                        ]}>{item.title}</Text>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Logout Button */}
            <ThemedButton
                action={handleLogout}
                buttonText={loading ? 'Logging out...' : 'Logout'}
                loading={loading}
                disabled={loading}
            />

            {/* Edit Modal */}
            <Modal
                visible={editModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={handleCloseModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            Edit {editField.charAt(0).toUpperCase() + editField.slice(1)}
                        </Text>

                        {/* Main field input */}
                        <ThemedTextInput
                            label={editField === 'phone' ? 'Phone Number' : ''}
                            placeholder={editField === 'phone' ? '(555) 555-5555' : `Enter new ${editField}`}
                            value={editValue}
                            onChangeText={setEditValue}
                            keyboardType={getKeyboardType()}
                            autoCapitalize='none'
                            editable={!loading}
                            placeholderTextColor={COLORS.textSecondary}
                            isPassword={false}
                            autoFocus
                        />

                        {/* Password field for phone/email updates */}
                        {requiresPassword && (
                            <>
                                <Text style={styles.passwordNote}>
                                    For security, please enter your password to confirm this change.
                                </Text>
                                <ThemedTextInput
                                    label="Password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChangeText={setPassword}
                                    keyboardType='default'
                                    autoCapitalize='none'
                                    editable={!loading}
                                    placeholderTextColor={COLORS.textSecondary}
                                    isPassword={true}
                                />
                            </>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={handleCloseModal}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSaveEdit}
                                disabled={loading}
                            >
                                <Text style={styles.saveButtonText}>
                                    {loading ? 'Saving...' : 'Save'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Delete Account Confirmation Modal */}
            <Modal
                visible={deleteModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={handleCloseDeleteModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.deleteIconContainer}>
                            <Ionicons name="warning" size={48} color={COLORS.error} />
                        </View>
                        
                        <Text style={styles.deleteModalTitle}>Delete Account</Text>
                        
                        <Text style={styles.deleteModalText}>
                            This will permanently delete your account and all associated data including:
                        </Text>
                        
                        <View style={styles.deleteList}>
                            <Text style={styles.deleteListItem}>• Your profile information</Text>
                            <Text style={styles.deleteListItem}>• All your event listings</Text>
                            <Text style={styles.deleteListItem}>• Your saved preferences</Text>
                        </View>
                        
                        <Text style={styles.deleteModalWarning}>
                            This action cannot be undone.
                        </Text>
                        
                        <Text style={styles.deleteModalConfirmLabel}>
                            Type <Text style={styles.deleteKeyword}>DELETE</Text> to confirm:
                        </Text>
                        
                        <ThemedTextInput
                            label=""
                            placeholder="Type DELETE here"
                            value={deleteConfirmText}
                            onChangeText={setDeleteConfirmText}
                            autoCapitalize="characters"
                            editable={!loading}
                            placeholderTextColor={COLORS.textSecondary}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={handleCloseDeleteModal}
                                disabled={loading}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[
                                    styles.modalButton, 
                                    styles.deleteButton,
                                    deleteConfirmText !== 'DELETE' && styles.deleteButtonDisabled
                                ]}
                                onPress={confirmDeleteAccount}
                                disabled={loading || deleteConfirmText !== 'DELETE'}
                            >
                                <Text style={styles.deleteButtonText}>
                                    {loading ? 'Deleting...' : 'Delete Account'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ThemedSafeArea>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        backgroundColor: '#f8f9fa'
    },
    scrollContent: {
        flexGrow: 1, 
        justifyContent: 'center',
        padding: 20
    },
    keyboardView: {
        flex: 1
    },
    userCard: {
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.avatarBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.avatarText
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4
    },
    userEmail: {
        fontSize: 16,
        color: COLORS.textSecondary
    },
    section: {
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: COLORS.text
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    menuIcon: {
        fontSize: 20,
        marginRight: 12
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#333'
    },
    menuArrow: {
        fontSize: 24,
        color: '#ccc'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center'
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    cancelButton: {
        backgroundColor: '#f0f0f0'
    },
    saveButton: {
        backgroundColor: COLORS.primary
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600'
    },
    saveButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600'
    },
    verificationBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 8
    },
    verifiedBadge: {
        backgroundColor: '#4CAF50'
    },
    unverifiedBadge: {
        backgroundColor: '#FF9800'
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600'
    },
    verifiedIcon: {
        fontSize: 18,
        color: '#4CAF50',
        marginLeft: 12
    },
    debugText: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#666',
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 8
    },
    passwordNote: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 12,
        textAlign: 'center',
        fontStyle: 'italic'
    },
    // Distance unit preference styles
    preferenceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    preferenceInfo: {
        flex: 1,
    },
    preferenceLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    preferenceValue: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    unitToggle: {
        flexDirection: 'row',
        backgroundColor: COLORS.surfaceSecondary || '#f0f0f0',
        borderRadius: 8,
        padding: 2,
    },
    unitOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    unitOptionActive: {
        backgroundColor: COLORS.primary,
    },
    unitOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    unitOptionTextActive: {
        color: '#FFFFFF',
    },
    menuIcon: {
        marginRight: 12,
    },
    menuTextDestructive: {
        color: COLORS.error,
    },
    menuItemLast: {
        borderBottomWidth: 0,
    },
    // Delete Modal Styles
    deleteIconContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    deleteModalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.error,
        textAlign: 'center',
        marginBottom: 12,
    },
    deleteModalText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 12,
    },
    deleteList: {
        alignSelf: 'flex-start',
        marginBottom: 16,
        paddingLeft: 8,
    },
    deleteListItem: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 4,
    },
    deleteModalWarning: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.error,
        textAlign: 'center',
        marginBottom: 16,
    },
    deleteModalConfirmLabel: {
        fontSize: 14,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    deleteKeyword: {
        fontWeight: 'bold',
        color: COLORS.error,
    },
    deleteButton: {
        backgroundColor: COLORS.error,
    },
    deleteButtonDisabled: {
        backgroundColor: COLORS.disabled,
    },
    deleteButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
})