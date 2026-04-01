import { useState } from 'react'
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SPACING, RADIUS } from '../../constants/Colors'
import ThemedSafeArea from '../../components/ThemedSafeArea'

const APP_NAME = 'Smashing Wallets'
const CONTACT_EMAIL = 'support@smashingwallets.com'
const APP_VERSION = '1.0.0'

const FAQ_ITEMS = [
    {
        question: 'How do I create an event listing?',
        answer: 'Tap the "Listings" tab at the bottom of the screen, then tap the "+" button to create a new event. Fill in your event details like title, description, date, time, location, and optionally add photos.'
    },
    {
        question: 'How do I find events near me?',
        answer: 'Open the "Map" tab to see events plotted on a map near your location. Make sure you have granted location permission so the app can show events in your area.'
    },
    {
        question: 'Can I edit or delete my event after posting?',
        answer: 'Yes! Go to the "Listings" tab, find your event, and tap on it to view the details. From there you can edit or delete the listing.'
    },
    {
        question: 'How do I change my password?',
        answer: 'Go to your Profile tab, scroll down to Settings, and tap "Change Password". You\'ll need to enter your current password and then your new one.'
    },
    {
        question: 'I forgot my password. How do I reset it?',
        answer: 'On the login screen, tap "Reset Password". Enter the email address associated with your account and we\'ll send you a link to create a new password.'
    },
    {
        question: 'How do I add photos to my listing?',
        answer: 'When creating or editing a listing, you\'ll see an "Add Photo" button. Tap it to select images from your photo library. You can add up to 5 photos per listing.'
    },
    {
        question: 'How do I change the distance unit (miles/km)?',
        answer: 'Go to your Profile tab and look for "Distance Unit" under Account Information. Tap the toggle to switch between miles and kilometers.'
    },
    {
        question: 'How do I delete my account?',
        answer: 'Go to your Profile tab, scroll down to Settings, and tap "Delete Account". You\'ll need to confirm by typing DELETE. This action is permanent and cannot be undone.'
    },
    {
        question: 'Why can\'t I see events on the map?',
        answer: 'Make sure you have granted location permission to the app. You can check this in your device\'s Settings > Privacy > Location Services. Also ensure you have an active internet connection.'
    },
    {
        question: 'Is the app free to use?',
        answer: 'Yes! Smashing Wallets is completely free to use. You can browse events, create listings, and save events at no cost.'
    },
]

function FAQItem({ question, answer }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <TouchableOpacity
            style={styles.faqItem}
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.7}
        >
            <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{question}</Text>
                <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={COLORS.textSecondary}
                />
            </View>
            {expanded && (
                <Text style={styles.faqAnswer}>{answer}</Text>
            )}
        </TouchableOpacity>
    )
}

export default function HelpSupportScreen() {
    const handleEmailSupport = () => {
        Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=Smashing Wallets Support Request`)
    }

    return (
        <ThemedSafeArea>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Contact Support */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Us</Text>
                    <Text style={styles.paragraph}>
                        Have a question or running into an issue? Reach out and we'll get back to you as soon as we can.
                    </Text>
                    <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport}>
                        <View style={styles.contactIconContainer}>
                            <Ionicons name="mail-outline" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactTitle}>Email Support</Text>
                            <Text style={styles.contactValue}>{CONTACT_EMAIL}</Text>
                        </View>
                        <Ionicons name="open-outline" size={18} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                </View>

                {/* FAQ */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                    <View style={styles.faqList}>
                        {FAQ_ITEMS.map((item, index) => (
                            <FAQItem
                                key={index}
                                question={item.question}
                                answer={item.answer}
                            />
                        ))}
                    </View>
                </View>

                {/* Quick Links */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Links</Text>
                    <TouchableOpacity
                        style={styles.linkItem}
                        onPress={() => router.push('/termsOfService')}
                    >
                        <Ionicons name="document-text-outline" size={20} color={COLORS.text} />
                        <Text style={styles.linkText}>Terms of Service</Text>
                        <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.linkItem}
                        onPress={() => router.push('/privacyPolicy')}
                    >
                        <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.text} />
                        <Text style={styles.linkText}>Privacy Policy</Text>
                        <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                </View>

                {/* App Info */}
                <View style={styles.appInfoSection}>
                    <Text style={styles.appName}>{APP_NAME}</Text>
                    <Text style={styles.appVersion}>Version {APP_VERSION}</Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </ThemedSafeArea>
    )
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: SPACING.sm,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: SPACING.lg,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    paragraph: {
        fontSize: 15,
        lineHeight: 22,
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
    },
    // Contact card
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    contactIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.surfaceSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    contactInfo: {
        flex: 1,
    },
    contactTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    contactValue: {
        fontSize: 14,
        color: COLORS.primary,
    },
    // FAQ
    faqList: {
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    faqItem: {
        backgroundColor: COLORS.surface,
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestion: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        flex: 1,
        marginRight: SPACING.sm,
    },
    faqAnswer: {
        fontSize: 14,
        lineHeight: 21,
        color: COLORS.textSecondary,
        marginTop: SPACING.md,
    },
    // Quick links
    linkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.sm,
        gap: SPACING.md,
    },
    linkText: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    // App info
    appInfoSection: {
        alignItems: 'center',
        paddingTop: SPACING.xl,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        marginTop: SPACING.lg,
    },
    appName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    appVersion: {
        fontSize: 13,
        color: COLORS.textTertiary,
    },
})