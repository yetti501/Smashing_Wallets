
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {useState } from 'react'
import COLORS from '../constants/Colors'

const ThemedTextInput = ({
    label,
    placeholder,
    value,
    onChangeText,
    error,
    keyboardType = 'default',
    autoCapitalize = 'none',
    autoComplete,
    editable = true,
    secureTextEntry = false,
    containerStyle,
    inputStyle,
    isPassword = false,
    hint,
    ...props
}) => {

    const [ showPassword, setShowPassword ] = useState(false)

    if(isPassword){
        return(
        <View style={styles.inputContainer}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.passwordContainer}>
                <TextInput
                    style={[styles.passwordInput, error && styles.inputError, inputStyle]}
                    placeholder={placeholder}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={!showPassword}
                    autoCapitalize={autoCapitalize}
                    autoComplete={autoComplete}
                    editable={editable}
                    placeholderTextColor='#6c757d'
                    {...props}
                />
                <TouchableOpacity
                    style={ styles.eyeIcon }
                    onPress={() => setShowPassword(!showPassword)}
                >
                    <Ionicons 
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={24}
                        color='#6c757d'
                    />
                </TouchableOpacity>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Text style={styles.hintText}>
                {hint}
            </Text>
        </View>
        )
    } else {
        return (
        <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
            style={[styles.input, error && styles.inputError, inputStyle]}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            editable={editable}
            secureTextEntry={secureTextEntry}
            placeholderTextColor='#6c757d'
            {...props}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
        { hint && (
            <Text style={styles.hintText}>
                {hint}
            </Text>
        )}
        </View>
        )
    }  
}

export default ThemedTextInput

const styles = StyleSheet.create({
    inputContainer: {
        marginBottom: 10,
    }, 
    passwordContainer: {
        position: 'relative'
    },
    label: {
        fontSize: 16, 
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 5
    },
    input: {
        borderWidth: 1, 
        borderColor: COLORS.border,
        borderRadius: 8, 
        paddingHorizontal: 16, 
        paddingVertical: 14, 
        fontSize: 16, 
        backgroundColor: COLORS.background,
        color: COLORS.text
    },
    passwordInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: 16, 
        paddingVertical: 14, 
        paddingRight: 50, 
        fontsize: 16, 
        backgroundColor: COLORS.background,
        color: COLORS.text
    },
    inputError: {
        borderColor: COLORS.primaryDark,
        backgroundColor: COLORS.background
    },
    errorText: {
        color: COLORS.primaryDark,
        fontSize: 14, 
        marginTop: 4
    },
    eyeIcon: {
        position: 'absolute',
        right: 16, 
        top: 14
    },
    hintText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
        lineHeight: 16,
    },
})
