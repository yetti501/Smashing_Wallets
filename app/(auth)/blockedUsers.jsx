import { useState } from 'react'
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'

import ThemedSafeArea from '../../components/ThemedSafeArea'
import ThemedHeader from '../../components/ThemedHeader'
import ThemedModal from '../../components/ThemedModal'
import { useBlockedUsers } from '../../contexts/BlockedUsersContext'
import { COLORS, SPACING, RADIUS } from '../../constants/Colors'

export default function BlockedUsersScreen() {
    const { blockedUsers, unblockUser, loading } = useBlockedUsers()
    const [unblockingId, setUnblockingId] = useState(null)
    const [confirmModal, setConfirmModal] = useState({ visible: false, userId: null })

    const handleUnblock = (blockedUserId) => {
        setConfirmModal({ visible: true, userId: blockedUserId })
    }

    const confirmUnblock = async () => {
        const { userId } = confirmModal
        setConfirmModal({ visible: false, userId: null })
        setUnblockingId(userId)

        try {
            await unblockUser(userId)
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        } catch (error) {
            Alert.alert('Error', `Failed to unblock user: ${error?.message || 'Unknown error'}`)
        } finally {
            setUnblockingId(null)
        }
    }

    const renderBlockedUser = ({ item }) => (
        <View style={styles.userRow}>
            <View style={styles.userInfo}>
                <View style={styles.avatarCircle}>
                    <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />
                </View>
                <View style={styles.userDetails}>
                    <Text style={styles.userId} numberOfLines={1}>User ID: {item.blockedUserId}</Text>
                    <Text style={styles.blockedDate}>
                        Blocked on {new Date(item.$createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        })}
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.unblockButton}
                onPress={() => handleUnblock(item.blockedUserId)}
                disabled={unblockingId === item.blockedUserId}
            >
                {unblockingId === item.blockedUserId ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                    <Text style={styles.unblockButtonText}>Unblock</Text>
                )}
            </TouchableOpacity>
        </View>
    )

    return (
        <ThemedSafeArea scrollable={false}>
            <ThemedHeader
                title="Blocked Users"
                subtitle={`${blockedUsers.length} blocked user${blockedUsers.length !== 1 ? 's' : ''}`}
                showBack
                onBack={() => router.back()}
            />

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : blockedUsers.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons name="checkmark-circle-outline" size={60} color={COLORS.textTertiary} />
                    <Text style={styles.emptyTitle}>No Blocked Users</Text>
                    <Text style={styles.emptySubtitle}>
                        Users you block will appear here. You can unblock them at any time.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={blockedUsers}
                    keyExtractor={(item) => item.$id}
                    renderItem={renderBlockedUser}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <ThemedModal
                visible={confirmModal.visible}
                onClose={() => setConfirmModal({ visible: false, userId: null })}
                icon="person-add-outline"
                iconColor={COLORS.primary}
                title="Unblock User"
                message="Are you sure you want to unblock this user? Their listings will appear on the map and in your feed again."
                buttons={[
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => setConfirmModal({ visible: false, userId: null }),
                    },
                    {
                        text: 'Unblock',
                        style: 'primary',
                        onPress: confirmUnblock,
                    },
                ]}
            />
        </ThemedSafeArea>
    )
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: SPACING.lg,
        marginBottom: SPACING.sm,
    },
    emptySubtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    listContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xl,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface || '#FFFFFF',
        padding: SPACING.lg,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: SPACING.md,
    },
    avatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surfaceSecondary || '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    userDetails: {
        flex: 1,
    },
    userId: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
    },
    blockedDate: {
        fontSize: 12,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
    unblockButton: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.primary,
        minWidth: 80,
        alignItems: 'center',
    },
    unblockButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
})
