import { useState, useEffect } from 'react'
import { 
    View, 
    StyleSheet, 
    ScrollView, 
    TextInput, 
    TouchableOpacity, 
    Alert,
    Text,
    Switch,
    ActivityIndicator,
    Platform
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'

import ThemedSafeArea from '../../components/ThemedSafeArea'
import ImagePickerGrid from '../../components/ImagePickerGrid'
import { useListings } from '../../contexts/ListingsContext'
import { useAuth } from '../../contexts/AuthContext'
import { COLORS, SPACING, RADIUS } from '../../constants/Colors'
import { EVENT_TYPES, EVENT_TYPE_LABELS } from '../../lib/appwrite'
import { imageService } from '../../lib/imageService'

export default function EditListingScreen() {
    const { listingId } = useLocalSearchParams()
    const { user } = useAuth()
    const { getListing, updateListing } = useListings()

    const [showDatePicker, setShowDatePicker] = useState(false)
    const [showStartDatePicker, setShowStartDatePicker] = useState(false)
    const [showEndDatePicker, setShowEndDatePicker] = useState(false)
    const [datePickerValue, setDatePickerValue] = useState(new Date())
    const [showStartTimePicker, setShowStartTimePicker] = useState(false)
    const [showEndTimePicker, setShowEndTimePicker] = useState(false)
    const [timePickerValue, setTimePickerValue] = useState(new Date())

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [uploadingImages, setUploadingImages] = useState(false)
    const [originalListing, setOriginalListing] = useState(null)

    // Image state
    // Each image: { uri: string, isExisting: boolean, fileId?: string }
    const [selectedImages, setSelectedImages] = useState([])
    // Track images to delete (existing images that were removed)
    const [imagesToDelete, setImagesToDelete] = useState([])

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        eventType: EVENT_TYPES.YARD_SALE,
        location: '',
        area: '',
        date: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        price: '',
        contactPhone: '',
        contactEmail: '',
        showPhone: true,
        showEmail: true,
        tags: [],
        featured: false,
        multiday: false,
        isRecurring: false,
        status: 'active',
    })

    const [tagInput, setTagInput] = useState('')

    useEffect(() => {
        loadListing()
    }, [listingId])

    const loadListing = async () => {
        try {
            setLoading(true)
            const data = await getListing(listingId)
            
            // Check if user is the owner
            if (user.$id !== data.userId) {
                Alert.alert('Error', 'You do not have permission to edit this event')
                router.back()
                return
            }

            setOriginalListing(data)
            
            // Populate form with existing data
            setFormData({
                title: data.title || '',
                description: data.description || '',
                eventType: data.eventType || EVENT_TYPES.YARD_SALE,
                location: data.location || '',
                area: data.area || '',
                date: data.date || '',
                startDate: data.startDate || '',
                endDate: data.endDate || '',
                startTime: data.startTime || '',
                endTime: data.endTime || '',
                price: data.price || '',
                contactPhone: data.contactPhone || '',
                contactEmail: data.contactEmail || '',
                showPhone: data.showPhone !== undefined ? data.showPhone : true,
                showEmail: data.showEmail !== undefined ? data.showEmail : true,
                tags: data.tags || [],
                featured: data.featured || false,
                multiday: data.multiday || false,
                isRecurring: data.isRecurring || false,
                status: data.status || 'active',
            })

            // Load existing images
            const existingImages = []
            if (data.images && data.images.length > 0) {
                data.images.forEach(url => {
                    const fileId = imageService.extractFileIdFromUrl(url)
                    existingImages.push({
                        uri: url,
                        isExisting: true,
                        fileId: fileId,
                    })
                })
            } else if (data.image) {
                // Handle old single image field
                const fileId = imageService.extractFileIdFromUrl(data.image)
                existingImages.push({
                    uri: data.image,
                    isExisting: true,
                    fileId: fileId,
                })
            }
            setSelectedImages(existingImages)

        } catch (error) {
            Alert.alert('Error', 'Failed to load event details')
            console.error('Error loading listing:', error)
            router.back()
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Handle image changes from ImagePickerGrid
    const handleImagesChange = (newImages) => {
        // Check if any existing images were removed
        const removedImages = selectedImages.filter(
            oldImg => oldImg.isExisting && !newImages.find(newImg => newImg.uri === oldImg.uri)
        )
        
        // Add removed images to delete list
        if (removedImages.length > 0) {
            setImagesToDelete(prev => [
                ...prev,
                ...removedImages.filter(img => img.fileId)
            ])
        }
        
        setSelectedImages(newImages)
    }

    const handleAddTag = () => {
        const tag = tagInput.trim().toLowerCase()
        if (tag && !formData.tags.includes(tag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tag]
            }))
            setTagInput('')
        }
    }

    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }))
    }

    const formatDate = (date) => {
        const d = new Date(date)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const formatDateDisplay = (dateString) => {
        if(!dateString) return ''
        
        let date
        if (dateString.includes('T')) {
            date = new Date(dateString)
        } else {
            date = new Date(dateString + 'T00:00:00')
        }
        
        if (isNaN(date.getTime())) {
            console.error('Invalid date:', dateString)
            return 'Invalid Date'
        }
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatPhoneNumber = (text) => {
        const cleaned = text.replace(/\D/g, '')
        const limited = cleaned.substring(0, 10)

        if(limited.length === 0) {
            return ''
        } else if(limited.length <= 3) {
            return `(${limited})`
        } else if(limited.length <= 6) {
            return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
        } else {
            return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
        }
    }

    const handleDateChange = (event, selectedDate) => {
        if(Platform.OS === 'android') {
            setShowDatePicker(false)
        }
        if(selectedDate) {
            const formattedDate = formatDate(selectedDate)
            handleInputChange('date', formattedDate)
            handleInputChange('startDate', formattedDate)

            if(Platform.OS === 'ios'){
                setShowDatePicker(false)
            }
        }
    }

    const handleStartDateChange = (event, selectedDate) => {
        if(Platform.OS === 'android') {
            setShowStartDatePicker(false)
        }
        if(selectedDate) {
            const formattedDate = formatDate(selectedDate)
            handleInputChange('startDate', formattedDate)

            if(Platform.OS === 'ios') {
                setShowStartDatePicker(false)
            }
        }
    }

    const handleEndDateChange = (event, selectedDate) => {
        if(Platform.OS === 'android') {
            setShowEndDatePicker(false)
        }

        if(selectedDate) {
            const formattedDate = formatDate(selectedDate)
            handleInputChange('endDate', formattedDate)

            if(Platform.OS === 'ios'){
                setShowEndDatePicker(false)
            }
        }
    }

    const openDatePicker = (pickerType) => {
        let initialDate = new Date()

        if(pickerType === 'date' && formData.date) {
            initialDate = new Date(formData.date + 'T00:00:00')
        } else if (pickerType === 'startDate' && formData.startDate) {
            initialDate = new Date(formData.startDate + 'T00:00:00')
        } else if (pickerType === 'endDate' && formData.endDate) {
            initialDate = new Date(formData.endDate + 'T00:00:00')
        }

        setDatePickerValue(initialDate)

        if(pickerType === 'date') {
            setShowDatePicker(true)
        } else if (pickerType === 'startDate') {
            setShowStartDatePicker(true)
        } else if (pickerType === 'endDate') {
            setShowEndDatePicker(true)
        }
    }

    const formatTime = (date) => {
        let hours = date.getHours()
        const minutes = date.getMinutes()
        const ampm = hours >= 12 ? 'PM' : 'AM'

        hours = hours % 12
        hours = hours ? hours : 12

        const minutesStr = minutes < 10 ? '0' + minutes : minutes

        return `${hours}:${minutesStr} ${ampm}`
    }

    const parseTimeToDate = (timeString) => {
        if(!timeString) return new Date()

        const date = new Date()
        const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i
        const match = timeString.match(timeRegex)

        if(match) {
            let hours = parseInt(match[1])
            const minutes = parseInt(match[2])
            const ampm = match[3]

            if(ampm) {
                if(ampm.toUpperCase() === 'PM' && hours !== 12){
                    hours += 12
                } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
                    hours = 0
                }
            }

            date.setHours(hours)
            date.setMinutes(minutes)
        }

        return date
    }

    const handleStartTimeChange = (event, selectedTime) => {
        if (Platform.OS === 'android') {
            setShowStartTimePicker(false)
        }

        if(selectedTime) {
            const formattedTime = formatTime(selectedTime)
            handleInputChange('startTime', formattedTime)

            if(Platform.OS === 'ios') {
                setShowStartTimePicker(false)
            }
        }
    }

    const handleEndTimeChange = (event, selectedTime) => {
        if(Platform.OS === 'android'){
            setShowEndTimePicker(false)
        }

        if(selectedTime) {
            const formattedTime = formatTime(selectedTime)
            handleInputChange('endTime', formattedTime)

            if(Platform.OS === 'ios') {
                setShowEndTimePicker(false)
            }
        }
    }

    const openTimePicker = (pickerType) => {
        let initialTime = new Date()
    
        if (pickerType === 'startTime' && formData.startTime) {
            initialTime = parseTimeToDate(formData.startTime)
        } else if (pickerType === 'endTime' && formData.endTime) {
            initialTime = parseTimeToDate(formData.endTime)
        } else {
            if (pickerType === 'startTime') {
                initialTime.setHours(9, 0, 0, 0)
            } else {
                initialTime.setHours(16, 0, 0, 0)
            }
        }
        
        setTimePickerValue(initialTime)
        
        if (pickerType === 'startTime') {
            setShowStartTimePicker(true)
        } else if (pickerType === 'endTime') {
            setShowEndTimePicker(true)
        }
    }

    const validateForm = () => {
        if (!formData.title.trim()) {
            Alert.alert('Validation Error', 'Please enter an event title')
            return false
        }
        if (!formData.location.trim()) {
            Alert.alert('Validation Error', 'Please enter a location')
            return false
        }
        if (!formData.eventType) {
            Alert.alert('Validation Error', 'Please select an event type')
            return false
        }

        if (formData.multiday) {
            if (!formData.startDate || !formData.endDate) {
                Alert.alert('Validation Error', 'Please enter both start and end dates for multi-day events')
                return false
            }
            if (new Date(formData.startDate) > new Date(formData.endDate)) {
                Alert.alert('Validation Error', 'End date must be after start date')
                return false
            }
        } else {
            if (!formData.date && !formData.startDate) {
                Alert.alert('Validation Error', 'Please enter an event date')
                return false
            }
        }

        return true
    }

    const handleSubmit = async () => {
        if (!validateForm()) return

        setSubmitting(true)
        
        try {
            let finalImageUrls = []
            
            // Separate existing and new images
            const existingImages = selectedImages.filter(img => img.isExisting)
            const newImages = selectedImages.filter(img => !img.isExisting)
            
            // Keep existing image URLs
            finalImageUrls = existingImages.map(img => img.uri)
            
            // Upload new images if any
            if (newImages.length > 0) {
                setUploadingImages(true)
                
                try {
                    const imageUris = newImages.map(img => img.uri)
                    const uploadResult = await imageService.uploadMultipleImages(
                        imageUris,
                        (current, total) => {
                            console.log(`Uploading image ${current} of ${total}`)
                        }
                    )
                    finalImageUrls = [...finalImageUrls, ...uploadResult.urls]
                } catch (uploadError) {
                    console.error('Error uploading images:', uploadError)
                    Alert.alert(
                        'Image Upload Failed',
                        'Failed to upload new images. Would you like to continue without the new images?',
                        [
                            { 
                                text: 'Cancel', 
                                style: 'cancel',
                                onPress: () => {
                                    setSubmitting(false)
                                    setUploadingImages(false)
                                }
                            },
                            { 
                                text: 'Continue', 
                                onPress: () => finishUpdate(existingImages.map(img => img.uri))
                            }
                        ]
                    )
                    return
                } finally {
                    setUploadingImages(false)
                }
            }
            
            // Delete removed images from storage
            if (imagesToDelete.length > 0) {
                try {
                    const fileIds = imagesToDelete.map(img => img.fileId).filter(Boolean)
                    if (fileIds.length > 0) {
                        await imageService.deleteMultipleImages(fileIds)
                        console.log('Deleted old images:', fileIds)
                    }
                } catch (deleteError) {
                    // Log but don't fail the update
                    console.error('Error deleting old images:', deleteError)
                }
            }
            
            await finishUpdate(finalImageUrls)
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to update event')
            console.error('Error updating listing:', error)
            setSubmitting(false)
        }
    }

    const finishUpdate = async (imageUrls) => {
        try {
            // Prepare update data
            const updates = {}
            
            Object.keys(formData).forEach(key => {
                if (formData[key] !== originalListing[key]) {
                    updates[key] = formData[key]
                }
            })

            // Always update images if they've changed
            const originalImages = originalListing.images || (originalListing.image ? [originalListing.image] : [])
            const imagesChanged = JSON.stringify(imageUrls.sort()) !== JSON.stringify(originalImages.sort())
            
            if (imagesChanged) {
                updates.images = imageUrls
            }

            // If no changes, just go back
            if (Object.keys(updates).length === 0) {
                Alert.alert('No Changes', 'No changes were made to the event')
                router.back()
                return
            }

            await updateListing(listingId, updates)
            
            Alert.alert('Success', 'Event updated successfully', [
                {
                    text: 'OK',
                    onPress: () => router.back()
                }
            ])
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to update event')
            console.error('Error updating listing:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleCancel = () => {
        Alert.alert(
            'Discard Changes',
            'Are you sure you want to discard your changes?',
            [
                { text: 'Continue Editing', style: 'cancel' },
                { 
                    text: 'Discard', 
                    style: 'destructive',
                    onPress: () => router.back()
                }
            ]
        )
    }

    if (loading) {
        return (
            <ThemedSafeArea centered>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading event...</Text>
            </ThemedSafeArea>
        )
    }

    return (
        <ThemedSafeArea scrollable={false} extraBottomPadding={0} edges={['top']}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleCancel}>
                        <Ionicons name="close" size={28} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Event</Text>
                    <TouchableOpacity 
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                            <Text style={styles.saveButton}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    style={styles.form}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Event Type */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Event Type *</Text>
                        <View style={styles.eventTypeGrid}>
                            {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                                <TouchableOpacity
                                    key={key}
                                    style={[
                                        styles.eventTypeButton,
                                        formData.eventType === key && styles.eventTypeButtonActive
                                    ]}
                                    onPress={() => handleInputChange('eventType', key)}
                                >
                                    <Text style={[
                                        styles.eventTypeButtonText,
                                        formData.eventType === key && styles.eventTypeButtonTextActive
                                    ]}>
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Title */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Event Title *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Big Yard Sale - Furniture & More!"
                            placeholderTextColor={COLORS.textTertiary}
                            value={formData.title}
                            onChangeText={(text) => handleInputChange('title', text)}
                            maxLength={255}
                        />
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Describe what you're selling, special items, etc."
                            placeholderTextColor={COLORS.textTertiary}
                            value={formData.description}
                            onChangeText={(text) => handleInputChange('description', text)}
                            multiline
                            numberOfLines={4}
                            maxLength={5000}
                        />
                    </View>

                    {/* Images Section */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Photos</Text>
                        <Text style={styles.helperText}>
                            Add up to 5 photos to showcase your event
                        </Text>
                        <View style={{ marginTop: SPACING.sm }}>
                            <ImagePickerGrid
                                images={selectedImages}
                                onImagesChange={handleImagesChange}
                                maxImages={5}
                                disabled={submitting}
                                uploading={uploadingImages}
                            />
                        </View>
                    </View>

                    {/* Multi-day Toggle */}
                    <View style={styles.section}>
                        <View style={styles.toggleRow}>
                            <View>
                                <Text style={styles.label}>Multi-Day Event</Text>
                                <Text style={styles.helperText}>
                                    Event spans multiple days
                                </Text>
                            </View>
                            <Switch
                                value={formData.multiday}
                                onValueChange={(value) => handleInputChange('multiday', value)}
                                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                thumbColor={COLORS.buttonPrimaryText}
                            />
                        </View>
                    </View>

                    {/* Date Fields with Native Picker */}
                    {formData.multiday ? (
                        <>
                            {/* Start Date */}
                            <View style={styles.section}>
                                <Text style={styles.label}>Start Date *</Text>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => openDatePicker('startDate')}
                                >
                                    <Ionicons name="calendar" size={20} color={COLORS.primary} />
                                    <Text style={[
                                        styles.dateButtonText,
                                        formData.startDate && styles.dateButtonTextSelected
                                    ]}>
                                        {formData.startDate 
                                            ? formatDateDisplay(formData.startDate)
                                            : 'Select start date'
                                        }
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* End Date */}
                            <View style={styles.section}>
                                <Text style={styles.label}>End Date *</Text>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => openDatePicker('endDate')}
                                >
                                    <Ionicons name="calendar" size={20} color={COLORS.primary} />
                                    <Text style={[
                                        styles.dateButtonText,
                                        formData.endDate && styles.dateButtonTextSelected
                                    ]}>
                                        {formData.endDate 
                                            ? formatDateDisplay(formData.endDate)
                                            : 'Select end date'
                                        }
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <View style={styles.section}>
                            <Text style={styles.label}>Event Date *</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => openDatePicker('date')}
                            >
                                <Ionicons name="calendar" size={20} color={COLORS.primary} />
                                <Text style={[
                                    styles.dateButtonText,
                                    (formData.date || formData.startDate) && styles.dateButtonTextSelected
                                ]}>
                                    {(formData.date || formData.startDate)
                                        ? formatDateDisplay(formData.date || formData.startDate)
                                        : 'Select date'
                                    }
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Date Pickers */}
                    {showDatePicker && (
                        <DateTimePicker
                            value={datePickerValue}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleDateChange}
                            minimumDate={new Date()}
                        />
                    )}

                    {showStartDatePicker && (
                        <DateTimePicker
                            value={datePickerValue}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleStartDateChange}
                            minimumDate={new Date()}
                        />
                    )}

                    {showEndDatePicker && (
                        <DateTimePicker
                            value={datePickerValue}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleEndDateChange}
                            minimumDate={formData.startDate ? new Date(formData.startDate + 'T00:00:00') : new Date()}
                        />
                    )}

                    {/* Time Pickers */}
                    {showStartTimePicker && (
                        <DateTimePicker
                            value={timePickerValue}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleStartTimeChange}
                        />
                    )}

                    {showEndTimePicker && (
                        <DateTimePicker
                            value={timePickerValue}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleEndTimeChange}
                        />
                    )}

                    {/* Time Fields */}
                    <View style={styles.row}>
                        <View style={[styles.section, styles.halfWidth]}>
                            <Text style={styles.label}>Start Time</Text>
                            <TouchableOpacity
                                style={styles.timeButton}
                                onPress={() => openTimePicker('startTime')}
                            >
                                <Ionicons name="time" size={20} color={COLORS.primary} />
                                <Text style={[
                                    styles.timeButtonText,
                                    formData.startTime && styles.timeButtonTextSelected
                                ]}>
                                    {formData.startTime || 'Select time'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.section, styles.halfWidth]}>
                            <Text style={styles.label}>End Time</Text>
                            <TouchableOpacity
                                style={styles.timeButton}
                                onPress={() => openTimePicker('endTime')}
                            >
                                <Ionicons name="time" size={20} color={COLORS.primary} />
                                <Text style={[
                                    styles.timeButtonText,
                                    formData.endTime && styles.timeButtonTextSelected
                                ]}>
                                    {formData.endTime || 'Select time'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Location */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Location *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="123 Main St, Phoenix, AZ 85001"
                            placeholderTextColor={COLORS.textTertiary}
                            value={formData.location}
                            onChangeText={(text) => handleInputChange('location', text)}
                            maxLength={255}
                        />
                    </View>

                    {/* Area/Neighborhood */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Area/Neighborhood</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Downtown, Scottsdale"
                            placeholderTextColor={COLORS.textTertiary}
                            value={formData.area}
                            onChangeText={(text) => handleInputChange('area', text)}
                            maxLength={50}
                        />
                    </View>

                    {/* Price */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Price/Entry Fee</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Free, $5 entry, Items $1-$50"
                            placeholderTextColor={COLORS.textTertiary}
                            value={formData.price}
                            onChangeText={(text) => handleInputChange('price', text)}
                            maxLength={50}
                        />
                    </View>

                    {/* Contact Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Contact Information</Text>
                        <Text style={styles.contactHelperText}>
                            Add contact details for interested buyers. Toggle visibility for each.
                        </Text>

                        <View style={styles.contactField}>
                            <View style={styles.contactInputRow}>
                                <View style={styles.contactInputWrapper}>
                                    <Text style={styles.label}>Phone Number</Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            !formData.showPhone && styles.inputDisabled
                                        ]}
                                        placeholder="(555) 123-4567"
                                        placeholderTextColor={COLORS.textTertiary}
                                        value={formData.contactPhone}
                                        onChangeText={(text) => {
                                            const formatted = formatPhoneNumber(text)
                                            handleInputChange('contactPhone', formatted)}
                                        }
                                        keyboardType="phone-pad"
                                        maxLength={20}
                                    />
                                </View>
                            </View>
                            <View style={styles.visibilityToggle}>
                                <Ionicons 
                                    name={formData.showPhone ? "eye" : "eye-off"} 
                                    size={18} 
                                    color={formData.showPhone ? COLORS.primary : COLORS.textTertiary} 
                                />
                                <Text style={[
                                    styles.visibilityText,
                                    formData.showPhone && styles.visibilityTextActive
                                ]}>
                                    {formData.showPhone ? 'Visible on listing' : 'Hidden from listing'}
                                </Text>
                                <Switch
                                    value={formData.showPhone}
                                    onValueChange={(value) => handleInputChange('showPhone', value)}
                                    trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                                    thumbColor={formData.showPhone ? COLORS.primary : COLORS.textTertiary}
                                />
                            </View>
                        </View>

                        <View style={styles.contactField}>
                            <View style={styles.contactInputRow}>
                                <View style={styles.contactInputWrapper}>
                                    <Text style={styles.label}>Email</Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            !formData.showEmail && styles.inputDisabled
                                        ]}
                                        placeholder="email@example.com"
                                        placeholderTextColor={COLORS.textTertiary}
                                        value={formData.contactEmail}
                                        onChangeText={(text) => handleInputChange('contactEmail', text)}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        maxLength={255}
                                    />
                                </View>
                            </View>
                            <View style={styles.visibilityToggle}>
                                <Ionicons 
                                    name={formData.showEmail ? "eye" : "eye-off"} 
                                    size={18} 
                                    color={formData.showEmail ? COLORS.primary : COLORS.textTertiary} 
                                />
                                <Text style={[
                                    styles.visibilityText,
                                    formData.showEmail && styles.visibilityTextActive
                                ]}>
                                    {formData.showEmail ? 'Visible on listing' : 'Hidden from listing'}
                                </Text>
                                <Switch
                                    value={formData.showEmail}
                                    onValueChange={(value) => handleInputChange('showEmail', value)}
                                    trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                                    thumbColor={formData.showEmail ? COLORS.primary : COLORS.textTertiary}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Tags */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Tags</Text>
                        <View style={styles.tagInputContainer}>
                            <TextInput
                                style={[styles.input, styles.tagInput]}
                                placeholder="Add a tag (e.g., furniture, toys)"
                                placeholderTextColor={COLORS.textTertiary}
                                value={tagInput}
                                onChangeText={setTagInput}
                                onSubmitEditing={handleAddTag}
                                maxLength={50}
                            />
                            <TouchableOpacity
                                style={styles.addTagButton}
                                onPress={handleAddTag}
                            >
                                <Ionicons name="add" size={24} color={COLORS.buttonPrimaryText} />
                            </TouchableOpacity>
                        </View>

                        {formData.tags.length > 0 && (
                            <View style={styles.tagsContainer}>
                                {formData.tags.map((tag, index) => (
                                    <View key={index} style={styles.tag}>
                                        <Text style={styles.tagText}>#{tag}</Text>
                                        <TouchableOpacity
                                            onPress={() => handleRemoveTag(tag)}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <Ionicons name="close-circle" size={18} color={COLORS.primary} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Submit Buttons */}
                    <View style={styles.submitContainer}>
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                submitting && styles.submitButtonDisabled
                            ]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <View style={styles.submittingContainer}>
                                    <ActivityIndicator size="small" color={COLORS.buttonPrimaryText} />
                                    <Text style={styles.submitButtonText}>
                                        {uploadingImages ? 'Uploading Images...' : 'Saving Changes...'}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    Update Event
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancel}
                            disabled={submitting}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 50 }} />
                </ScrollView>
            </View>
        </ThemedSafeArea>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    saveButton: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
    form: {
        flex: 1,
        padding: SPACING.lg,
    },
    section: {
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    helperText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        fontSize: 16,
        color: COLORS.text,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    halfWidth: {
        flex: 1,
    },
    eventTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    eventTypeButton: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    eventTypeButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    eventTypeButtonText: {
        fontSize: 14,
        color: COLORS.text,
    },
    eventTypeButtonTextActive: {
        color: COLORS.buttonPrimaryText,
        fontWeight: '600',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    tagInputContainer: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    tagInput: {
        flex: 1,
    },
    addTagButton: {
        width: 48,
        height: 48,
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginTop: SPACING.md,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.surfaceSecondary,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.full,
    },
    tagText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
    },
    submitContainer: {
        marginTop: SPACING.xl,
        gap: SPACING.md,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.lg,
        borderRadius: RADIUS.md,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.buttonPrimaryText,
    },
    submittingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    cancelButton: {
        backgroundColor: COLORS.surface,
        padding: SPACING.lg,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    loadingText: {
        marginTop: SPACING.md,
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
    },
    dateButtonText: {
        fontSize: 16,
        color: COLORS.textTertiary,
    },
    dateButtonTextSelected: {
        color: COLORS.text,
        fontWeight: '500',
    },
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
    },
    timeButtonText: {
        fontSize: 16,
        color: COLORS.textTertiary,
    },
    timeButtonTextSelected: {
        color: COLORS.text,
        fontWeight: '500',
    },
    contactHelperText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
    },
    contactField: {
        marginBottom: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    contactInputRow: {
        padding: SPACING.md,
    },
    contactInputWrapper: {
        flex: 1,
    },
    visibilityToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.surfaceSecondary,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    visibilityText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.textTertiary,
    },
    visibilityTextActive: {
        color: COLORS.primary,
        fontWeight: '500',
    },
    inputDisabled: {
        opacity: 0.5,
    },
})