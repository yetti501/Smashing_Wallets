import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'

const AuthLayoutNav = () => {
    const { user, loading } = useAuth()
    const segments = useSegments()
    const router = useRouter()

    useEffect(() => {
        if (loading) return 

        const inAuthGroup = segments[0] ==='(auth)'

        if(!user && inAuthGroup) {
            if(segments[1] !== 'login' && segments[1] !== 'register' && segments[1] !== 'forgot') {
                router.replace('/login')
            } 
        } else if(user && inAuthGroup) {
                if (segments[1] !== 'profile'){
                    router.replace('/profile')
                }
            }
        }, [user, loading, segments])

    return (
        <>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="profile" />
                <Stack.Screen name="login" />
                <Stack.Screen name="register" />
                <Stack.Screen name="forgot" />
            </Stack>
        </>
    )
}

const AuthLayout = () => {
    return (
        <AuthProvider>
            <AuthLayoutNav />
        </AuthProvider>
    )
}

export default AuthLayout

const styles = StyleSheet.create({})