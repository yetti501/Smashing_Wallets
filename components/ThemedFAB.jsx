import { StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SPACING } from '../constants/Colors'

/**
 * ThemedFAB - Reusable Floating Action Button
 * 
 * @param {string} icon - Ionicon name(default: 'add')
 * @param {string} function - onPress - Press handler
 * @param {string} number - size - Button size (defualt: 60)
 * @param {string} number - iconSize - Icon size (defualt: 28)
 * @param {string} backgroundColor - Custom backgroun color
 * @param {string} iconColor - Custom icon colo
 * @param {object} style - Custom style
 * @param {string} position - 'bottom-right' or 'bottom-left' or 'bottom-center'
 */

const ThemedFAB = ({
    icon='add', 
    onPress, 
    size = 60, 
    iconSize = 28,
    backgroundColor = COLORS.primary,
    iconColor = COLORS.buttonPrimaryText,
    style, 
    position = 'bottom-right'
}) => {
    const positionStyle = getPositionStyle(position)

    return (
        <TouchableOpacity
            style={[
                styles.fab, 
                positionStyle, 
                {
                    width: size, 
                    height: size, 
                    borderRadius: size / 2, 
                    backgroundColor
                },
                style
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Ionicons name={icon} size={iconSize} color={iconColor} />
        </TouchableOpacity>
    )
}

const getPositionStyle = (position) => {
    switch (position) {
        case 'bottom-left':
            return { left: SPACING.lg }
        case 'bottom-center':
            return { left: '50%', marginLeft: -30 }
        case 'bottom-right':
            return { right: SPACING.lg }
    }
}

export default ThemedFAB

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: SPACING.xl,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    }
})