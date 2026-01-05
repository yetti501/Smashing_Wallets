import { useState } from 'react'
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Image, 
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { COLORS, SPACING, RADIUS } from '../constants/Colors'
import { imageService } from '../lib/imageService'

/**
 * Image gallery picker for selecting and uploading multiple images
 * 
 * @param {string[]} images - Array of image URLs (already uploaded)
 * @param {function} onImagesChange - Callback when images change
 * @param {number} maxImages - Maximum number of images allowed (default: 5)
 * @param {boolean} disabled - Disable all interactions
 */
const ImageGalleryPicker = ({ 
    images = [], 
    onImagesChange, 
    maxImages = 5,
    disabled = false 
}) => {
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })

    const requestPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
            Alert.alert(
                'Permission Required',
                'Please allow access to your photos to upload images.',
                [{ text: 'OK' }]
            )
            return false
        }
        return true
    }

    const pickImages = async () => {
        if (disabled || uploading) return
        
        const hasPermission = await requestPermission()
        if (!hasPermission) return

        const remainingSlots = maxImages - images.length
        if (remainingSlots <= 0) {
            Alert.alert('Maximum Images', `You can only upload up to ${maxImages} images.`)
            return
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.8,
                selectionLimit: remainingSlots,
            })

            if (!result.canceled && result.assets.length > 0) {
                await uploadImages(result.assets.map(asset => asset.uri))
            }
        } catch (error) {
            console.error('Error picking images:', error)
            Alert.alert('Error', 'Failed to pick images')
        }
    }

    const takePhoto = async () => {
        if (disabled || uploading) return
        if (images.length >= maxImages) {
            Alert.alert('Maximum Images', `You can only upload up to ${maxImages} images.`)
            return
        }

        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow camera access to take photos.')
            return
        }

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
            })

            if (!result.canceled && result.assets.length > 0) {
                await uploadImages([result.assets[0].uri])
            }
        } catch (error) {
            console.error('Error taking photo:', error)
            Alert.alert('Error', 'Failed to take photo')
        }
    }

    const uploadImages = async (imageUris) => {
        setUploading(true)
        setUploadProgress({ current: 0, total: imageUris.length })

        try {
            const result = await imageService.uploadMultipleImages(
                imageUris,
                (current, total) => setUploadProgress({ current, total })
            )

            if (result.urls.length > 0) {
                const newImages = [...images, ...result.urls]
                onImagesChange(newImages)
            }

            if (result.urls.length < imageUris.length) {
                Alert.alert(
                    'Partial Upload',
                    `${result.urls.length} of ${imageUris.length} images uploaded successfully.`
                )
            }
        } catch (error) {
            console.error('Error uploading images:', error)
            Alert.alert('Upload Failed', 'Failed to upload images. Please try again.')
        } finally {
            setUploading(false)
            setUploadProgress({ current: 0, total: 0 })
        }
    }

    const removeImage = (index) => {
        if (disabled || uploading) return
        
        Alert.alert(
            'Remove Image',
            'Are you sure you want to remove this image?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Remove', 
                    style: 'destructive',
                    onPress: () => {
                        const newImages = images.filter((_, i) => i !== index)
                        onImagesChange(newImages)
                    }
                }
            ]
        )
    }

    const setAsPrimary = (index) => {
        if (index === 0 || disabled || uploading) return
        
        const newImages = [...images]
        const [removed] = newImages.splice(index, 1)
        newImages.unshift(removed)
        onImagesChange(newImages)
    }

    const showImageOptions = () => {
        Alert.alert(
            'Add Image',
            'Choose how to add an image',
            [
                { text: 'Take Photo', onPress: takePhoto },
                { text: 'Choose from Library', onPress: pickImages },
                { text: 'Cancel', style: 'cancel' }
            ]
        )
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.label}>Event Photos</Text>
                <Text style={styles.counter}>
                    {images.length}/{maxImages}
                </Text>
            </View>

            {uploading && (
                <View style={styles.uploadingBanner}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.uploadingText}>
                        Uploading {uploadProgress.current}/{uploadProgress.total}...
                    </Text>
                </View>
            )}

            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageList}
            >
                {/* Add Button */}
                {images.length < maxImages && (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={showImageOptions}
                        disabled={disabled || uploading}
                    >
                        <Ionicons 
                            name="camera-outline" 
                            size={32} 
                            color={COLORS.textTertiary} 
                        />
                        <Text style={styles.addButtonText}>Add Photo</Text>
                    </TouchableOpacity>
                )}

                {/* Image Thumbnails */}
                {images.map((imageUrl, index) => (
                    <View key={index} style={styles.imageWrapper}>
                        <Image 
                            source={{ uri: imageUrl }} 
                            style={styles.imageThumbnail}
                            resizeMode="cover"
                        />
                        
                        {/* Primary badge */}
                        {index === 0 && (
                            <View style={styles.primaryBadge}>
                                <Text style={styles.primaryBadgeText}>Cover</Text>
                            </View>
                        )}

                        {/* Action buttons */}
                        <View style={styles.imageActions}>
                            {index !== 0 && (
                                <TouchableOpacity
                                    style={styles.imageActionButton}
                                    onPress={() => setAsPrimary(index)}
                                    disabled={disabled || uploading}
                                >
                                    <Ionicons name="star-outline" size={16} color="#FFF" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.imageActionButton, styles.deleteButton]}
                                onPress={() => removeImage(index)}
                                disabled={disabled || uploading}
                            >
                                <Ionicons name="trash-outline" size={16} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <Text style={styles.helperText}>
                First image will be the cover photo. Tap the star to change.
            </Text>
        </View>
    )
}

export default ImageGalleryPicker

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    counter: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    uploadingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.surfaceSecondary,
        padding: SPACING.sm,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.sm,
    },
    uploadingText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    imageList: {
        paddingVertical: SPACING.sm,
        gap: SPACING.md,
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
        backgroundColor: COLORS.surfaceSecondary,
        marginRight: SPACING.md,
    },
    addButtonText: {
        fontSize: 12,
        color: COLORS.textTertiary,
        marginTop: SPACING.xs,
    },
    imageWrapper: {
        position: 'relative',
        marginRight: SPACING.md,
    },
    imageThumbnail: {
        width: 100,
        height: 100,
        borderRadius: RADIUS.md,
    },
    primaryBadge: {
        position: 'absolute',
        top: SPACING.xs,
        left: SPACING.xs,
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: RADIUS.sm,
    },
    primaryBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.buttonPrimaryText,
    },
    imageActions: {
        position: 'absolute',
        bottom: SPACING.xs,
        right: SPACING.xs,
        flexDirection: 'row',
        gap: 4,
    },
    imageActionButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
    },
    helperText: {
        fontSize: 12,
        color: COLORS.textTertiary,
        marginTop: SPACING.sm,
    },
})