//recordingdetail.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { Colors, TextStyles, ButtonStyles, ContainerStyles, InputStyles, Shadows, BorderRadius } from '../styles/CommonStyles';
import api from '../services/api';

export default function RecordingDetail({ route }) {
  const { recording, shift, recipient, caregiver } = route.params;
  const [isPlaying, setIsPlaying] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sound, setSound] = useState(null);

  // Fetch notes from API when component mounts
  useEffect(() => {
    fetchNotes();

    // Cleanup function to unload sound when component unmounts
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      // Use uuid for Supabase queries
      const recordingId = recording.uuid || recording.id;
      const fetchedNotes = await api.getNotes(recordingId);
      setNotes(fetchedNotes);
    } catch (error) {
      Alert.alert('Error', 'Failed to load notes. Please check your connection.');
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    try {
      if (!recording.audio_url) {
        Alert.alert('Error', 'No audio file available for this recording');
        return;
      }

      if (isPlaying && sound) {
        // Pause the audio
        await sound.pauseAsync();
        setIsPlaying(false);
      } else if (sound) {
        // Resume playing
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        // Load and play the audio for the first time
        console.log('Loading audio from:', recording.audio_url);

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: recording.audio_url },
          { shouldPlay: true }
        );

        setSound(newSound);
        setIsPlaying(true);

        // Set up playback status update listener
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio. The recording may not be available.');
      setIsPlaying(false);
    }
  };

  const handleAddNote = async () => {
    if (newNote.trim() === '') {
      Alert.alert('Error', 'Please enter a note');
      return;
    }

    try {
      setSubmitting(true);
      const noteData = {
        caregiverId: caregiver.id,
        caregiverName: caregiver.name,
        content: newNote.trim(),
      };

      // Use uuid for Supabase
      const recordingId = recording.uuid || recording.id;
      const createdNote = await api.addNote(recordingId, noteData);
      setNotes([...notes, createdNote]);
      setNewNote('');
      Alert.alert('Success', 'Note added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add note. Please check your connection.');
      console.error('Error adding note:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.recipientName}>{recipient.name}</Text>
          <Text style={styles.timestamp}>
            {formatTime(recording.timestamp)}
          </Text>
        </View>

        <View style={styles.playerSection}>
          <View style={styles.playerCard}>
            <Text style={styles.durationText}>
              {formatDuration(recording.duration)}
            </Text>

            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPause}
              activeOpacity={0.7}
            >
              <Text style={styles.playButtonText}>
                {isPlaying ? '⏸' : '▶'}
              </Text>
            </TouchableOpacity>

            <View style={styles.waveform}>
              {isPlaying ? (
                <Text style={styles.playingText}>Playing...</Text>
              ) : (
                <Text style={styles.playingText}>Tap to play recording</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Notes</Text>

          <View style={styles.addNoteCard}>
            <TextInput
              style={styles.noteInput}
              placeholder="Add a new note for other caregivers..."
              value={newNote}
              onChangeText={setNewNote}
              multiline
              numberOfLines={3}
              editable={!submitting}
            />
            <TouchableOpacity
              style={[styles.addNoteButton, submitting && styles.addNoteButtonDisabled]}
              onPress={handleAddNote}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.addNoteButtonText}>Add Note</Text>
              )}
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A90E2" />
              <Text style={styles.loadingText}>Loading notes...</Text>
            </View>
          ) : notes.length > 0 ? (
            <View style={styles.notesList}>
              {notes.map((note) => (
                <View key={note.uuid || note.id} style={styles.noteCard}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteCaregiverName}>
                      {note.caregiver_name || note.caregiverName}
                    </Text>
                    <Text style={styles.noteTimestamp}>
                      {formatTime(note.created_at || note.timestamp)}
                    </Text>
                  </View>
                  <Text style={styles.noteContent}>{note.content}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyNotes}>
              <Text style={styles.emptyNotesText}>
                No notes yet. Be the first to add one!
              </Text>
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
  scrollContainer: {
    flex: 1,
  },
  header: {
    ...ContainerStyles.header,
  },
  recipientName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 5,
  },
  recordingInfo: {
    ...TextStyles.body,
    color: Colors.primary,
    marginBottom: 5,
  },
  timestamp: {
    ...TextStyles.small,
  },
  playerSection: {
    padding: 15,
  },
  playerCard: {
    ...ContainerStyles.card,
    padding: 25,
    alignItems: 'center',
  },
  durationText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 20,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Shadows.medium,
  },
  playButtonText: {
    fontSize: 36,
    color: Colors.white,
  },
  waveform: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.sm,
  },
  playingText: {
    ...TextStyles.small,
  },
  notesSection: {
    padding: 15,
  },
  sectionTitle: {
    ...TextStyles.h4,
    marginBottom: 15,
  },
  addNoteCard: {
    ...ContainerStyles.card,
    padding: 15,
    marginBottom: 15,
  },
  noteInput: {
    ...InputStyles.base,
    ...InputStyles.multiline,
    minHeight: 80,
    marginBottom: 12,
  },
  addNoteButton: {
    ...ButtonStyles.base,
    backgroundColor: Colors.primary,
  },
  addNoteButtonDisabled: {
    ...ButtonStyles.disabled,
  },
  addNoteButtonText: {
    ...TextStyles.buttonText,
  },
  loadingContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: 40,
    alignItems: 'center',
    marginTop: 10,
  },
  loadingText: {
    ...TextStyles.body,
    color: Colors.textLight,
    marginTop: 15,
  },
  notesList: {
    marginTop: 10,
  },
  noteCard: {
    ...ContainerStyles.card,
    padding: 15,
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  noteCaregiverName: {
    ...TextStyles.body,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  noteTimestamp: {
    ...TextStyles.caption,
  },
  noteContent: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  emptyNotes: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyNotesText: {
    ...TextStyles.body,
    color: Colors.textLight,
    textAlign: 'center',
  },
});