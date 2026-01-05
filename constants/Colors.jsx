/**
 * Smashing Wallets Color Palette
 * Centralized color system for consistent theming across the app
 */

export const COLORS = {
    // ============================================
    // PRIMARY COLORS - Main brand colors
    // ============================================
    primary: '#FF5747',           // Coral Red - Primary buttons, CTAs, active states
    primaryDark: '#E63E2E',       // Darker Red - Button press states
    primaryLight: '#FF7A6B',      // Light Red - Hover states, subtle accents
    // ============================================
    // BACKGROUND COLORS - Surfaces and containers
    // ============================================
    background: '#F8F9FA',        // Light Gray - Main app background
    surface: '#FFFFFF',           // White - Cards, modals, elevated surfaces
    surfaceSecondary: '#F5F5F5',  // Off White - Input backgrounds, secondary surfaces
    // ============================================
    // TEXT COLORS - All text elements
    // ============================================
    text: '#1E3A5F',              // Navy Blue - Primary text, headings, important content
    textSecondary: '#6B7280',     // Medium Gray - Labels, secondary text
    textTertiary: '#9CA3AF',      // Light Gray - Placeholders, disabled text, hints
    textInverse: '#FFFFFF',       // White - Text on dark/colored backgrounds
    // ============================================
    // BORDER COLORS - Dividers and outlines
    // ============================================
    border: '#E5E7EB',            // Light Gray - Input borders, dividers
    borderFocus: '#FF5747',       // Coral Red - Focused input borders
    borderError: '#DC2626',       // Error Red - Error state borders
    // ============================================
    // STATUS COLORS - Feedback and states
    // ============================================
    success: '#10B981',           // Green - Success messages, verified badges
    warning: '#F59E0B',           // Orange - Warnings, unverified states
    error: '#DC2626',             // Red - Errors, destructive actions
    info: '#3B82F6',              // Blue - Info messages, links
    // ============================================
    // SEMANTIC COLORS - Specific use cases
    // ============================================
    verified: '#10B981',          // Green - Email/phone verified badge
    unverified: '#F59E0B',        // Orange - Unverified badge
    disabled: '#D1D5DB',          // Light Gray - Disabled buttons, inactive elements
    shadow: '#000000',            // Black - Shadow color (use with low opacity)
    // ============================================
    // BADGE & ACCENT COLORS
    // ============================================
    badgeSuccess: '#10B981',      // Green badge background
    badgeWarning: '#F59E0B',      // Orange badge background
    badgeError: '#DC2626',        // Red badge background
    badgeInfo: '#3B82F6',         // Blue badge background
    badgeText: '#FFFFFF',         // White - Badge text color
    // ============================================
    // BUTTON COLORS - All button variants
    // ============================================
    buttonPrimary: '#FF5747',     // Coral Red - Primary action buttons
    buttonPrimaryPressed: '#E63E2E', // Darker Red - Primary button pressed
    buttonPrimaryText: '#FFFFFF', // White - Primary button text
    buttonSecondary: '#F5F5F5',   // Light Gray - Secondary buttons
    buttonSecondaryPressed: '#E5E7EB', // Medium Gray - Secondary button pressed
    buttonSecondaryText: '#1E3A5F', // Navy Blue - Secondary button text
    buttonDisabled: '#D1D5DB',    // Light Gray - Disabled button background
    buttonDisabledText: '#9CA3AF', // Medium Gray - Disabled button text
    // ============================================
    // ICON COLORS
    // ============================================
    iconPrimary: '#FF5747',       // Coral Red - Primary icons (edit, actions)
    iconSecondary: '#6B7280',     // Medium Gray - Secondary icons
    iconTertiary: '#9CA3AF',      // Light Gray - Inactive/placeholder icons
    // ============================================
    // OVERLAY & MODAL COLORS
    // ============================================
    overlay: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black - Modal overlays
    modalBackground: '#FFFFFF',    // White - Modal content background
    // ============================================
    // AVATAR & PROFILE COLORS
    // ============================================
    avatarBackground: '#007AFF',   // Blue - Default avatar background
    avatarText: '#FFFFFF',         // White - Avatar initials
    // ============================================
    // LINK COLORS
    // ============================================
    linkPrimaryText: '#FF5747'

}

    /**
     * USAGE EXAMPLES:
     * 
     * Import in your components:
     * import { COLORS } from '../../constants/Colors'
     * 
     * Use in styles:
     * backgroundColor: COLORS.primary
     * color: COLORS.text
     * borderColor: COLORS.border
     * 
     * Use in components:
     * <Ionicons name="pencil-outline" size={20} color={COLORS.iconPrimary} />
     */

export default COLORS

/**
 * SHADOW PRESETS - Reusable shadow configurations
 */
export const SHADOWS = {
    small: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    medium: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    large: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
}

/**
 * SPACING SYSTEM - Consistent spacing values
 */
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
}

/**
 * BORDER RADIUS - Consistent rounding
 */
export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999, // Fully rounded (for circles, pills)
}