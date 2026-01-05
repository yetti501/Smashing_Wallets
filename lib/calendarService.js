import * as Calendar from 'expo-calendar'
import { Platform, Alert, Linking } from 'react-native'

export const calendarService = {
    /**
     * Request calendar permissions
     * @returns {Promise<boolean>} - Whether permission was granted
     */
    async requestPermissions() {
        const { status } = await Calendar.requestCalendarPermissionsAsync()
        
        if (status !== 'granted') {
            Alert.alert(
                'Calendar Permission Required',
                'Please allow calendar access to add events to your calendar.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Open Settings', 
                        onPress: () => Linking.openSettings() 
                    }
                ]
            )
            return false
        }
        
        return true
    },

    /**
     * Get the default calendar for the device
     * @returns {Promise<string|null>} - Calendar ID or null
     */
    async getDefaultCalendarId() {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)
        
        // Try to find the default calendar
        // On iOS, look for the default calendar
        // On Android, look for the primary Google calendar or first writable calendar
        
        if (Platform.OS === 'ios') {
            const defaultCalendar = calendars.find(
                cal => cal.allowsModifications && cal.source.name === 'Default'
            ) || calendars.find(
                cal => cal.allowsModifications && cal.source.name === 'iCloud'
            ) || calendars.find(
                cal => cal.allowsModifications
            )
            
            return defaultCalendar?.id || null
        } else {
            // Android - prefer primary calendar, then any writable calendar
            const primaryCalendar = calendars.find(
                cal => cal.isPrimary && cal.allowsModifications
            ) || calendars.find(
                cal => cal.accessLevel === 'owner' && cal.allowsModifications
            ) || calendars.find(
                cal => cal.allowsModifications
            )
            
            return primaryCalendar?.id || null
        }
    },

    /**
     * Parse time string (e.g., "9:00 AM") to hours and minutes
     * @param {string} timeString - Time in format "H:MM AM/PM"
     * @returns {{ hours: number, minutes: number }}
     */
    parseTime(timeString) {
        if (!timeString) return { hours: 9, minutes: 0 } // Default to 9 AM
        
        const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
        if (!match) return { hours: 9, minutes: 0 }
        
        let hours = parseInt(match[1])
        const minutes = parseInt(match[2])
        const period = match[3]?.toUpperCase()
        
        if (period === 'PM' && hours !== 12) {
            hours += 12
        } else if (period === 'AM' && hours === 12) {
            hours = 0
        }
        
        return { hours, minutes }
    },

    /**
     * Parse a date string in various formats
     * @param {string} dateStr - Date string (YYYY-MM-DD or ISO format)
     * @returns {{ year: number, month: number, day: number }}
     */
    parseDateString(dateStr) {
        if (!dateStr) {
            throw new Error('Date string is required')
        }
        
        // Remove any time component if present (e.g., from ISO string)
        const dateOnly = dateStr.split('T')[0]
        
        // Try YYYY-MM-DD format
        const parts = dateOnly.split('-')
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10)
            const month = parseInt(parts[1], 10)
            const day = parseInt(parts[2], 10)
            
            // Validate the parsed values
            if (!isNaN(year) && !isNaN(month) && !isNaN(day) && 
                year > 2000 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                return { year, month, day }
            }
        }
        
        // Fallback: try to parse as a Date object
        const parsed = new Date(dateStr)
        if (!isNaN(parsed.getTime())) {
            return {
                year: parsed.getFullYear(),
                month: parsed.getMonth() + 1,
                day: parsed.getDate()
            }
        }
        
        throw new Error(`Could not parse date: ${dateStr}`)
    },

    /**
     * Create start and end dates for the calendar event
     * @param {object} listing - The listing data
     * @returns {{ startDate: Date, endDate: Date }}
     */
    createEventDates(listing) {
        const eventDateStr = listing.date || listing.startDate
        
        console.log('Creating event dates from:', {
            date: listing.date,
            startDate: listing.startDate,
            startTime: listing.startTime,
            endTime: listing.endTime
        })
        
        if (!eventDateStr) {
            throw new Error('Event date is required')
        }
        
        // Parse the date
        const { year, month, day } = this.parseDateString(eventDateStr)
        console.log('Parsed date:', { year, month, day })
        
        // Parse start time
        const startTime = this.parseTime(listing.startTime)
        console.log('Parsed start time:', startTime)
        
        const startDate = new Date(year, month - 1, day, startTime.hours, startTime.minutes)
        console.log('Start date created:', startDate)
        
        // Validate the date
        if (isNaN(startDate.getTime())) {
            throw new Error(`Invalid start date created from: ${eventDateStr}`)
        }
        
        // Parse end time or default to 2 hours after start
        let endDate
        if (listing.endTime) {
            const endTime = this.parseTime(listing.endTime)
            console.log('Parsed end time:', endTime)
            endDate = new Date(year, month - 1, day, endTime.hours, endTime.minutes)
            
            // If end time is before start time, assume it's the next day
            if (endDate <= startDate) {
                endDate.setDate(endDate.getDate() + 1)
            }
        } else {
            // Default to 2 hours duration
            endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000)
        }
        
        console.log('End date created:', endDate)
        
        // Validate end date
        if (isNaN(endDate.getTime())) {
            throw new Error(`Invalid end date created`)
        }
        
        return { startDate, endDate }
    },

    /**
     * Build event description from listing data
     * @param {object} listing - The listing data
     * @returns {string}
     */
    buildDescription(listing) {
        let description = ''
        
        if (listing.description) {
            description += listing.description + '\n\n'
        }
        
        if (listing.price) {
            description += `💰 Price: ${listing.price}\n`
        }
        
        if (listing.tags && listing.tags.length > 0) {
            description += `🏷️ Tags: ${listing.tags.map(t => `#${t}`).join(' ')}\n`
        }
        
        // Add contact info if visible
        if (listing.contactPhone && listing.showPhone !== false) {
            description += `📞 Phone: ${listing.contactPhone}\n`
        }
        
        if (listing.contactEmail && listing.showEmail !== false) {
            description += `📧 Email: ${listing.contactEmail}\n`
        }
        
        description += '\n📍 Added from Smashing Wallets'
        
        return description.trim()
    },

    /**
     * Add a listing to the device calendar
     * @param {object} listing - The listing data
     * @returns {Promise<{ success: boolean, eventId?: string, error?: string }>}
     */
    async addToCalendar(listing) {
        try {
            // Request permissions
            const hasPermission = await this.requestPermissions()
            if (!hasPermission) {
                return { success: false, error: 'Permission denied' }
            }
            
            // Get default calendar
            const calendarId = await this.getDefaultCalendarId()
            if (!calendarId) {
                Alert.alert(
                    'No Calendar Found',
                    'Could not find a writable calendar on your device. Please make sure you have a calendar app set up.'
                )
                return { success: false, error: 'No calendar found' }
            }
            
            // Create event dates
            const { startDate, endDate } = this.createEventDates(listing)
            
            // Build event details
            const eventDetails = {
                title: listing.title,
                startDate: startDate,
                endDate: endDate,
                location: listing.location,
                notes: this.buildDescription(listing),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                alarms: [
                    { relativeOffset: -60 }, // 1 hour before
                    { relativeOffset: -1440 }, // 1 day before
                ],
            }
            
            // Create the event
            const eventId = await Calendar.createEventAsync(calendarId, eventDetails)
            
            return { success: true, eventId }
        } catch (error) {
            console.error('Error adding to calendar:', error)
            return { success: false, error: error.message }
        }
    },

    /**
     * Add a multi-day event to calendar
     * @param {object} listing - The listing data with startDate and endDate
     * @returns {Promise<{ success: boolean, eventId?: string, error?: string }>}
     */
    async addMultiDayToCalendar(listing) {
        try {
            // Request permissions
            const hasPermission = await this.requestPermissions()
            if (!hasPermission) {
                return { success: false, error: 'Permission denied' }
            }
            
            // Get default calendar
            const calendarId = await this.getDefaultCalendarId()
            if (!calendarId) {
                Alert.alert(
                    'No Calendar Found',
                    'Could not find a writable calendar on your device.'
                )
                return { success: false, error: 'No calendar found' }
            }
            
            console.log('Creating multi-day event from:', {
                startDate: listing.startDate,
                endDate: listing.endDate,
                startTime: listing.startTime,
                endTime: listing.endTime
            })
            
            // Parse start date
            const startParsed = this.parseDateString(listing.startDate)
            const startTime = this.parseTime(listing.startTime)
            const startDate = new Date(
                startParsed.year, 
                startParsed.month - 1, 
                startParsed.day, 
                startTime.hours, 
                startTime.minutes
            )
            
            // Parse end date
            const endParsed = this.parseDateString(listing.endDate)
            const endTime = this.parseTime(listing.endTime)
            const endDate = new Date(
                endParsed.year, 
                endParsed.month - 1, 
                endParsed.day, 
                endTime.hours || 17, 
                endTime.minutes || 0
            )
            
            console.log('Multi-day dates:', { startDate, endDate })
            
            // Validate dates
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new Error('Invalid date values')
            }
            
            // Build event details
            const eventDetails = {
                title: listing.title,
                startDate: startDate,
                endDate: endDate,
                location: listing.location,
                notes: this.buildDescription(listing),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                alarms: [
                    { relativeOffset: -60 },
                    { relativeOffset: -1440 },
                ],
            }
            
            // Create the event
            const eventId = await Calendar.createEventAsync(calendarId, eventDetails)
            
            return { success: true, eventId }
        } catch (error) {
            console.error('Error adding multi-day event to calendar:', error)
            return { success: false, error: error.message }
        }
    }
}