import { StyleSheet, ScrollView, KeyboardAvoidingView, Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context' 
import { COLORS } from '../constants/Colors'

/**
 * ThemedSafeArea - Reusable safe area wrapper with keyboard handling
 * Combines SafeAreaView, KeyboardAvoidingView, and ScrollView
 * 
 * @param {ReactNode} children - Content to render
 * @param {boolean} scrollable - Whether content should be scrollable (default: true)
 * @param {object} style - Custom style for container
 * @param {object} contentContainerStyle - Custom style for scroll content
 * @param {boolean} centered - Center content vertically (default: false)
 * @param {boolean} keyboardAvoiding - Enable keyboard avoidance (default: true)
 * @param {boolean} showsVerticalScrollIndicator - Show scroll indicator (default: false)
 * @param {number} extraBottomPadding - Additional bottom padding (default: 20)
 * @param {Array} edges - Which edges to apply safe area (default: ['top', 'bottom'])
 */

const ThemedSafeArea = ({
    children, 
    scrollable = true, 
    style,  
    contentContainerStyle, 
    centered = false, 
    keyboardAvoiding = true, 
    showsVerticalScrollIndicator = false, 
    extraBottomPadding = 20,
    edges = ['top', 'bottom'],
    ...props
}) => {
    const insets = useSafeAreaInsets()

    const safeAreaStyle = {
        paddingTop: edges.includes('top') ? insets.top : 0,
        paddingBottom: edges.includes('bottom') ? insets.bottom + extraBottomPadding : extraBottomPadding, 
        paddingLeft: edges.includes('left') ? insets.left : 0, 
        paddingRight: edges.includes('right') ? insets.right : 0 
    }

    const ContentWrapper = scrollable ? ScrollView : View 

    const baseContentStyle = [
        styles.content,
        centered && styles.centered, 
        safeAreaStyle, 
        contentContainerStyle
    ]

    // If keyboard avoidance is enabled, wrap with KeyboardAvoidingView
    if(keyboardAvoiding) {
        return (
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.container, style]}
            >
                <ContentWrapper
                    contentContainerStyle={scrollable ? baseContentStyle : undefined}
                    style={scrollable ? styles.scrollView : baseContentStyle}
                    showsVerticalScrollIndicator={showsVerticalScrollIndicator}
                    {...props}
                >
                    {children}
                </ContentWrapper>
            </KeyboardAvoidingView>
        )
    }

    // Without keyboard avoidance
    return (
        <ContentWrapper
            contentContainerStyle={scrollable ? baseContentStyle : undefined}
            style={[styles.container, scrollable ? styles.scrollView : baseContentStyle, style]} // ✅ Added style prop
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            {...props}
        >
            {children}
        </ContentWrapper>
    )
}

export default ThemedSafeArea

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        backgroundColor: COLORS.background
    },
    scrollView: {
        flex: 1,
        padding: 20
    },
    content: {
        flexGrow: 1, 
        padding: 20
    },
    centered: {
        justifyContent: 'center'
    }
})