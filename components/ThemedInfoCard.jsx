import { StyleSheet, View, Text } from 'react-native'

import Colors, { COLORS } from '../constants/Colors'

const ThemedInfoCard = ({ sectionTitle, children, style }) => {
    return(
        <View style={[styles.section, style]}>
            {sectionTitle && (
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
            )}
            {children}
        </View>
    )
}

export default ThemedInfoCard

const styles = StyleSheet.create({
    section: {
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: COLORS.text},
})