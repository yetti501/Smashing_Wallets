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
    ActivityIndicator ,
    Platform, 
    Image
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'

import ThemedSafeArea from '../../components/ThemedSafeArea'
import ThemedInfoCard from '../../components/ThemedInfoCard'
import { useListings } from '../../contexts/ListingsContext'
import { useAuth } from '../../contexts/AuthContext'
import { COLORS, SPACING, RADIUS } from '../../constants/Colors'
import { EVENT_TYPES, EVENT_TYPE_LABELS } from '../../lib/appwrite'

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
    const [timePickerValue, setTimePickerValue] = useState(false)

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [originalListing, setOriginalListing] = useState(null)

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
                tags: data.tags || [],
                featured: data.featured || false,
                multiday: data.multiday || false,
                isRecurring: data.isRecurring || false,
                status: data.status || 'active',
            })
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
        
        // Handle both 'YYYY-MM-DD' and full ISO timestamps
        let date
        if (dateString.includes('T')) {
            // Already has timestamp
            date = new Date(dateString)
        } else {
            // Just a date string, add time
            date = new Date(dateString + 'T00:00:00')
        }
        
        // Check if date is valid
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

    // Handle date picker for single-day events
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

    // Handle start date picker for multi-day events
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

    // Handle end date picker for multi-day events
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

    // Open date picker with current date or today
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

    // Parse time string to Date object
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

    // Handle start time change
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

    // Then need to add to add updates to the UI. 

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
        if (!validateForm()) return

        setSubmitting(true)
        try {
            // Prepare update data (only changed fields)
            const updates = {}
            
            Object.keys(formData).forEach(key => {
                if (formData[key] !== originalListing[key]) {
                    updates[key] = formData[key]
                }
            })

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
        <ThemedSafeArea scrollable={false}>
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

                    {/* Date Fields */}
                    {/* {formData.multiday ? (
                        <>
                            <View style={styles.section}>
                                <Text style={styles.label}>Start Date *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={COLORS.textTertiary}
                                    value={formData.startDate}
                                    onChangeText={(text) => handleInputChange('startDate', text)}
                                />
                                <Text style={styles.helperText}>
                                    Format: 2025-12-25
                                </Text>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.label}>End Date *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={COLORS.textTertiary}
                                    value={formData.endDate}
                                    onChangeText={(text) => handleInputChange('endDate', text)}
                                />
                            </View>
                        </>
                    ) : (
                        <View style={styles.section}>
                            <Text style={styles.label}>Event Date *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={COLORS.textTertiary}
                                value={formData.date || formData.startDate}
                                onChangeText={(text) => {
                                    handleInputChange('date', text)
                                    handleInputChange('startDate', text)
                                }}
                            />
                            <Text style={styles.helperText}>
                                Format: 2025-12-25
                            </Text>
                        </View>
                    )} */}

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

                    {/* Time Fields */}
                    {/* <View style={styles.row}>
                        <View style={[styles.section, styles.halfWidth]}>
                            <Text style={styles.label}>Start Time</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="9:00 AM"
                                placeholderTextColor={COLORS.textTertiary}
                                value={formData.startTime}
                                onChangeText={(text) => handleInputChange('startTime', text)}
                                maxLength={50}
                            />
                        </View>

                        <View style={[styles.section, styles.halfWidth]}>
                            <Text style={styles.label}>End Time</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="4:00 PM"
                                placeholderTextColor={COLORS.textTertiary}
                                value={formData.endTime}
                                onChangeText={(text) => handleInputChange('endTime', text)}
                                maxLength={50}
                            />
                        </View>
                    </View> */}

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
                    <ThemedInfoCard style={styles.section}>
                        <Text style={styles.sectionTitle}>Contact Information</Text>
                        
                        <View style={styles.subsection}>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
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

                        <View style={styles.subsection}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="email@example.com"
                                placeholderTextColor={COLORS.textTertiary}
                                value={formData.contactEmail}
                                onChangeText={(text) => handleInputChange('contactEmail', text)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                maxLength={255}
                            />
                        </View>
                    </ThemedInfoCard>

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

                    {/* Additional Options */}
                    {/* <ThemedInfoCard style={styles.section}>
                        <Text style={styles.sectionTitle}>Additional Options</Text>

                        <View style={styles.toggleRow}>
                            <View>
                                <Text style={styles.label}>Featured Event</Text>
                                <Text style={styles.helperText}>
                                    Highlight this event
                                </Text>
                            </View>
                            <Switch
                                value={formData.featured}
                                onValueChange={(value) => handleInputChange('featured', value)}
                                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                thumbColor={COLORS.buttonPrimaryText}
                            />
                        </View>

                        <View style={styles.toggleRow}>
                            <View>
                                <Text style={styles.label}>Recurring Event</Text>
                                <Text style={styles.helperText}>
                                    This event repeats regularly
                                </Text>
                            </View>
                            <Switch
                                value={formData.isRecurring}
                                onValueChange={(value) => handleInputChange('isRecurring', value)}
                                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                thumbColor={COLORS.buttonPrimaryText}
                            />
                        </View>
                    </ThemedInfoCard> */}

                    {/* Submit Buttons */}
                    <View style={styles.submitContainer}>
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color={COLORS.buttonPrimaryText} />
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
    subsection: {
        marginBottom: SPACING.md,
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
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.buttonPrimaryText,
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
})