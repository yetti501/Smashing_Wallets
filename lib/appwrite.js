import {Client, Account, Databases, ID, Storage, Query } from 'appwrite'
import config from './config'

const client = new Client()
    .setEndpoint(config.appwrite.endpoint)
    .setProject(config.appwrite.projectId)

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)
export { ID, Query }
export default client

// ============================================
// LISTING DATABASE CONFIG
// ============================================
export const DATABASE_ID = config.appwrite.databaseId
export const BUCKET_ID = config.appwrite.bucketId
export const COLLECTIONS = {
    LISTINGS: config.appwrite.collections.listings,
    SAVED_EVENTS: config.appwrite.collections.savedEvents, // Add this to your config.js
    // This is where you will add any more tables that you need as part of this project
}

// ============================================
// EVENT TYPES
// ============================================
export const EVENT_TYPES = {
    YARD_SALE: 'yard-sale',
    SWAP_MEET: 'swap-meet',
    BAKE_SALE: 'bake-sale',
    GARAGE_SALE: 'garage-sale',
    ESTATE_SALE: 'estate-sale',
    CRAFT_FAIR: 'craft-fair',
    FARMERS_MARKET: 'farmers-market',
    FLEA_MARKET: 'flea-market',
    BOOK_SALE: 'book-sale',
    OTHER: 'other'
}

export const EVENT_TYPE_LABELS = {
    [EVENT_TYPES.YARD_SALE]: 'Yard Sale',
    [EVENT_TYPES.SWAP_MEET]: 'Swap Meet',
    [EVENT_TYPES.BAKE_SALE]: 'Bake Sale',
    [EVENT_TYPES.GARAGE_SALE]: 'Garage Sale',
    [EVENT_TYPES.ESTATE_SALE]: 'Estate Sale',
    [EVENT_TYPES.CRAFT_FAIR]: 'Craft Fair',
    [EVENT_TYPES.FARMERS_MARKET]: 'Farmers Market',
    [EVENT_TYPES.FLEA_MARKET]: 'Flea Market',
    [EVENT_TYPES.BOOK_SALE]: 'Book Sale',
    [EVENT_TYPES.OTHER]: 'Other Event'
}

export const EVENT_TYPE_ICONS = {
    [EVENT_TYPES.YARD_SALE]: 'home-outline',
    [EVENT_TYPES.SWAP_MEET]: 'swap-horizontal-outline',
    [EVENT_TYPES.BAKE_SALE]: 'cafe-outline',
    [EVENT_TYPES.GARAGE_SALE]: 'car-outline',
    [EVENT_TYPES.ESTATE_SALE]: 'business-outline',
    [EVENT_TYPES.CRAFT_FAIR]: 'color-palette-outline',
    [EVENT_TYPES.FARMERS_MARKET]: 'leaf-outline',
    [EVENT_TYPES.FLEA_MARKET]: 'storefront-outline',
    [EVENT_TYPES.BOOK_SALE]: 'book-outline',
    [EVENT_TYPES.OTHER]: 'calendar-outline'
}

// ============================================
// EVENT STATUSES
// ============================================
export const EVENT_STATUSES = {
    ACTIVE: 'active',
    DRAFT: 'draft',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed'
}

// ============================================
// RECURRENCE PATTERNS
// ============================================
export const RECURRENCE_PATTERNS = {
    NONE: null,
    WEEKLY: 'weekly',
    BIWEEKLY: 'biweekly',
    MONTHLY: 'monthly',
    FIRST_SATURDAY: 'first-saturday',
    LAST_SATURDAY: 'last-saturday',
    FIRST_SUNDAY: 'first-sunday',
    LAST_SUNDAY: 'last-sunday',
}

export const RECURRENCE_PATTERN_LABELS = {
    [RECURRENCE_PATTERNS.WEEKLY]: 'Every Week',
    [RECURRENCE_PATTERNS.BIWEEKLY]: 'Every 2 Weeks',
    [RECURRENCE_PATTERNS.MONTHLY]: 'Every Month',
    [RECURRENCE_PATTERNS.FIRST_SATURDAY]: 'First Saturday of Month',
    [RECURRENCE_PATTERNS.LAST_SATURDAY]: 'Last Saturday of Month',
    [RECURRENCE_PATTERNS.FIRST_SUNDAY]: 'First Sunday of Month',
    [RECURRENCE_PATTERNS.LAST_SUNDAY]: 'Last Sunday of Month',
}