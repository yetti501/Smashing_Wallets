import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import Colors, { COLORS } from '../constants/Colors'

const ThemedInfoContent = ({ infoLabel, infoValue, hasEdit, onPress, ...props }) => {
    return (
            <View>
                <View style={styles.infoRow}>
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>{infoLabel}</Text>
                        <Text style={styles.infoValue}>{infoValue}</Text>
                    </View>
                
                    {hasEdit && (
                        <TouchableOpacity onPress={onPress}>
                            <Ionicons 
                                name="create-outline" 
                                size={20} 
                                color={COLORS.buttonPrimary} 
                            />
                        </TouchableOpacity>
                    )}
                    </View>
            </View>
        )
}

export default ThemedInfoContent

const styles = StyleSheet.create({
    infoContent: {
        flex: 1
    },
    infoLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '500',
        marginBottom: 4
    },
    infoValue: {
        fontSize: 16, 
        color: COLORS.text,
        fontWeight: '500'
    },
    infoRow:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border
    },
})