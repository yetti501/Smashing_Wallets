import { useState } from 'react'
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
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import ThemedSafeArea from '../../components/ThemedSafeArea'
import AddressAutocomplete from '../../components/AddressAutocomplete'
import AddressValidationModal from '../../components/AddressValidationModal'
import ImagePickerGrid from '../../components/ImagePickerGrid'
import { useListings } from '../../contexts/ListingsContext'
import { useAuth } from '../../contexts/AuthContext'
import { COLORS, SPACING, RADIUS } from '../../constants/Colors'
import { EVENT_TYPES, EVENT_TYPE_LABELS } from '../../lib/appwrite'
import { imageService } from '../../lib/imageService'
import googlePlacesService from '../../lib/googlePlacesService'

export default function NewListingScreen() {
    const { user } = useAuth()
    const { createListing } = useListings()
    const [submitting, setSubmitting] = useState(false)
    const [uploadingImages, setUploadingImages] = useState(false)
    
    // Date picker state
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [showStartDatePicker, setShowStartDatePicker] = useState(false)
    const [showEndDatePicker, setShowEndDatePicker] = useState(false)
    const [datePickerValue, setDatePickerValue] = useState(new Date())
    
    // Time picker state
    const [showStartTimePicker, setShowStartTimePicker] = useState(false)
    const [showEndTimePicker, setShowEndTimePicker] = useState(false)
    const [timePickerValue, setTimePickerValue] = useState(new Date())

    // Address validation state
    const [addressValidated, setAddressValidated] = useState(false)
    const [validationModalVisible, setValidationModalVisible] = useState(false)
    const [validationResult, setValidationResult] = useState(null)
    const [isValidating, setIsValidating] = useState(false)

    // Image state - array of { uri, isExisting }
    const [selectedImages, setSelectedImages] = useState([])

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        eventType: EVENT_TYPES.YARD_SALE,
        location: '',
        area: '',
        latitude: null,
        longitude: null,
        placeId: '',
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
    })

    const [tagInput, setTagInput] = useState('')

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Handle address selection from autocomplete
    const handleAddressSelect = (addressData) => {
        if (addressData) {
            setFormData(prev => ({
                ...prev,
                location: addressData.location,
                latitude: addressData.latitude,
                longitude: addressData.longitude,
                placeId: addressData.placeId,
                area: addressData.area || prev.area,
            }))
            setAddressValidated(addressData.isValidated || false)
        } else {
            // Cleared
            setFormData(prev => ({
                ...prev,
                location: '',
                latitude: null,
                longitude: null,
                placeId: '',
            }))
            setAddressValidated(false)
        }
    }

    // Handle manual address text change (user typing without selecting)
    const handleAddressTextChange = (text) => {
        setFormData(prev => ({ ...prev, location: text }))
        setAddressValidated(false) // Reset validation when user edits
    }

    // Validate address when user hasn't selected from autocomplete
    const validateManualAddress = async () => {
        if (!formData.location.trim()) return true // Will be caught by form validation
        
        if (addressValidated) return true // Already validated via autocomplete

        setIsValidating(true)
        setValidationModalVisible(true)

        try {
            const result = await googlePlacesService.validateAddress(formData.location)
            setValidationResult(result)
            setIsValidating(false)

            if (result.isValid) {
                // Auto-update with validated data
                setFormData(prev => ({
                    ...prev,
                    location: result.formattedAddress || prev.location,
                    latitude: result.latitude,
                    longitude: result.longitude,
                    placeId: result.placeId || '',
                }))
                setAddressValidated(true)
                return true
            }

            // If not valid, modal will show options
            return false
        } catch (error) {
            console.error('Error validating address:', error)
            setIsValidating(false)
            setValidationModalVisible(false)
            return true // Allow submission on error
        }
    }

    // Handle using suggested address from validation
    const handleUseSuggestedAddress = () => {
        if (validationResult?.suggestedAddress) {
            setFormData(prev => ({
                ...prev,
                location: validationResult.suggestedAddress,
                latitude: validationResult.latitude,
                longitude: validationResult.longitude,
                placeId: validationResult.placeId || '',
            }))
            setAddressValidated(true)
        }
        setValidationModalVisible(false)
        // Continue with submission
        proceedWithSubmission()
    }

    // Handle keeping original address
    const handleKeepOriginalAddress = async () => {
        // Try to geocode the original address to get lat/lng
        if (!formData.latitude || !formData.longitude) {
            const geocodeResult = await googlePlacesService.geocodeAddress(formData.location)
            if (geocodeResult) {
                setFormData(prev => ({
                    ...prev,
                    latitude: geocodeResult.latitude,
                    longitude: geocodeResult.longitude,
                    placeId: geocodeResult.placeId || '',
                    area: prev.area || geocodeResult.neighborhood || geocodeResult.city || '',
                }))
            }
        }
        setAddressValidated(true)
        setValidationModalVisible(false)
        // Continue with submission
        proceedWithSubmission()
    }

    // Format date to YYYY-MM-DD
    const formatDate = (date) => {
        const d = new Date(date)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    // Format date for display (e.g., "Dec 25, 2025")
    const formatDateDisplay = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString + 'T00:00:00')
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        })
    }

    // Handle date picker for single-day events
    const handleDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false)
        }
        
        if (selectedDate) {
            const formattedDate = formatDate(selectedDate)
            handleInputChange('date', formattedDate)
            handleInputChange('startDate', formattedDate)
            
            if (Platform.OS === 'ios') {
                setShowDatePicker(false)
            }
        }
    }

    // Handle start date picker for multi-day events
    const handleStartDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowStartDatePicker(false)
        }
        
        if (selectedDate) {
            const formattedDate = formatDate(selectedDate)
            handleInputChange('startDate', formattedDate)
            
            if (Platform.OS === 'ios') {
                setShowStartDatePicker(false)
            }
        }
    }

    // Handle end date picker for multi-day events
    const handleEndDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowEndDatePicker(false)
        }
        
        if (selectedDate) {
            const formattedDate = formatDate(selectedDate)
            handleInputChange('endDate', formattedDate)
            
            if (Platform.OS === 'ios') {
                setShowEndDatePicker(false)
            }
        }
    }

    // Open date picker with current date or today
    const openDatePicker = (pickerType) => {
        let initialDate = new Date()
        
        if (pickerType === 'date' && formData.date) {
            initialDate = new Date(formData.date + 'T00:00:00')
        } else if (pickerType === 'startDate' && formData.startDate) {
            initialDate = new Date(formData.startDate + 'T00:00:00')
        } else if (pickerType === 'endDate' && formData.endDate) {
            initialDate = new Date(formData.endDate + 'T00:00:00')
        }
        
        setDatePickerValue(initialDate)
        
        if (pickerType === 'date') {
            setShowDatePicker(true)
        } else if (pickerType === 'startDate') {
            setShowStartDatePicker(true)
        } else if (pickerType === 'endDate') {
            setShowEndDatePicker(true)
        }
    }

    // Format time to 12-hour format (e.g., "9:00 AM")
    const formatTime = (date) => {
        let hours = date.getHours()
        const minutes = date.getMinutes()
        const ampm = hours >= 12 ? 'PM' : 'AM'
        
        hours = hours % 12
        hours = hours ? hours : 12 // 0 should be 12
        
        const minutesStr = minutes < 10 ? '0' + minutes : minutes
        
        return `${hours}:${minutesStr} ${ampm}`
    }

    // Format phone number as user types
    const formatPhoneNumber = (text) => {
        // Remove all non-digit characters
        const cleaned = text.replace(/\D/g, '')

        // Limit to 10 digits
        const limited = cleaned.substring(0, 10)

        // Format as (###) ###-####
        if(limited.length === 0 ) {
            return ''
        } else if(limited.length <= 3) {
            return `(${limited})`
        } else if(limited.length <=6) {
            return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
        } else {
            return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
        }
    }

    // Parse time string to Date object
    const parseTimeToDate = (timeString) => {
        if (!timeString) return new Date()
        
        // Handle formats like "9:00 AM" or "09:00"
        const date = new Date()
        const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i
        const match = timeString.match(timeRegex)
        
        if (match) {
            let hours = parseInt(match[1])
            const minutes = parseInt(match[2])
            const ampm = match[3]
            
            if (ampm) {
                if (ampm.toUpperCase() === 'PM' && hours !== 12) {
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

    // Handle start time change
    const handleStartTimeChange = (event, selectedTime) => {
        if (Platform.OS === 'android') {
            setShowStartTimePicker(false)
        }
        
        if (selectedTime) {
            const formattedTime = formatTime(selectedTime)
            handleInputChange('startTime', formattedTime)
            
            if (Platform.OS === 'ios') {
                setShowStartTimePicker(false)
            }
        }
    }

    // Handle end time change
    const handleEndTimeChange = (event, selectedTime) => {
        if (Platform.OS === 'android') {
            setShowEndTimePicker(false)
        }
        
        if (selectedTime) {
            const formattedTime = formatTime(selectedTime)
            handleInputChange('endTime', formattedTime)
            
            if (Platform.OS === 'ios') {
                setShowEndTimePicker(false)
            }
        }
    }

    // Open time picker with current time or default
    const openTimePicker = (pickerType) => {
        let initialTime = new Date()
        
        if (pickerType === 'startTime' && formData.startTime) {
            initialTime = parseTimeToDate(formData.startTime)
        } else if (pickerType === 'endTime' && formData.endTime) {
            initialTime = parseTimeToDate(formData.endTime)
        } else {
            // Set default times
            if (pickerType === 'startTime') {
                initialTime.setHours(9, 0, 0, 0) // 9:00 AM
            } else {
                initialTime.setHours(16, 0, 0, 0) // 4:00 PM
            }
        }
        
        setTimePickerValue(initialTime)
        
        if (pickerType === 'startTime') {
            setShowStartTimePicker(true)
        } else if (pickerType === 'endTime') {
            setShowEndTimePicker(true)
        }
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
        // Validate dates
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
        if (!user) {
            Alert.alert('Error', 'You must be logged in to create an event')
            return
        }
        if (!validateForm()) return

        // Check if address needs validation
        if (!addressValidated && formData.location.trim()) {
            const isValid = await validateManualAddress()
            if (!isValid) {
                // Modal is showing, wait for user action
                return
            }
        }

        // Proceed with submission
        proceedWithSubmission()
    }

    const proceedWithSubmission = async () => {
        setSubmitting(true)
        
        try {
            let imageUrls = []
            
            // Upload images if any are selected
            if (selectedImages.length > 0) {
                setUploadingImages(true)
                
                try {
                    const imageUris = selectedImages.map(img => img.uri)
                    const uploadResult = await imageService.uploadMultipleImages(
                        imageUris,
                        (current, total) => {
                            console.log(`Uploading image ${current} of ${total}`)
                        }
                    )
                    imageUrls = uploadResult.urls
                } catch (uploadError) {
                    console.error('Error uploading images:', uploadError)
                    Alert.alert(
                        'Image Upload Failed',
                        'Failed to upload images. Would you like to continue without images?',
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
                                onPress: () => finishSubmission([])
                            }
                        ]
                    )
                    return
                } finally {
                    setUploadingImages(false)
                }
            }
            
            await finishSubmission(imageUrls)
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to create event')
            console.error('Error creating listing:', error)
            setSubmitting(false)
        }
    }

    const finishSubmission = async (imageUrls) => {
        try {
            // Prepare data for submission
            const listingData = {
                ...formData,
                // Set date field for single-day events
                date: formData.multiday ? formData.startDate : (formData.date || formData.startDate),
                status: 'active',
                images: imageUrls,
            }
            
            await createListing(listingData)
            
            Alert.alert('Success', 'Event created successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        setTimeout(() => {
                            router.replace('/(tabs)/viewListings')
                        }, 100)
                    }
                }
            ])
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to create event')
            console.error('Error creating listing:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleCancel = () => {
        router.back()
    }

    return (
        <ThemedSafeArea scrollable={false} extraBottomPadding={0} edges={['top']}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleCancel}>
                        <Ionicons name="close" size={28} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Create Event</Text>
                    <TouchableOpacity 
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                            <Text style={styles.saveButton}>Create</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    style={styles.form}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
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
                                onImagesChange={setSelectedImages}
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
                                    formData.date && styles.dateButtonTextSelected
                                ]}>
                                    {formData.date 
                                        ? formatDateDisplay(formData.date)
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

                    {/* Location with Autocomplete */}
                    <View style={[styles.section, { zIndex: 1000 }]}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>Location *</Text>
                            {addressValidated && (
                                <View style={styles.validatedBadge}>
                                    <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                                    <Text style={styles.validatedText}>Verified</Text>
                                </View>
                            )}
                        </View>
                        <AddressAutocomplete
                            value={formData.location}
                            onAddressSelect={handleAddressSelect}
                            onChangeText={handleAddressTextChange}
                            placeholder="123 Main St, Phoenix, AZ 85001"
                        />
                        <Text style={styles.helperText}>
                            Start typing to see address suggestions
                        </Text>
                    </View>

                    {/* Area */}
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
                        <Text style={styles.helperText}>
                            Auto-filled from address, but you can edit it
                        </Text>
                    </View>

                    {/* Price */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Price/Entry Fee</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Free, $5 entry"
                            placeholderTextColor={COLORS.textTertiary}
                            value={formData.price}
                            onChangeText={(text) => handleInputChange('price', text)}
                            maxLength={50}
                        />
                    </View>

                    {/* Contact */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Contact Information</Text>
                        <Text style={styles.contactHelperText}>
                            Add contact details for interested buyers. Toggle visibility for each.
                        </Text>

                        <View style={styles.contactField}>
                            <View style={styles.contactInputRow}>
                                <View style={styles.contactInputWrapper}>
                                    <Text style={styles.label}>Phone</Text>
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
                                        maxLength={14}
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
                                    {formData.showPhone ? 'Visible' : 'Hidden'}
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
                                    {formData.showEmail ? 'Visible' : 'Hidden'}
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
                                placeholder="Add a tag"
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
                                        <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                                            <Ionicons name="close-circle" size={18} color={COLORS.primary} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Submit */}
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
                                    {uploadingImages ? 'Uploading Images...' : 'Creating Event...'}
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.submitButtonText}>
                                Create Event
                            </Text>
                        )}
                    </TouchableOpacity>

                    <View style={{ height: 50 }} />
                </ScrollView>
            </View>

            {/* Address Validation Modal */}
            <AddressValidationModal
                visible={validationModalVisible}
                onClose={() => setValidationModalVisible(false)}
                validationResult={validationResult}
                originalAddress={formData.location}
                onUseSuggested={handleUseSuggestedAddress}
                onKeepOriginal={handleKeepOriginalAddress}
                isValidating={isValidating}
            />
        </ThemedSafeArea>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    saveButton: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
    form: { flex: 1, padding: SPACING.lg },
    section: { marginBottom: SPACING.lg },
    subsection: { marginBottom: SPACING.md },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.md },
    label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
    labelRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    validatedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: RADIUS.full,
    },
    validatedText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#22C55E',
    },
    helperText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        fontSize: 16,
        color: COLORS.text,
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    row: { flexDirection: 'row', gap: SPACING.md },
    halfWidth: { flex: 1 },
    eventTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    eventTypeButton: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    eventTypeButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    eventTypeButtonText: { fontSize: 14, color: COLORS.text },
    eventTypeButtonTextActive: { color: COLORS.buttonPrimaryText, fontWeight: '600' },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm },
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
    tagInputContainer: { flexDirection: 'row', gap: SPACING.sm },
    tagInput: { flex: 1 },
    addTagButton: {
        width: 48,
        height: 48,
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.surfaceSecondary,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.full,
    },
    tagText: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.lg,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        marginTop: SPACING.xl,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.buttonPrimaryText },
    submittingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    // Contact visibility styles
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