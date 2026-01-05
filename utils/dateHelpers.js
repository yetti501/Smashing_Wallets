/**
 * Date Helper Functions
 * Utilities for handling event dates, times, and durations
 */

/**
 * Format a single date
 */
export const formatDate = (dateString, options = {}) => {
    if (!dateString) return 'Date TBD'
    
    const date = new Date(dateString)
    const defaultOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...options
    }
    
    return date.toLocaleDateString('en-US', defaultOptions)
}

/**
 * Format date range for multi-day events
 */
export const formatDateRange = (startDate, endDate) => {
    if (!startDate) return 'Date TBD'
    
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : null
    
    if (!end || start.toDateString() === end.toDateString()) {
        return formatDate(startDate)
    }
    
    // Check if same year
    const sameYear = start.getFullYear() === end.getFullYear()
    
    const startStr = start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: sameYear ? undefined : 'numeric'
    })
    
    const endStr = end.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })
    
    return `${startStr} - ${endStr}`
}

/**
 * Calculate event duration in days
 */
export const getEventDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 1
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays + 1
}

/**
 * Check if event is happening today
 */
export const isToday = (dateString) => {
    if (!dateString) return false
    
    const eventDate = new Date(dateString)
    const today = new Date()
    
    return eventDate.toDateString() === today.toDateString()
}

/**
 * Check if event is happening soon (within specified hours)
 */
export const isHappeningSoon = (dateString, hours = 24) => {
    if (!dateString) return false
    
    const eventDate = new Date(dateString)
    const now = new Date()
    const hoursUntilEvent = (eventDate - now) / (1000 * 60 * 60)
    
    return hoursUntilEvent > 0 && hoursUntilEvent <= hours
}

/**
 * Check if event is in the past
 */
export const isPast = (dateString) => {
    if (!dateString) return false
    
    const eventDate = new Date(dateString)
    const now = new Date()
    
    return eventDate < now
}

/**
 * Get relative time string
 */
export const getRelativeTimeString = (dateString) => {
    if (!dateString) return 'Date TBD'
    
    const eventDate = new Date(dateString)
    const now = new Date()
    const diffTime = eventDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Past event'
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays <= 7) return `In ${diffDays} days`
    if (diffDays <= 30) return `In ${Math.ceil(diffDays / 7)} weeks`
    
    return formatDate(dateString)
}

/**
 * Check if an event is currently happening
 */
export const isHappeningNow = (startDate, endDate) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : start
    
    return now >= start && now <= end
}

/**
 * Get today's date in ISO format
 */
export const getTodayISO = () => {
    return new Date().toISOString().split('T')[0]
}