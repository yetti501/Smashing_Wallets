import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SPACING, RADIUS } from '../../constants/Colors'
import ThemedSafeArea from '../../components/ThemedSafeArea'

const LAST_UPDATED = 'April 16, 2026'
const APP_NAME = 'Smashing Wallets'
const COMPANY_NAME = 'Smashing Wallets'
const CONTACT_EMAIL = 'support@smashingwallets.com'

export default function PrivacyPolicyScreen() {
    return (
        <ThemedSafeArea>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView 
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.lastUpdated}>Last Updated: {LAST_UPDATED}</Text>

                {/* Introduction */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Introduction</Text>
                    <Text style={styles.paragraph}>
                        Welcome to {APP_NAME}! We respect your privacy and are committed to protecting your personal data. 
                        This privacy policy explains how we collect, use, and safeguard your information when you use our mobile application.
                    </Text>
                    <Text style={styles.paragraph}>
                        By using {APP_NAME}, you agree to the collection and use of information in accordance with this policy.
                    </Text>
                </View>

                {/* Information We Collect */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Information We Collect</Text>
                    
                    <Text style={styles.subheading}>Account Information</Text>
                    <Text style={styles.paragraph}>When you create an account, we collect:</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Email address</Text> — Used for account login, password resets, and important service updates</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Name</Text> — Displayed on your event listings (if you choose)</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Phone number</Text> (optional) — Only displayed on listings if you choose to share it</Text>
                    </View>

                    <Text style={styles.subheading}>Event Listing Information</Text>
                    <Text style={styles.paragraph}>When you create an event listing, we collect:</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Event details (title, description, date, time, price)</Text>
                        <Text style={styles.bulletItem}>• Location/address (used to display events on the map)</Text>
                        <Text style={styles.bulletItem}>• Contact information you choose to include</Text>
                        <Text style={styles.bulletItem}>• Photos you upload</Text>
                    </View>

                    <Text style={styles.subheading}>Automatically Collected Information</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Device location</Text> — Used to show nearby events (only when you grant permission)</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Device information</Text> — Basic device type and operating system for app functionality</Text>
                    </View>
                </View>

                {/* How We Use Your Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How We Use Your Information</Text>
                    <Text style={styles.paragraph}>We use your information to:</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Provide and maintain the {APP_NAME} service</Text>
                        <Text style={styles.bulletItem}>• Allow you to create and manage event listings</Text>
                        <Text style={styles.bulletItem}>• Display events on the map for other users to discover</Text>
                        <Text style={styles.bulletItem}>• Send transactional emails (password resets, account updates, important notifications)</Text>
                        <Text style={styles.bulletItem}>• Respond to your support requests</Text>
                        <Text style={styles.bulletItem}>• Improve and optimize our app</Text>
                    </View>
                </View>

                {/* Information Sharing */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Information Sharing</Text>
                    
                    <Text style={styles.subheading}>What We Share Publicly</Text>
                    <Text style={styles.paragraph}>
                        When you create an event listing, the following information may be visible to other {APP_NAME} users:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Event details (title, description, date, time, location)</Text>
                        <Text style={styles.bulletItem}>• Contact information <Text style={styles.bold}>only if you toggle it to "Visible"</Text> when creating a listing</Text>
                        <Text style={styles.bulletItem}>• Photos you upload to listings</Text>
                    </View>

                    <Text style={styles.subheading}>What We Never Share</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• We <Text style={styles.bold}>do not sell</Text> your personal data to third parties</Text>
                        <Text style={styles.bulletItem}>• We <Text style={styles.bold}>do not share</Text> your email address with other users (unless you include it on a listing)</Text>
                        <Text style={styles.bulletItem}>• We <Text style={styles.bold}>do not use</Text> your data for advertising purposes</Text>
                    </View>

                    <Text style={styles.subheading}>Service Providers</Text>
                    <Text style={styles.paragraph}>
                        We use trusted third-party services to operate {APP_NAME}:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Appwrite</Text> — Secure cloud database and authentication</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Google Maps</Text> — Map display and address validation</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Appwrite Email</Text> — Transactional email delivery (password resets, verification)</Text>
                    </View>
                    <Text style={styles.paragraph}>
                        These providers only access data necessary to perform their services and are bound by their own privacy policies.
                    </Text>
                </View>

                {/* Data Security */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Data Security</Text>
                    <Text style={styles.paragraph}>
                        We implement appropriate security measures to protect your personal information:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Encrypted data transmission (HTTPS/TLS)</Text>
                        <Text style={styles.bulletItem}>• Secure password hashing</Text>
                        <Text style={styles.bulletItem}>• Regular security updates</Text>
                    </View>
                    <Text style={styles.paragraph}>
                        However, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security.
                    </Text>
                </View>

                {/* Your Rights & Choices */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Rights & Choices</Text>
                    <Text style={styles.paragraph}>You have control over your data:</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Access & Update</Text> — View and edit your profile information anytime in the app</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Contact Visibility</Text> — Choose whether to show phone/email on each listing</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Delete Listings</Text> — Remove your event listings at any time</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Delete Account</Text> — Permanently delete your account and associated data from Settings</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Location Permission</Text> — Grant or revoke location access in your device settings</Text>
                    </View>
                </View>

                {/* Data Retention */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Data Retention</Text>
                    <Text style={styles.paragraph}>
                        We retain your account information as long as your account is active. Event listings are retained until you delete them or they expire.
                    </Text>
                    <Text style={styles.paragraph}>
                        When you delete your account, we permanently remove your personal data within 30 days, except where we are legally required to retain it.
                    </Text>
                </View>

                {/* CCPA - California Privacy Rights */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>California Privacy Rights (CCPA)</Text>
                    <Text style={styles.paragraph}>
                        If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA):
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Right to Know</Text> — You can request details about what personal information we have collected about you, the categories of sources, the purpose for collection, and any third parties we share it with</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Right to Delete</Text> — You can request that we delete your personal information. You can do this directly in the app via Settings → Delete Account, or by emailing us</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Right to Opt-Out of Sale</Text> — We do not sell your personal information to third parties. No opt-out is necessary</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Right to Non-Discrimination</Text> — We will not discriminate against you for exercising any of your CCPA rights</Text>
                    </View>
                    <Text style={styles.paragraph}>
                        To exercise any of these rights, please contact us at {CONTACT_EMAIL}. We will respond to verifiable requests within 45 days.
                    </Text>
                    <Text style={styles.subheading}>Categories of Personal Information Collected</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Identifiers</Text> — Name, email address, phone number (optional), account ID</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Geolocation data</Text> — Approximate device location (only with your permission)</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>User-generated content</Text> — Event listings, photos, and descriptions you create</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Internet activity</Text> — Basic usage data such as saved events and app preferences</Text>
                    </View>
                    <Text style={styles.paragraph}>
                        We do not collect sensitive personal information as defined by the CCPA, such as Social Security numbers, financial account details, or biometric data.
                    </Text>
                </View>

                {/* GDPR - European Privacy Rights */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>European Privacy Rights (GDPR)</Text>
                    <Text style={styles.paragraph}>
                        If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, you have additional rights under the General Data Protection Regulation (GDPR):
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Right of Access</Text> — You can request a copy of the personal data we hold about you</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Right to Rectification</Text> — You can request correction of inaccurate or incomplete data. You can also update most information directly in the app</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Right to Erasure</Text> — You can request deletion of your personal data. Use the Delete Account feature in Settings or contact us</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Right to Restrict Processing</Text> — You can request that we limit how we use your data in certain circumstances</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Right to Data Portability</Text> — You can request a copy of your data in a structured, machine-readable format</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Right to Object</Text> — You can object to our processing of your personal data in certain circumstances</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Right to Withdraw Consent</Text> — Where we rely on your consent, you can withdraw it at any time (e.g., revoking location permission in your device settings)</Text>
                    </View>

                    <Text style={styles.subheading}>Legal Basis for Processing</Text>
                    <Text style={styles.paragraph}>
                        We process your personal data based on the following legal grounds:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Contract performance</Text> — Processing necessary to provide you with the {APP_NAME} service (account management, event listings)</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Consent</Text> — Processing based on your explicit consent (location data, photos)</Text>
                        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Legitimate interests</Text> — Processing necessary for our legitimate business interests (security, service improvement), balanced against your rights</Text>
                    </View>

                    <Text style={styles.subheading}>International Data Transfers</Text>
                    <Text style={styles.paragraph}>
                        Your data may be transferred to and processed in the United States, where our servers are located. We ensure appropriate safeguards are in place for international transfers in accordance with applicable data protection laws.
                    </Text>
                    <Text style={styles.paragraph}>
                        To exercise any of these rights, please contact us at {CONTACT_EMAIL}. We will respond within 30 days. If you are unsatisfied with our response, you have the right to lodge a complaint with your local data protection authority.
                    </Text>
                </View>

                {/* Children's Privacy */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Children's Privacy</Text>
                    <Text style={styles.paragraph}>
                        {APP_NAME} is intended for users who are 18 years of age or older. We do not knowingly collect personal information from anyone under 18.
                        If you believe we have collected data from someone under 18, please contact us immediately and we will promptly delete that information.
                    </Text>
                </View>

                {/* Changes to This Policy */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Changes to This Policy</Text>
                    <Text style={styles.paragraph}>
                        We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy in the app and updating the "Last Updated" date.
                    </Text>
                    <Text style={styles.paragraph}>
                        Continued use of {APP_NAME} after changes constitutes acceptance of the updated policy.
                    </Text>
                </View>

                {/* Contact Us */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Us</Text>
                    <Text style={styles.paragraph}>
                        If you have questions about this privacy policy or your data, please contact us:
                    </Text>
                    <TouchableOpacity
                        style={styles.contactCard}
                        onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=Smashing Wallets Privacy Policy Question`)}
                    >
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

                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2025–2026 {COMPANY_NAME}. All rights reserved.</Text>
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
    lastUpdated: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: SPACING.lg,
        fontStyle: 'italic',
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
    subheading: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: SPACING.md,
        marginBottom: SPACING.sm,
    },
    paragraph: {
        fontSize: 15,
        lineHeight: 22,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },
    bulletList: {
        marginLeft: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    bulletItem: {
        fontSize: 15,
        lineHeight: 24,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
    },
    bold: {
        fontWeight: '600',
        color: COLORS.text,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginTop: SPACING.md,
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
    footer: {
        alignItems: 'center',
        paddingTop: SPACING.xl,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        marginTop: SPACING.lg,
    },
    footerText: {
        fontSize: 13,
        color: COLORS.textTertiary,
    },
})