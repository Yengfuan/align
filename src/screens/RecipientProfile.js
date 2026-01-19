//recipientprofile.js

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Colors, TextStyles, ContainerStyles, Shadows, BorderRadius } from '../styles/CommonStyles';

export default function RecipientProfile({ route }) {
  const { recipient } = route.params;

  // Profile data - basic info comes from Supabase care_recipients table
  // TODO: In production, create a 'care_recipient_profiles' table in Supabase
  // to store detailed profile information like preferences, medical history, etc.
  const profileData = {
    basicInfo: {
      age: recipient.age,
      room: recipient.room,
      preferredAddress: 'Uncle Tan',
      dateOfBirth: 'March 15, 1950',
    },
    carePreferences: {
      routineTimes: {
        wakeUp: '7:00 AM',
        breakfast: '8:00 AM',
        lunch: '12:30 PM',
        dinner: '6:00 PM',
        bedtime: '9:30 PM',
      },
      privacyBoundaries: [
        'Prefers privacy during bathing',
        'Knock before entering room',
        'Keeps bedroom door closed',
      ],
      foodPreferences: [
        'Allergic to shellfish',
        'Prefers soft foods',
        'Enjoys tea with meals',
        'Low sodium diet',
      ],
      medications: [
        'Blood pressure medication - 8:00 AM daily',
        'Vitamin D supplement - with breakfast',
        'Pain relief - as needed',
      ],
    },
    communicationStyle: {
      speechPace: 'Speaks slowly',
      instructions: 'Prefers short, clear instructions',
      visualCues: 'Benefits from visual demonstrations',
      physicalComfort: 'Comfortable with light touch on shoulder',
      hearingStatus: 'Mild hearing loss in left ear',
    },
    supportNeeds: {
      mobility: [
        'Uses walker for longer distances',
        'Needs assistance with stairs',
        'Can walk short distances independently',
      ],
      sensory: [
        'Wears reading glasses',
        'Hearing aid in right ear',
        'Prefers well-lit spaces',
      ],
      memory: [
        'Benefits from written reminders',
        'Calendar visible in room',
        'Occasional confusion about dates',
      ],
    },
    safetyNotes: {
      fallRisk: 'Moderate - use of walker reduces risk',
      allergies: [
        'Shellfish - severe reaction',
        'Penicillin - mild rash',
      ],
      emergencyContact: {
        name: 'Sarah Tan (Daughter)',
        phone: '+65 9123 4567',
        relationship: 'Daughter',
      },
      medicalConditions: [
        'Hypertension (controlled)',
        'Mild arthritis',
        'Type 2 Diabetes',
      ],
    },
    whatMatters: {
      hobbies: [
        'Listening to classical music',
        'Reading newspapers',
        'Watching nature documentaries',
        'Playing cards',
      ],
      favoriteTopics: [
        'Stories about grandchildren',
        'Garden and plants',
        'History and current events',
        'Family traditions',
      ],
      comfort: [
        'Soft blanket during rest time',
        'Window view of garden',
        'Photos of family nearby',
        'Quiet environment in mornings',
      ],
    },
    boundaries: {
      avoidTopics: [
        'Loss of spouse (recent)',
        'Financial matters',
        'Discussing decline in health',
      ],
      independence: [
        'Prefers to dress independently',
        'Likes to choose own meals',
        'Values making own decisions',
        'Dislikes being rushed',
      ],
      sharingComfort: [
        'Comfortable sharing with regular caregivers',
        'Prefers female caregivers for personal care',
        'Open to sharing daily activities',
        'Private about medical details',
      ],
    },
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
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  const ListItem = ({ text, type = 'default' }) => (
    <View style={styles.listItem}>
      <View style={[styles.bullet, type === 'warning' && styles.bulletWarning]} />
      <Text style={[styles.listText, type === 'warning' && styles.listTextWarning]}>{text}</Text>
    </View>
  );

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
          <Text style={styles.profileName}>{recipient.name}</Text>
          <Text style={styles.profileSubtitle}>Complete Care Profile</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Info */}
        <Section title="Basic Information" icon="👤">
          <InfoRow label="Age" value={profileData.basicInfo.age} />
          <InfoRow label="Room" value={profileData.basicInfo.room} />
          <InfoRow label="Preferred Form of Address" value={profileData.basicInfo.preferredAddress} />
          <InfoRow label="Date of Birth" value={profileData.basicInfo.dateOfBirth} />
        </Section>

        {/* Care Preferences */}
        <Section title="Care Preferences" icon="⏰">
          <Text style={styles.subsectionTitle}>Routine Times</Text>
          <InfoRow label="Wake Up" value={profileData.carePreferences.routineTimes.wakeUp} />
          <InfoRow label="Breakfast" value={profileData.carePreferences.routineTimes.breakfast} />
          <InfoRow label="Lunch" value={profileData.carePreferences.routineTimes.lunch} />
          <InfoRow label="Dinner" value={profileData.carePreferences.routineTimes.dinner} />
          <InfoRow label="Bedtime" value={profileData.carePreferences.routineTimes.bedtime} />
          
          <Text style={styles.subsectionTitle}>Privacy Boundaries</Text>
          {profileData.carePreferences.privacyBoundaries.map((item, index) => (
            <ListItem key={index} text={item} />
          ))}
          
          <Text style={styles.subsectionTitle}>Food & Medication Preferences</Text>
          {profileData.carePreferences.foodPreferences.map((item, index) => (
            <ListItem key={index} text={item} />
          ))}
          
          <Text style={styles.subsectionTitle}>Medications</Text>
          {profileData.carePreferences.medications.map((item, index) => (
            <ListItem key={index} text={item} />
          ))}
        </Section>

        {/* Communication Style */}
        <Section title="Communication Style" icon="💬">
          <InfoRow label="Speech Pace" value={profileData.communicationStyle.speechPace} />
          <InfoRow label="Instructions" value={profileData.communicationStyle.instructions} />
          <InfoRow label="Visual Cues" value={profileData.communicationStyle.visualCues} />
          <InfoRow label="Physical Comfort" value={profileData.communicationStyle.physicalComfort} />
          <InfoRow label="Hearing Status" value={profileData.communicationStyle.hearingStatus} />
        </Section>

        {/* Support Needs */}
        <Section title="Support Needs" icon="🤝">
          <Text style={styles.subsectionTitle}>Mobility Support</Text>
          {profileData.supportNeeds.mobility.map((item, index) => (
            <ListItem key={index} text={item} />
          ))}
          
          <Text style={styles.subsectionTitle}>Hearing / Vision Support</Text>
          {profileData.supportNeeds.sensory.map((item, index) => (
            <ListItem key={index} text={item} />
          ))}
          
          <Text style={styles.subsectionTitle}>Memory Reminders</Text>
          {profileData.supportNeeds.memory.map((item, index) => (
            <ListItem key={index} text={item} />
          ))}
        </Section>

        {/* Safety Notes */}
        <Section title="Safety Notes" icon="⚠️">
          <InfoRow label="Fall Risk" value={profileData.safetyNotes.fallRisk} />
          
          <Text style={styles.subsectionTitle}>Allergies</Text>
          {profileData.safetyNotes.allergies.map((item, index) => (
            <ListItem key={index} text={item} type="warning" />
          ))}
          
          <Text style={styles.subsectionTitle}>Medical Conditions</Text>
          {profileData.safetyNotes.medicalConditions.map((item, index) => (
            <ListItem key={index} text={item} />
          ))}
          
          <View style={styles.emergencyCard}>
            <Text style={styles.emergencyTitle}>🚨 Emergency Contact</Text>
            <InfoRow label="Name" value={profileData.safetyNotes.emergencyContact.name} />
            <InfoRow label="Phone" value={profileData.safetyNotes.emergencyContact.phone} />
            <InfoRow label="Relationship" value={profileData.safetyNotes.emergencyContact.relationship} />
          </View>
        </Section>

        {/* What Matters to Me */}
        <Section title="What Matters to Me" icon="❤️">
          <Text style={styles.subsectionTitle}>Hobbies</Text>
          {profileData.whatMatters.hobbies.map((item, index) => (
            <ListItem key={index} text={item} />
          ))}
          
          <Text style={styles.subsectionTitle}>Favorite Topics</Text>
          {profileData.whatMatters.favoriteTopics.map((item, index) => (
            <ListItem key={index} text={item} />
          ))}
          
          <Text style={styles.subsectionTitle}>What Brings Comfort</Text>
          {profileData.whatMatters.comfort.map((item, index) => (
            <ListItem key={index} text={item} />
          ))}
        </Section>

        {/* Boundaries */}
        <Section title="Boundaries" icon="🛡️">
          <Text style={styles.subsectionTitle}>Topics I Don't Like to Discuss</Text>
          {profileData.boundaries.avoidTopics.map((item, index) => (
            <ListItem key={index} text={item} type="warning" />
          ))}
          
          <Text style={styles.subsectionTitle}>Things I Prefer to Do Myself</Text>
          {profileData.boundaries.independence.map((item, index) => (
            <ListItem key={index} text={item} />
          ))}
          
          <Text style={styles.subsectionTitle}>Who I'm Comfortable Sharing With</Text>
          {profileData.boundaries.sharingComfort.map((item, index) => (
            <ListItem key={index} text={item} />
          ))}
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