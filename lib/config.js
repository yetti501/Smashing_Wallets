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
const config = {
    // ========================================
    // APPWRITE BACKEND CONFIGURATION
    // ========================================
    appwrite: {
        // Connection settings
        endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
        projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
        
        // Database
        databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
        
        // Collections - organized by purpose
        collections: {
            listings: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_LISTINGS_ID,
            notes: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_NOTES_ID,
            savedEvents: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_SAVED_EVENTS_ID,
        },
        
        // Storage
        bucketId: process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID,
    },

    // ========================================
    // GOOGLE SERVICES CONFIGURATION
    // ========================================
    google: {
        maps: {
            apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        }
    },

    // ========================================
    // APPLICATION SETTINGS
    // ========================================
    app: {
        // Environment
        environment: process.env.EXPO_PUBLIC_APP_ENV || 'development',
        
        // Computed environment flags
        isDevelopment: (process.env.EXPO_PUBLIC_APP_ENV || 'development') === 'development',
        isProduction: process.env.EXPO_PUBLIC_APP_ENV === 'production',
        isPreview: process.env.EXPO_PUBLIC_APP_ENV === 'preview',
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
            console.error('❌ Missing required environment variables:');
            missing.forEach(key => console.error(`   - ${key}`));
            console.error('\n💡 Check your .env file and make sure all values are set!');
            
            throw new Error(
                `Configuration Error: Missing required environment variables:\n` +
                `${missing.join(', ')}\n\n` +
                `Please check your .env file.`
            );
        }

        // Success!
        console.log('✅ Configuration validated successfully');
        console.log(`📍 Environment: ${this.app.environment}`);
        
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
        console.log('\n📋 Smashing Wallets Configuration:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Environment:', this.app.environment);
        console.log('Appwrite Endpoint:', this.appwrite.endpoint);
        console.log('Database ID:', this.maskValue(this.appwrite.databaseId));
        console.log('Collections:', Object.keys(this.appwrite.collections).join(', '));
        console.log('Google Maps:', this.google.maps.apiKey ? '✓ Configured' : '✗ Missing');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
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

// Debug logging - remove after fixing
console.log('=== CONFIG DEBUG ===');
console.log('Google Maps API Key:', config.google.maps.apiKey ? config.google.maps.apiKey.substring(0, 15) + '...' : 'MISSING');
console.log('Appwrite Endpoint:', config.appwrite.endpoint || 'MISSING');
console.log('App Environment:', config.app.environment);
console.log('====================');

// ========================================
// AUTO-VALIDATION
// ========================================
// Automatically validate configuration when imported
// Only in development to avoid production errors
if (__DEV__) {
    try {
        config.validate();
    } catch (error) {
        console.error('\n🚨 Configuration Error:');
        console.error(error.message);
        console.error('\nThe app will not work properly until this is fixed.\n');
    }
}

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