import { useState, useEffect, useRef, useCallback } from 'react'
import {
    View,
    TextInput,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Keyboard,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SPACING, RADIUS } from '../constants/Colors'
import googlePlacesService from '../lib/googlePlacesService'

/**
 * AddressAutocomplete - Address input with Google Places suggestions
 * 
 * @param {string} value - Current address value
 * @param {function} onAddressSelect - Callback when address is selected with full details
 * @param {function} onChangeText - Callback for raw text changes
 * @param {string} placeholder - Input placeholder
 * @param {object} style - Custom container style
 * @param {object} inputStyle - Custom input style
 */
const AddressAutocomplete = ({
    value = '',
    onAddressSelect,
    onChangeText,
    placeholder = 'Enter address',
    style,
    inputStyle,
}) => {
    const [inputValue, setInputValue] = useState(value)
    const [suggestions, setSuggestions] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    
    const sessionTokenRef = useRef(null)
    const debounceTimerRef = useRef(null)

    // Sync external value changes
    useEffect(() => {
        setInputValue(value)
    }, [value])

    // Generate session token on mount
    useEffect(() => {
        sessionTokenRef.current = googlePlacesService.generateSessionToken()
    }, [])

    // Cleanup debounce timer
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
        }
    }, [])

    // Fetch suggestions with debounce
    const fetchSuggestions = useCallback(async (text) => {
        if (!text || text.length < 3) {
            setSuggestions([])
            setShowSuggestions(false)
            return
        }

        setIsLoading(true)

        try {
            const results = await googlePlacesService.getAutocompleteSuggestions(
                text,
                sessionTokenRef.current
            )
            setSuggestions(results)
            setShowSuggestions(results.length > 0)
        } catch (error) {
            console.error('Error fetching suggestions:', error)
            setSuggestions([])
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Handle text input changes
    const handleTextChange = (text) => {
        setInputValue(text)
        
        // Notify parent of raw text change
        if (onChangeText) {
            onChangeText(text)
        }

        // Debounce API calls
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }

        debounceTimerRef.current = setTimeout(() => {
            fetchSuggestions(text)
        }, 300)
    }

    // Handle suggestion selection
    const handleSuggestionSelect = async (suggestion) => {
        setIsLoading(true)
        setShowSuggestions(false)
        Keyboard.dismiss()

        try {
            // Get full place details
            const details = await googlePlacesService.getPlaceDetails(
                suggestion.placeId,
                sessionTokenRef.current
            )

            if (details) {
                setInputValue(details.formattedAddress)
                
                // Generate new session token for next search
                sessionTokenRef.current = googlePlacesService.generateSessionToken()

                // Notify parent with full address details
                if (onAddressSelect) {
                    onAddressSelect({
                        location: details.formattedAddress,
                        latitude: details.latitude,
                        longitude: details.longitude,
                        placeId: details.placeId,
                        area: details.neighborhood || details.city || '',
                        city: details.city,
                        state: details.stateShort,
                        zipCode: details.zipCode,
                        isValidated: true,
                    })
                }
            }
        } catch (error) {
            console.error('Error getting place details:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Handle input focus
    const handleFocus = () => {
        setIsFocused(true)
        if (suggestions.length > 0) {
            setShowSuggestions(true)
        }
    }

    // Handle input blur
    const handleBlur = () => {
        setIsFocused(false)
        // Delay hiding suggestions to allow tap to register
        setTimeout(() => {
            setShowSuggestions(false)
        }, 200)
    }

    // Clear input
    const handleClear = () => {
        setInputValue('')
        setSuggestions([])
        setShowSuggestions(false)
        
        if (onChangeText) {
            onChangeText('')
        }
        if (onAddressSelect) {
            onAddressSelect(null)
        }
    }

    return (
        <View style={[styles.container, style]}>
            {/* Input Field */}
            <View style={[
                styles.inputContainer,
                isFocused && styles.inputContainerFocused
            ]}>
                <Ionicons 
                    name="location-outline" 
                    size={20} 
                    color={isFocused ? COLORS.primary : COLORS.textSecondary} 
                />
                <TextInput
                    style={[styles.input, inputStyle]}
                    value={inputValue}
                    onChangeText={handleTextChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textTertiary}
                    autoCorrect={false}
                    autoCapitalize="words"
                />
                {isLoading ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                ) : inputValue.length > 0 ? (
                    <TouchableOpacity onPress={handleClear}>
                        <Ionicons name="close-circle" size={20} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    {suggestions.map((suggestion, index) => (
                        <TouchableOpacity
                            key={suggestion.placeId}
                            style={[
                                styles.suggestionItem,
                                index === suggestions.length - 1 && styles.suggestionItemLast
                            ]}
                            onPress={() => handleSuggestionSelect(suggestion)}
                        >
                            <Ionicons 
                                name="location" 
                                size={18} 
                                color={COLORS.primary} 
                                style={styles.suggestionIcon}
                            />
                            <View style={styles.suggestionText}>
                                <Text style={styles.suggestionMain} numberOfLines={1}>
                                    {suggestion.mainText}
                                </Text>
                                <Text style={styles.suggestionSecondary} numberOfLines={1}>
                                    {suggestion.secondaryText}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                    
                    {/* Google Attribution */}
                    <View style={styles.attribution}>
                        <Text style={styles.attributionText}>Powered by Google</Text>
                    </View>
                </View>
            )}
        </View>
    )
}

export default AddressAutocomplete

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 1000,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        gap: SPACING.sm,
    },
    inputContainerFocused: {
        borderColor: COLORS.primary,
    },
    input: {
        flex: 1,
        paddingVertical: SPACING.md,
        fontSize: 16,
        color: COLORS.text,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        marginTop: 4,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        maxHeight: 250,
        overflow: 'hidden',
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    suggestionItemLast: {
        borderBottomWidth: 0,
    },
    suggestionIcon: {
        marginRight: SPACING.sm,
    },
    suggestionText: {
        flex: 1,
    },
    suggestionMain: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.text,
    },
    suggestionSecondary: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    attribution: {
        padding: SPACING.sm,
        alignItems: 'center',
        backgroundColor: COLORS.surfaceSecondary,
    },
    attributionText: {
        fontSize: 11,
        color: COLORS.textTertiary,
    },
})