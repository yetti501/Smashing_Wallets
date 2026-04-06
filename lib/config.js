/**
 * Smashing Wallets Configuration File
 * 
 * Usage:
 *   import config from './config'
 *   const databaseId = config.appwrite.databaseId
 */

/**
 * Main configuration object
 * All values are loaded from .env file via process.env
 */

import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

const config = {
    // ========================================
    // APPWRITE BACKEND CONFIGURATION
    // ========================================
    appwrite: {

        endpoint: extra.appwriteEndpoint,
        projectId: extra.appwriteProjectId,
        databaseId: extra.appwriteDatabaseId,

        collections: {
            listings: extra.appwriteCollectionListingsId,
            notes: extra.appwriteCollectionNotesId,
            savedEvents: extra.appwriteCollectionSavedEventsId
        },
        bucketId: extra.appwriteBucketId

        // // Connection settings
        // endpoint: process.env.APPWRITE_ENDPOINT,
        // projectId: process.env.APPWRITE_PROJECT_ID,
        
        // // Database
        // databaseId: process.env.APPWRITE_DATABASE_ID,
        
        // // Collections - organized by purpose
        // collections: {
        //     listings: process.env.APPWRITE_COLLECTION_LISTINGS_ID,
        //     notes: process.env.APPWRITE_COLLECTION_NOTES_ID,
        //     savedEvents: process.env.APPWRITE_COLLECTION_SAVED_EVENTS_ID,
        // },
        
        // // Storage
        // bucketId: process.env.APPWRITE_BUCKET_ID,
    },

    // ========================================
    // GOOGLE SERVICES CONFIGURATION
    // ========================================
    google: {
        maps: {
            // apiKey: process.env.GOOGLE_MAPS_API_KEY,
            apiKey: extra.googleMapsApiKey
        }
    },

    // ========================================
    // APPLICATION SETTINGS
    // ========================================
    app: {
        // Environment
        environment: process.env.APP_ENV || 'development',
        
        // Computed environment flags
        isDevelopment: (process.env.APP_ENV || 'development') === 'development',
        isProduction: process.env.APP_ENV === 'production',
        isPreview: process.env.APP_ENV === 'preview',
    },

    // ========================================
    // VALIDATION METHOD
    // ========================================
    /**
     * Validates that all required environment variables are present
     * Throws an error if any required variables are missing
     * 
     * @throws {Error} If any required variables are missing
     * @returns {boolean} true if all variables are present
     */
    validate() {
        const required = {
            // Appwrite
            'Appwrite Endpoint': this.appwrite.endpoint,
            'Appwrite Project ID': this.appwrite.projectId,
            'Appwrite Database ID': this.appwrite.databaseId,
            'Listings Collection ID': this.appwrite.collections.listings,
            'Notes Collection ID': this.appwrite.collections.notes,
            'Saved Events Collection ID': this.appwrite.collections.savedEvents,
            'Storage Bucket ID': this.appwrite.bucketId,
            
            // Google Maps (required for map features)
            'Google Maps API Key': this.google.maps.apiKey,
        };

        // Find missing variables
        const missing = Object.entries(required)
            .filter(([, value]) => !value)
            .map(([key]) => key);

        // If any are missing, throw a detailed error
        if (missing.length > 0) {
            throw new Error(
                `Configuration Error: Missing required environment variables:\n` +
                `${missing.join(', ')}\n\n` +
                `Please check your .env file.`
            );
        }

        return true;
    },

    // ========================================
    // HELPER METHODS
    // ========================================
    
    /**
     * Prints the current configuration (without sensitive values)
     * Useful for debugging
     */
    printConfig() {
    },

    /**
     * Masks a sensitive value for logging
     * Shows first 4 and last 4 characters only
     */
    maskValue(value) {
        if (!value || value.length < 8) return '***';
        return `${value.slice(0, 4)}...${value.slice(-4)}`;
    }
};

// ========================================
// EXPORTS
// ========================================

// Default export - the main config object
export default config;

// Named exports for convenience
export const {
    appwrite,
    google,
    app,
} = config;

// Export specific Appwrite values for quick access
export const {
    endpoint: APPWRITE_ENDPOINT,
    projectId: APPWRITE_PROJECT_ID,
    databaseId: APPWRITE_DATABASE_ID,
    collections: APPWRITE_COLLECTIONS,
    bucketId: APPWRITE_BUCKET_ID,
} = config.appwrite;

// Export Google Maps keys
export const GOOGLE_MAPS_API_KEY = config.google.maps.apiKey;
