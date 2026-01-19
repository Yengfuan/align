//shift details
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import api from '../services/api';
import ShiftAIAnalysis from '../components/ShiftAIAnalysis';
import { Colors, TextStyles, ButtonStyles, ContainerStyles, InputStyles, Shadows, BorderRadius } from '../styles/CommonStyles';

export default function ShiftDetail({ route, navigation }) {
  const { shift, recipient, caregiver } = route.params;

  // Recordings state - fetch from backend
  const [shiftRecordings, setShiftRecordings] = useState([]);
  const [loadingRecordings, setLoadingRecordings] = useState(true);

  // Shift content/notes state (stored in shift.content field)
  const [shiftContent, setShiftContent] = useState(shift.content || '');
  const [editingContent, setEditingContent] = useState(false);
  const [newContent, setNewContent] = useState(shift.content || '');
  const [submitting, setSubmitting] = useState(false);

  // Fetch recordings when component mounts
  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      setLoadingRecordings(true);
      // Fetch all recordings for this care recipient on this date
      const allRecordings = await api.getRecordings(recipient.id);

      // Filter recordings that match this shift's date
      const dateRecordings = allRecordings.filter(r => r.date === shift.date);

      // Fetch notes for each recording
      const recordingsWithNotes = await Promise.all(
        dateRecordings.map(async (recording) => {
          try {
            const notes = await api.getNotes(recording.uuid);
            return {
              ...recording,
              id: recording.uuid,
              timestamp: recording.created_at,
              notes: notes || [],
            };
          } catch (error) {
            console.error(`Error fetching notes for recording ${recording.uuid}:`, error);
            return {
              ...recording,
              id: recording.uuid,
              timestamp: recording.created_at,
              notes: [],
            };
          }
        })
      );
      setShiftRecordings(recordingsWithNotes);
    } catch (error) {
      console.error('Error fetching recordings:', error);
      setShiftRecordings([]);
    } finally {
      setLoadingRecordings(false);
    }
  };

  const handleUpdateContent = async () => {
    if (newContent.trim() === shiftContent.trim()) {
      setEditingContent(false);
      return;
    }

    try {
      setSubmitting(true);
      const shiftId = shift.uuid || shift.id;
      await api.updateShiftContent(shiftId, newContent.trim());
      setShiftContent(newContent.trim());
      setEditingContent(false);
      Alert.alert('Success', 'Shift notes updated successfully');
    } catch (error) {
      console.error('Error updating shift content:', error);
      Alert.alert('Error', 'Failed to update notes');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordingPress = (recording) => {
    navigation.navigate('RecordingDetail', {
      recording,
      shift,
      recipient,
      caregiver,
    });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.shiftTitle}>
          {shift.shiftNumber || shift.shift_no ? `Shift ${shift.shiftNumber || shift.shift_no}` : 'Shift Details'}
        </Text>
        <Text style={styles.recipientName}>{recipient.name}</Text>
        <Text style={styles.dateText}>
          {new Date(shift.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        {/* Shift Notes Section */}
        <View style={styles.notesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shift Notes</Text>
            {!editingContent && (
              <TouchableOpacity onPress={() => setEditingContent(true)}>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {editingContent ? (
            <View style={styles.addNoteCard}>
              <TextInput
                style={styles.noteInput}
                placeholder="Add notes about this shift (e.g., patient mood, activities, concerns)..."
                value={newContent}
                onChangeText={setNewContent}
                multiline
                numberOfLines={6}
                editable={!submitting}
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setNewContent(shiftContent);
                    setEditingContent(false);
                  }}
                  disabled={submitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
                  onPress={handleUpdateContent}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : shiftContent ? (
            <View style={styles.contentCard}>
              <Text style={styles.contentText}>{shiftContent}</Text>
            </View>
          ) : (
            <View style={styles.emptyNotesContainer}>
              <Text style={styles.emptyNotesText}>No shift notes yet</Text>
              <TouchableOpacity
                style={styles.addFirstNoteButton}
                onPress={() => setEditingContent(true)}
              >
                <Text style={styles.addFirstNoteText}>+ Add Notes</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* AI Analysis Section */}
        <View style={styles.aiAnalysisSection}>
          {/* <ShiftAIAnalysis
            shiftId={shift.uuid || shift.id}
            careRecipientName={recipient.name}
          /> */}
          <Text>Hello</Text>
        </View>

        {/* Recordings Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recordings</Text>
          <Text style={styles.recordingCount}>
            {shiftRecordings.length} total
          </Text>
        </View>

        <View style={styles.listContainer}>
        {loadingRecordings ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Loading recordings...</Text>
          </View>
        ) : shiftRecordings.map((recording, index) => (
          <TouchableOpacity
            key={recording.uuid || recording.id}
            style={styles.recordingCard}
            onPress={() => handleRecordingPress(recording)}
            activeOpacity={0.7}
          >
            <View style={styles.recordingHeader}>
              <View style={styles.recordingNumber}>
                <Text style={styles.recordingNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.recordingInfo}>
                <Text style={styles.timeText}>
                  {formatTime(recording.created_at || recording.timestamp)}
                </Text>
                <Text style={styles.durationText}>
                  Duration: {formatDuration(recording.duration)}
                </Text>
              </View>
              <View style={styles.recordingMeta}>
                {recording.notes && recording.notes.length > 0 && (
                  <View style={styles.notesBadge}>
                    <Text style={styles.notesBadgeText}>
                      {recording.notes.length} note{recording.notes.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
                <Text style={styles.arrow}>›</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {!loadingRecordings && shiftRecordings.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recordings for this shift</Text>
          </View>
        )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...ContainerStyles.screen,
    backgroundColor: Colors.gray100,
  },
  header: {
    ...ContainerStyles.header,
  },
  shiftTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 5,
  },
  recipientName: {
    ...TextStyles.h4,
    color: Colors.info,
    marginBottom: 5,
  },
  dateText: {
    ...TextStyles.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    ...TextStyles.h4,
  },
  editButton: {
    color: Colors.info,
    fontSize: 16,
    fontWeight: '600',
  },
  recordingCount: {
    ...TextStyles.small,
  },
  listContainer: {
    flex: 1,
    padding: 15,
  },
  recordingCard: {
    ...ContainerStyles.card,
    padding: 15,
    marginBottom: 12,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.info,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  recordingNumberText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  recordingInfo: {
    flex: 1,
  },
  timeText: {
    ...TextStyles.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  durationText: {
    ...TextStyles.small,
  },
  recordingMeta: {
    alignItems: 'flex-end',
  },
  notesBadge: {
    backgroundColor: '#E8F4F8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    marginBottom: 5,
  },
  notesBadgeText: {
    color: Colors.info,
    fontSize: 12,
    fontWeight: '600',
  },
  arrow: {
    fontSize: 24,
    color: Colors.gray400,
  },
  emptyState: {
    ...ContainerStyles.centered,
    paddingTop: 60,
  },
  emptyText: {
    ...TextStyles.body,
    color: Colors.textLight,
  },
  scrollContent: {
    flex: 1,
  },
  notesSection: {
    backgroundColor: Colors.gray50,
    paddingBottom: 20,
    marginBottom: 10,
  },
  addNoteCard: {
    ...ContainerStyles.card,
    marginHorizontal: 15,
    marginVertical: 10,
    padding: 15,
  },
  noteInput: {
    ...InputStyles.base,
    ...InputStyles.multiline,
    minHeight: 120,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray400,
  },
  cancelButtonText: {
    color: Colors.gray600,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    ...ButtonStyles.base,
    ...ButtonStyles.info,
    paddingHorizontal: 24,
  },
  saveButtonDisabled: {
    ...ButtonStyles.disabled,
  },
  saveButtonText: {
    ...TextStyles.buttonText,
  },
  contentCard: {
    ...ContainerStyles.card,
    marginHorizontal: 15,
    marginVertical: 10,
    padding: 15,
  },
  contentText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    ...TextStyles.small,
    marginTop: 10,
  },
  emptyNotesContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: BorderRadius.md,
    padding: 30,
    alignItems: 'center',
  },
  emptyNotesText: {
    ...TextStyles.small,
    textAlign: 'center',
    marginBottom: 12,
  },
  addFirstNoteButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.info,
    borderRadius: BorderRadius.md,
  },
  addFirstNoteText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  aiAnalysisSection: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    // backgroundColor: '#f5f5f5',
  },
});
