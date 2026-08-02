import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const FAQS = [
  {
    q: 'How do I book a ride?',
    a: 'Open the Home tab, search for a destination or pick one on the map, choose your vehicle type, and tap Confirm. We\'ll match you with a nearby driver along your route.',
  },
  {
    q: 'How is the fare calculated?',
    a: 'Fares are based on the estimated distance and duration of your trip. You\'ll see the estimated fare before you confirm your ride.',
  },
  {
    q: 'How do I track my driver?',
    a: 'Once your ride is confirmed, the Home tab shows your driver\'s live location and estimated arrival on the map.',
  },
  {
    q: 'Can I cancel a ride?',
    a: 'Yes. Open the active ride panel and tap Cancel. Please cancel before your driver arrives to avoid any inconvenience.',
  },
  {
    q: 'How do I use a saved place?',
    a: 'Save frequently used locations from the Saved Places screen on your dashboard. You can manage and delete them anytime.',
  },
  {
    q: 'My driver hasn\'t arrived. What should I do?',
    a: 'Try contacting the driver from the ride status panel. If the issue persists, please reach out to our support team below.',
  },
];

const CONTACT_ITEMS = [
  {
    icon: 'email-outline' as const,
    title: 'Email Support',
    desc: 'support@transitapp.com',
    color: '#3B82F6',
    action: () => Linking.openURL('mailto:support@transitapp.com'),
  },
  {
    icon: 'phone-outline' as const,
    title: 'Call Us',
    desc: '+91 98765 43210',
    color: '#10B981',
    action: () => Linking.openURL('tel:+919876543210'),
  },
  {
    icon: 'whatsapp' as const,
    title: 'WhatsApp',
    desc: 'Chat with our team',
    color: '#25D366',
    action: () => Linking.openURL('https://wa.me/919876543210'),
  },
];

export default function HelpSupportScreen() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Contact */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        {CONTACT_ITEMS.map((item) => (
          <TouchableOpacity key={item.title} style={styles.contactCard} onPress={item.action}>
            <View style={[styles.contactIcon, { backgroundColor: `${item.color}1A` }]}>
              <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{item.title}</Text>
              <Text style={styles.contactDesc}>{item.desc}</Text>
            </View>
            <MaterialCommunityIcons name="open-in-new" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}

        {/* FAQ */}
        <Text style={[styles.sectionTitle, styles.faqTitle]}>Frequently Asked Questions</Text>
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <View key={faq.q} style={styles.faqCard}>
              <TouchableOpacity
                style={styles.faqQuestionRow}
                onPress={() => setOpenIndex(isOpen ? null : index)}
              >
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <MaterialCommunityIcons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color="#6B7280"
                />
              </TouchableOpacity>
              {isOpen && <Text style={styles.faqAnswer}>{faq.a}</Text>}
            </View>
          );
        })}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Available 24/7 for any questions about your rides.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  faqTitle: {
    marginTop: 24,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  contactDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  faqCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  footer: {
    marginTop: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
