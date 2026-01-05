import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SPACING, RADIUS } from '../../constants/Colors'
import ThemedSafeArea from '../../components/ThemedSafeArea'

const LAST_UPDATED = 'November 29, 2025'
const APP_NAME = 'Smashing Wallets'
const COMPANY_NAME = 'Smashing Wallets'
const CONTACT_EMAIL = 'support@smashingwallets.com'

export default function TermsOfServiceScreen() {
    return (
        <ThemedSafeArea>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms of Service</Text>
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
                    <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                    <Text style={styles.paragraph}>
                        By downloading, installing, or using {APP_NAME} ("the App"), you agree to be bound by these Terms of Service ("Terms"). 
                        If you do not agree to these Terms, do not use the App.
                    </Text>
                </View>

                {/* Description of Service */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Description of Service</Text>
                    <Text style={styles.paragraph}>
                        {APP_NAME} is a mobile application that allows users to discover and post local events such as yard sales, garage sales, estate sales, 
                        farmers markets, and other community events. The App provides a platform for users to share event information; we do not organize, 
                        host, or guarantee any events listed.
                    </Text>
                </View>

                {/* User Accounts */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. User Accounts</Text>
                    <Text style={styles.paragraph}>
                        To use certain features of the App, you must create an account. You agree to:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Provide accurate and complete information when creating your account</Text>
                        <Text style={styles.bulletItem}>• Maintain the security of your password and account</Text>
                        <Text style={styles.bulletItem}>• Accept responsibility for all activities under your account</Text>
                        <Text style={styles.bulletItem}>• Notify us immediately of any unauthorized use</Text>
                    </View>
                    <Text style={styles.paragraph}>
                        You must be at least 13 years old to create an account. If you are under 18, you represent that you have parental consent.
                    </Text>
                </View>

                {/* User Content */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. User Content</Text>
                    <Text style={styles.paragraph}>
                        You are responsible for all content you post, including event listings, photos, and descriptions ("User Content"). By posting User Content, you represent that:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• You own or have rights to share the content</Text>
                        <Text style={styles.bulletItem}>• The content is accurate and not misleading</Text>
                        <Text style={styles.bulletItem}>• The content does not violate any laws or these Terms</Text>
                    </View>
                    <Text style={styles.paragraph}>
                        You grant {APP_NAME} a non-exclusive, royalty-free license to display your User Content within the App for the purpose of providing our service.
                    </Text>
                </View>

                {/* Prohibited Content */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Prohibited Content & Conduct</Text>
                    <Text style={styles.paragraph}>
                        You agree not to post content or engage in conduct that:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Is illegal, fraudulent, or promotes illegal activity</Text>
                        <Text style={styles.bulletItem}>• Is false, misleading, or deceptive</Text>
                        <Text style={styles.bulletItem}>• Infringes on intellectual property rights</Text>
                        <Text style={styles.bulletItem}>• Is harassing, threatening, or discriminatory</Text>
                        <Text style={styles.bulletItem}>• Contains malware, spam, or harmful code</Text>
                        <Text style={styles.bulletItem}>• Violates the privacy of others</Text>
                        <Text style={styles.bulletItem}>• Advertises prohibited items (weapons, drugs, stolen goods, etc.)</Text>
                    </View>
                    <Text style={styles.paragraph}>
                        We reserve the right to remove any content and suspend or terminate accounts that violate these Terms.
                    </Text>
                </View>

                {/* Disclaimer */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>6. Disclaimer of Warranties</Text>
                    <Text style={styles.paragraph}>
                        THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• The accuracy of event listings or user-provided information</Text>
                        <Text style={styles.bulletItem}>• That events will take place as described</Text>
                        <Text style={styles.bulletItem}>• The quality, safety, or legality of items at events</Text>
                        <Text style={styles.bulletItem}>• Uninterrupted or error-free service</Text>
                    </View>
                    <Text style={styles.paragraph}>
                        You use the App and attend events at your own risk. Always exercise caution when meeting strangers or making purchases.
                    </Text>
                </View>

                {/* Limitation of Liability */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
                    <Text style={styles.paragraph}>
                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, {COMPANY_NAME.toUpperCase()} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
                        CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE APP OR ATTENDANCE AT ANY EVENT DISCOVERED THROUGH THE APP.
                    </Text>
                    <Text style={styles.paragraph}>
                        We are not responsible for disputes between users or any transactions that occur at events.
                    </Text>
                </View>

                {/* Intellectual Property */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
                    <Text style={styles.paragraph}>
                        The App, including its design, features, and content (excluding User Content), is owned by {COMPANY_NAME} and protected by copyright and other laws. 
                        You may not copy, modify, distribute, or reverse engineer any part of the App without our written permission.
                    </Text>
                </View>

                {/* Termination */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>9. Termination</Text>
                    <Text style={styles.paragraph}>
                        We may suspend or terminate your account at any time for violation of these Terms or for any other reason at our discretion. 
                        You may also delete your account at any time through the App settings.
                    </Text>
                    <Text style={styles.paragraph}>
                        Upon termination, your right to use the App will immediately cease.
                    </Text>
                </View>

                {/* Changes to Terms */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
                    <Text style={styles.paragraph}>
                        We may update these Terms from time to time. We will notify you of significant changes by posting a notice in the App. 
                        Continued use of the App after changes constitutes acceptance of the new Terms.
                    </Text>
                </View>

                {/* Governing Law */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>11. Governing Law</Text>
                    <Text style={styles.paragraph}>
                        These Terms are governed by the laws of the State of Arizona, United States, without regard to conflict of law principles.
                    </Text>
                </View>

                {/* Contact */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>12. Contact Us</Text>
                    <Text style={styles.paragraph}>
                        If you have questions about these Terms, please contact us:
                    </Text>
                    <View style={styles.contactBox}>
                        <Text style={styles.contactLabel}>Email</Text>
                        <Text style={styles.contactValue}>{CONTACT_EMAIL}</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2025 {COMPANY_NAME}. All rights reserved.</Text>
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
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: SPACING.md,
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
    contactBox: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginTop: SPACING.md,
    },
    contactLabel: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    contactValue: {
        fontSize: 16,
        fontWeight: '500',
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