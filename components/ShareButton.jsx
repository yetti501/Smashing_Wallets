import { TouchableOpacity, Share, Alert, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { COLORS } from '../constants/Colors'
import { EVENT_TYPE_LABELS } from '../lib/appwrite'

/**
 * Share button component for sharing event details
 * 
 * @param {object} listing - The listing object to share
 * @param {string} size - 'small' | 'medium' | 'large'
 * @param {string} variant - 'icon' | 'outline' | 'filled'
 * @param {object} style - Additional styles
 */
const ShareButton = ({ 
    listing, 
    size = 'medium', 
    variant = 'icon',
    style = {}
}) => {
    // Size configurations
    const sizes = {
        small: { icon: 18, button: 32 },
        medium: { icon: 22, button: 40 },
        large: { icon: 26, button: 48 }
    }
    
    const currentSize = sizes[size] || sizes.medium

    const formatShareDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString + 'T00:00:00')
        return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
        })
    }

    const formatShareTime = (startTime, endTime) => {
        if (!startTime && !endTime) return ''
        if (startTime && endTime) return `${startTime} - ${endTime}`
        if (startTime) return `Starting at ${startTime}`
        return ''
    }

    const handleShare = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            
            const eventType = EVENT_TYPE_LABELS[listing.eventType] || 'Event'
            const date = formatShareDate(listing.date || listing.startDate)
            const time = formatShareTime(listing.startTime, listing.endTime)
            
            // Build the share message
            let message = `🏷️ ${listing.title}\n\n`
            message += `📍 ${eventType}\n`
            message += `📅 ${date}\n`
            if (time) message += `🕐 ${time}\n`
            message += `📍 ${listing.location}\n`
            
            if (listing.description) {
                const shortDesc = listing.description.length > 100 
                    ? listing.description.substring(0, 100) + '...'
                    : listing.description
                message += `\n${shortDesc}\n`
            }
            
            if (listing.price) {
                message += `\n💰 ${listing.price}\n`
            }
            
            // Add deep link placeholder (update when you have deep linking set up)
            // message += `\nView in Smashing Wallets: smashingwallets://event/${listing.$id}`
            message += `\n\nFound on Smashing Wallets 🛒`

            const result = await Share.share({
                message,
                title: listing.title,
            })

            if (result.action === Share.sharedAction) {
                // Shared successfully
                if (result.activityType) {
                    // iOS - shared with specific activity
                    console.log('Shared with:', result.activityType)
                }
            }
        } catch (error) {
            if (error.message !== 'User did not share') {
                Alert.alert('Error', 'Failed to share event')
            }
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
                    borderColor: COLORS.border,
                    backgroundColor: 'transparent',
                }
            case 'filled':
                return {
                    ...baseStyle,
                    backgroundColor: COLORS.surfaceSecondary,
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
        switch (variant) {
            case 'outline':
            case 'filled':
                return COLORS.text
            case 'icon':
            default:
                return '#FFFFFF'
        }
    }

    return (
        <TouchableOpacity
            style={[getButtonStyle(), style]}
            onPress={handleShare}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Ionicons
                name="share-outline"
                size={currentSize.icon}
                color={getIconColor()}
            />
        </TouchableOpacity>
    )
}

export default ShareButton

const styles = StyleSheet.create({})