import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, FlatList, ActivityIndicator } from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import {createNote } from '../../lib/database' /* This is where you are going to call the rest of the functions for interacting with the various components */


import ThemedText from '../../components/ThemedText'

const textInput = () => {
    return(
        <View>
            <ThemedText
                inputText="This is a test"
            />
        </View>
    )
}

export default textInput 

const styles = StyleSheet.create({})