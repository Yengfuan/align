//recipientprofile.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Colors, TextStyles, ContainerStyles, Shadows, BorderRadius } from '../styles/CommonStyles';
import api from '../services/api';

export default function RecipientProfile({ route }) {
  const { recipient } = route.params;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [recipient.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCareRecipientProfile(recipient.id);
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Helper to format time from "HH:MM:SS" to "H:MM AM/PM"
  const formatTime = (timeStr) => {
    if (!timeStr) return 'Not set';
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const Section = ({ title, icon, children }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value || 'Not set'}</Text>
    </View>
  );

  const ListItem = ({ text, type = 'default' }) => (
    <View style={styles.listItem}>
      <View style={[styles.bullet, type === 'warning' && styles.bulletWarning]} />
      <Text style={[styles.listText, type === 'warning' && styles.listTextWarning]}>{text}</Text>
    </View>
  );

  const TextBlock = ({ text }) => (
    <View style={styles.textBlock}>
      <Text style={styles.textBlockContent}>{text || 'Not set'}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {recipient.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <Text style={styles.profileName}>{profile?.name || recipient.name}</Text>
          <Text style={styles.profileSubtitle}>Complete Care Profile</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Info */}
        <Section title="Basic Information" icon="&#128100;">
          <InfoRow label="Age" value={profile?.age} />
          <InfoRow label="Room" value={profile?.room} />
          <InfoRow label="Preferred Form of Address" value={profile?.preferred_form_of_address} />
          <InfoRow label="Date of Birth" value={formatDate(profile?.birthday)} />
        </Section>

        {/* Care Preferences */}
        <Section title="Care Preferences" icon="&#9200;">
          <Text style={styles.subsectionTitle}>Routine Times</Text>
          <InfoRow label="Wake Up" value={formatTime(profile?.wake_up)} />
          <InfoRow label="Breakfast" value={formatTime(profile?.breakfast)} />
          <InfoRow label="Lunch" value={formatTime(profile?.lunch)} />
          <InfoRow label="Dinner" value={formatTime(profile?.dinner)} />
          <InfoRow label="Bedtime" value={formatTime(profile?.bedtime)} />

          {profile?.privacy_boundaries && (
            <>
              <Text style={styles.subsectionTitle}>Privacy Boundaries</Text>
              <TextBlock text={profile.privacy_boundaries} />
            </>
          )}

          {profile?.food_preferences && (
            <>
              <Text style={styles.subsectionTitle}>Food Preferences</Text>
              <TextBlock text={profile.food_preferences} />
            </>
          )}

          {profile?.medication_preferences && (
            <>
              <Text style={styles.subsectionTitle}>Medication Preferences</Text>
              <TextBlock text={profile.medication_preferences} />
            </>
          )}
        </Section>

        {/* Communication Style */}
        <Section title="Communication Style" icon="&#128172;">
          <InfoRow label="Speech Pace" value={profile?.speech_pace} />
          <InfoRow label="Instructions" value={profile?.instructions} />
          <InfoRow label="Visual Cues" value={profile?.visual_cues} />
          <InfoRow label="Physical Comfort" value={profile?.physical_comfort} />
          <InfoRow label="Hearing Status" value={profile?.hearing_status} />
        </Section>

        {/* Support Needs */}
        <Section title="Support Needs" icon="&#129309;">
          {profile?.mobility_support && (
            <>
              <Text style={styles.subsectionTitle}>Mobility Support</Text>
              <TextBlock text={profile.mobility_support} />
            </>
          )}

          {profile?.["hearing_vision_support"] && (
            <>
              <Text style={styles.subsectionTitle}>Hearing / Vision Support</Text>
              <TextBlock text={profile["hearing_vision_support"]} />
            </>
          )}

          {profile?.memory_reminders && (
            <>
              <Text style={styles.subsectionTitle}>Memory Reminders</Text>
              <TextBlock text={profile.memory_reminders} />
            </>
          )}
        </Section>

        {/* Safety Notes */}
        <Section title="Safety Notes" icon="&#9888;&#65039;">
          <InfoRow label="Fall Risk" value={profile?.fall_risk} />

          {profile?.allergies && (
            <>
              <Text style={styles.subsectionTitle}>Allergies</Text>
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>{profile.allergies}</Text>
              </View>
            </>
          )}

          {profile?.medical_conditions && (
            <>
              <Text style={styles.subsectionTitle}>Medical Conditions</Text>
              <TextBlock text={profile.medical_conditions} />
            </>
          )}

          {(profile?.emergency_contact_name || profile?.emergency_contact_number) && (
            <View style={styles.emergencyCard}>
              <Text style={styles.emergencyTitle}>&#128680; Emergency Contact</Text>
              <InfoRow label="Name" value={profile.emergency_contact_name} />
              <InfoRow label="Phone" value={profile.emergency_contact_number} />
              <InfoRow label="Relationship" value={profile.emergency_contact_relationship} />
            </View>
          )}
        </Section>

        {/* What Matters to Me */}
        <Section title="What Matters to Me" icon="&#10084;&#65039;">
          {profile?.hobbies && (
            <>
              <Text style={styles.subsectionTitle}>Hobbies</Text>
              <TextBlock text={profile.hobbies} />
            </>
          )}

          {profile?.favourite_topics && (
            <>
              <Text style={styles.subsectionTitle}>Favorite Topics</Text>
              <TextBlock text={profile.favourite_topics} />
            </>
          )}
        </Section>

        {/* Boundaries */}
        <Section title="Boundaries" icon="&#128737;&#65039;">
          {profile?.sensitive_topics && (
            <>
              <Text style={styles.subsectionTitle}>Sensitive Topics</Text>
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>{profile.sensitive_topics}</Text>
              </View>
            </>
          )}

          {profile?.independence_preferences && (
            <>
              <Text style={styles.subsectionTitle}>Independence Preferences</Text>
              <TextBlock text={profile.independence_preferences} />
            </>
          )}
        </Section>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...ContainerStyles.screen,
    backgroundColor: Colors.gray50,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.gray600,
  },
  errorText: {
    fontSize: 16,
    color: Colors.danger,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  header: {
    ...ContainerStyles.headerRounded,
  },
  headerTop: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileName: {
    ...TextStyles.h2,
    marginBottom: 4,
  },
  profileSubtitle: {
    ...TextStyles.body,
    color: Colors.gray600,
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    margin: 20,
    marginBottom: 0,
    ...ContainerStyles.card,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: Colors.gray200,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  sectionContent: {
    gap: 8,
  },
  subsectionTitle: {
    ...TextStyles.body,
    fontWeight: 'bold',
    color: Colors.gray700,
    marginTop: 16,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray50,
  },
  infoLabel: {
    fontSize: 15,
    color: Colors.gray600,
    fontWeight: '600',
    width: 140,
  },
  infoValue: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    paddingLeft: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.info,
    marginTop: 7,
    marginRight: 10,
  },
  bulletWarning: {
    backgroundColor: Colors.danger,
  },
  listText: {
    fontSize: 15,
    color: Colors.gray700,
    flex: 1,
    lineHeight: 22,
  },
  listTextWarning: {
    color: Colors.danger,
    fontWeight: '600',
  },
  textBlock: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.md,
    padding: 12,
    marginTop: 4,
  },
  textBlockContent: {
    fontSize: 15,
    color: Colors.gray700,
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: '#fff5f5',
    borderRadius: BorderRadius.md,
    padding: 12,
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  warningText: {
    fontSize: 15,
    color: Colors.danger,
    lineHeight: 22,
    fontWeight: '500',
  },
  emergencyCard: {
    backgroundColor: '#fff5f5',
    borderRadius: BorderRadius.md,
    padding: 16,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#ffcccc',
  },
  emergencyTitle: {
    ...TextStyles.h4,
    color: '#d32f2f',
    marginBottom: 12,
  },
  bottomSpacer: {
    height: 20,
  },
});
