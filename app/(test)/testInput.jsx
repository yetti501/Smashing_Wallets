import { StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import React, { useState, useCallback } from 'react'
import MapView from 'react-native-maps'
import * as Location from 'expo-location'
import { useFocusEffect } from '@react-navigation/native'

const DEFAULT_LOCATION = {
    latitude: 33.4484,
    longitude: -112.0740,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15
}

const index = () => {

    const [currentRegion, setCurrentRegion] = useState(DEFAULT_LOCATION)
    const [isLoading, setIsLoading] = useState(true)
    const [debugMsg, setDebugMsg] = useState('Mounted')

    const getAndSetLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync()

        if (status !== 'granted') {
            setDebugMsg("Permission denied")
            setIsLoading(false)
            return
        }

        try {

            const lastKnown = await Location.getLastKnownPositionAsync()

            if (lastKnown) {
                setCurrentRegion({
                    latitude: lastKnown.coords.latitude,
                    longitude: lastKnown.coords.longitude,
                    latitudeDelta: 0.15,
                    longitudeDelta: 0.15
                })
                setIsLoading(false)
            }

            const location = await Promise.race([
                Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('GPS Timeout')), 10000)
                )
            ])

            setCurrentRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.15,
                longitudeDelta: 0.15
            })

            setDebugMsg(`Fresh GPS[${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}]`)
        } catch (error) {
            setDebugMsg(`Error: ${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            getAndSetLocation()
        }, [])
    )

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0000FF" />
                <Text>Loading...</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                // provider="google"
                region={currentRegion}
                showsUserLocation={true}
                followsUserLocation={true}
            />

            <View style={styles.debugOverlay}>
                <Text style={styles.debug}>{debugMsg}</Text>
            </View>
        </View>


    )
}

export default index

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    map: {
        ...StyleSheet.absoluteFillObject
    },
    debugOverlay: {
        position: 'absolute',
        top: 100,
        left: 20,
        backgroundColor: 'white',
        padding: 8,
        borderRadius: 4
    },
    debug: {
        fontSize: 12,
        color: 'red',
        fontWeight: 'bold'
    }
})