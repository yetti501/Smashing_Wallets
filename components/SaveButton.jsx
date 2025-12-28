import { useState } from 'react'
import { TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useSavedEvents } from '../contexts/SavedEventsContext'
import { useAuth } from '../contexts/AuthContext'
import { COLORS } from '../constants/Colors'

/**
 * Save/Favorite button component
 * 
 * @param {string} listingId - The listing ID to save/unsave
 * @param {string} size - 'small' | 'medium' | 'large'
 * @param {string} variant - 'icon' | 'outline' | 'filled'
 * @param {object} style - Additional styles
 * @param {function} onToggle - Callback after toggle (receives { saved: boolean })
 */
const SaveButton = ({ 
    listingId, 
    size = 'medium', 
    variant = 'icon',
    style = {},
    onToggle = null
}) => {
    const { user } = useAuth()
    const { isEventSaved, toggleSaveEvent } = useSavedEvents()
    const [isLoading, setIsLoading] = useState(false)
    
    const isSaved = isEventSaved(listingId)
    
    // Size configurations
    const sizes = {
        small: { icon: 20, button: 32 },
        medium: { icon: 24, button: 40 },
        large: { icon: 28, button: 48 }
    }
    
    const currentSize = sizes[size] || sizes.medium

    const handlePress = async () => {
        if (!user) {
            Alert.alert(
                'Login Required',
                'Create an account or log in to save events and access them anytime.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Log In', 
                        onPress: () => router.push('/login')
                    }
                ]
            )
            return
        }

        setIsLoading(true)
        try {
            // Haptic feedback
            await Haptics.impactAsync(
                isSaved ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
            )
            
            const result = await toggleSaveEvent(listingId)
            
            if (onToggle) {
                onToggle(result)
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to save event')
        } finally {
            setIsLoading(false)
        }
    }

    const getButtonStyle = () => {
        const baseStyle = {
            width: currentSize.button,
            height: currentSize.button,
            borderRadius: currentSize.button / 2,
            justifyContent: 'center',
            alignItems: 'center',
        }

        switch (variant) {
            case 'outline':
                return {
                    ...baseStyle,
                    borderWidth: 2,
                    borderColor: isSaved ? COLORS.primary : COLORS.border,
                    backgroundColor: isSaved ? COLORS.primaryLight : 'transparent',
                }
            case 'filled':
                return {
                    ...baseStyle,
                    backgroundColor: isSaved ? COLORS.primary : COLORS.surfaceSecondary,
                }
            case 'icon':
            default:
                return {
                    ...baseStyle,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                }
        }
    }

    const getIconColor = () => {
        if (variant === 'filled' && isSaved) {
            return COLORS.buttonPrimaryText
        }
        return isSaved ? COLORS.primary : COLORS.textTertiary
    }

    if (isLoading) {
        return (
            <TouchableOpacity 
                style={[getButtonStyle(), style]}
                disabled
            >
                <ActivityIndicator size="small" color={getIconColor()} />
            </TouchableOpacity>
        )
    }

    return (
        <TouchableOpacity
            style={[getButtonStyle(), style]}
            onPress={handlePress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Ionicons
                name={isSaved ? 'heart' : 'heart-outline'}
                size={currentSize.icon}
                color={isSaved ? COLORS.primary : '#FFFFFF'}
            />
        </TouchableOpacity>
    )
}

export default SaveButton

const styles = StyleSheet.create({})