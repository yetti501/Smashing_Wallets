import { useState, useEffect } from 'react'
import { View, StyleSheet, Alert, TouchableOpacity, Modal, Text, } from 'react-native'
import { router } from 'expo-router'

import { COLORS } from '../../constants/Colors'
import { useAuth } from '../../contexts/AuthContext'
import ThemedHeader from '../../components/ThemedHeader'
import ThemedButton from '../../components/ThemedButton'
import ThemedInfoCard from '../../components/ThemedInfoCard'
import ThemedInfoContent from '../../components/ThemedInfoContent'
import ThemedTextInput from '../../components/ThemedTextInput'
import ThemedSafeArea from '../../components/ThemedSafeArea'

export default function ProfileScreen() {
    const { user, logout, updateUserName, loading: authLoading } = useAuth() // Get current user from context
    const [loading, setLoading] = useState(false)
    const [editModalVisible, setEditModalVisible] = useState(false)
    const [editField, setEditField] = useState('')
    const [editValue, setEditValue] = useState('')

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

    const handleLogout = () => {
        Alert.alert(
            'Confirm Logout', 
            'Are you sure you want to log out',
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
                            router.replace('/login')
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
        setEditValue(currentValue)
        setEditModalVisible(true)
    }

    const handleSaveEdit = async () => {
        if(!editValue.trim()) {
            Alert.alert('Error', 'Field cannot be empty')
            return
        }
        setLoading(true)
        try {
            if(editField === 'name') {
                await updateUserName(editValue)
                Alert.alert('Success', 'Name updated successfully!')
            }
            setEditModalVisible(false)
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to update')
        } finally {
            setLoading(false)
        }
    }

    const menuItems = [
        { title: 'Change Password', onPress: () => router.push('/forgot') },
        { title: 'Privacy Settings', onPress: () => Alert.alert('Privacy Settings', 'Coming soon!') }, 
        { title: 'Help & Support', onPress: () => Alert.alert('Help & Support', 'Coming soon!') }
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
                    onPress={() => handleEditfield('name',user.name)}
                />

                {/* Email Field (Read-only) */}
                <ThemedInfoContent
                    infoLabel="Email"
                    infoValue={user.email}
                    hasEdit={false}
                    onPress={() => handleEditfield('email', user.email)}
                />

                {/* Phone Number */}
                <ThemedInfoContent 
                    infoLabel="Phone"
                    infoValue={user.phone}
                    hasEdit={true}
                    onPress={() => handleEditfield('phone', user.phone)}
                />

                {/* Account Status */}
                <ThemedInfoContent
                    infoLabel="Account Status"
                    infoValue={user.status ? 'Active' : 'Inactive'}
                    hasEdit={false}
                    onPress={() => handleEditfield('status', user.status)}
                />

                {/* Account ID (Read-only) */}
                <ThemedInfoContent
                    infoLabel="Account ID"
                    infoValue={user.$id}
                    hasEdit={false}
                />
            </ThemedInfoCard>

            <ThemedInfoCard sectionTitle="Accout Timeline">
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
                        style={styles.menuItem}
                        onPress={item.onPress}
                    >
                        <Text style={styles.menuIcon}>{item.icon}</Text>
                        <Text style={styles.menuText}>{item.title}</Text>
                        <Text style={styles.menuArrow}>›</Text>
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
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            Edit {editField.charAt(0).toUpperCase() + editField.slice(1)}
                        </Text>

                        <ThemedTextInput
                            label=""
                            placeholder={`Enter new ${editField}`}
                            value={editValue}
                            onChangeText={setEditValue}
                            keyboardType='default'
                            autoCapitalize='none'
                            editable={!loading}
                            placeholderTextColor={COLORS.textSecondary}
                            isPassword={false}
                            autoFocus
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setEditModalVisible(false)}
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
        backgroundColor: '#007AFF'
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
})