import { useState } from 'react'
import { 
    View, 
    StyleSheet, 
    TouchableOpacity, 
    Image, 
    Text,
    Alert,
    ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { COLORS, SPACING, RADIUS } from '../constants/Colors'

const MAX_IMAGES = 5

/**
 * ImagePickerGrid - A reusable component for selecting and previewing multiple images
 * 
 * @param {Array} images - Array of image objects: { uri: string, isExisting?: boolean, fileId?: string }
 * @param {Function} onImagesChange - Callback when images array changes
 * @param {number} maxImages - Maximum number of images allowed (default: 5)
 * @param {boolean} disabled - Disable all interactions
 * @param {boolean} uploading - Show uploading state
 */
const ImagePickerGrid = ({ 
    images = [], 
    onImagesChange, 
    maxImages = MAX_IMAGES,
    disabled = false,
    uploading = false 
}) => {
    const [loadingIndex, setLoadingIndex] = useState(null)

    const requestPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
            Alert.alert(
                'Permission Required',
                'Please allow access to your photo library to add images.',
                [{ text: 'OK' }]
            )
            return false
        }
        return true
    }

    const pickImage = async () => {
        if (disabled || uploading) return
        if (images.length >= maxImages) {
            Alert.alert('Limit Reached', `You can only add up to ${maxImages} images.`)
            return
        }

        const hasPermission = await requestPermission()
        if (!hasPermission) return

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            })

            if (!result.canceled && result.assets[0]) {
                const newImage = {
                    uri: result.assets[0].uri,
                    isExisting: false, // New image, not yet uploaded
                }
                onImagesChange([...images, newImage])
            }
        } catch (error) {
            console.error('Error picking image:', error)
            Alert.alert('Error', 'Failed to select image. Please try again.')
        }
    }

    const removeImage = (indexToRemove) => {
        if (disabled || uploading) return

        const imageToRemove = images[indexToRemove]
        
        // If it's an existing image (already uploaded), confirm deletion
        if (imageToRemove.isExisting) {
            Alert.alert(
                'Remove Image',
                'This image will be removed when you save. Continue?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Remove', 
                        style: 'destructive',
                        onPress: () => {
                            const newImages = images.filter((_, index) => index !== indexToRemove)
                            onImagesChange(newImages)
                        }
                    }
                ]
            )
        } else {
            // New image, just remove from state
            const newImages = images.filter((_, index) => index !== indexToRemove)
            onImagesChange(newImages)
        }
    }

    const canAddMore = images.length < maxImages && !disabled && !uploading

    return (
        <View style={styles.container}>
            <View style={styles.grid}>
                {/* Existing images */}
                {images.map((image, index) => (
                    <View key={`image-${index}`} style={styles.imageWrapper}>
                        <Image 
                            source={{ uri: image.uri }} 
                            style={styles.image}
                            resizeMode="cover"
                        />
                        
                        {/* Remove button */}
                        {!disabled && !uploading && (
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => removeImage(index)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="close-circle" size={24} color={COLORS.error} />
                            </TouchableOpacity>
                        )}

                        {/* Existing badge */}
                        {image.isExisting && (
                            <View style={styles.existingBadge}>
                                <Ionicons name="cloud-done" size={12} color={COLORS.buttonPrimaryText} />
                            </View>
                        )}

                        {/* Loading overlay */}
                        {loadingIndex === index && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator color={COLORS.buttonPrimaryText} />
                            </View>
                        )}
                    </View>
                ))}

                {/* Add button */}
                {canAddMore && (
                    <TouchableOpacity 
                        style={styles.addButton}
                        onPress={pickImage}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
                        <Text style={styles.addButtonText}>Add Photo</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Image count */}
            <Text style={styles.countText}>
                {images.length} of {maxImages} photos
                {images.length === 0 && ' (optional)'}
            </Text>

            {/* Uploading indicator */}
            {uploading && (
                <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.uploadingText}>Uploading images...</Text>
                </View>
            )}
        </View>
    )
}

export default ImagePickerGrid

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    imageWrapper: {
        width: 100,
        height: 100,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        backgroundColor: COLORS.surfaceSecondary,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    removeButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
    },
    existingBadge: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        backgroundColor: COLORS.success,
        borderRadius: 10,
        padding: 2,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        width: 100,
        height: 100,
        borderRadius: RADIUS.md,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
    },
    addButtonText: {
        fontSize: 12,
        color: COLORS.primary,
        marginTop: 4,
        fontWeight: '500',
    },
    countText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: SPACING.sm,
    },
    uploadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginTop: SPACING.sm,
        padding: SPACING.sm,
        backgroundColor: COLORS.surfaceSecondary,
        borderRadius: RADIUS.sm,
    },
    uploadingText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
})