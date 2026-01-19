import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  ScrollView,
  Image,
} from 'react-native';
import { Audio } from 'expo-av';
import api from '../services/api';

export default function CareRecipientHome({ route, navigation }) {
  const { user } = route.params;
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Fetch caregivers from Supabase
  const [caregivers, setCaregivers] = useState([]);
  const [excludedCaregivers, setExcludedCaregivers] = useState([]);

  // Load assigned caregivers on mount
  React.useEffect(() => {
    const fetchCaregivers = async () => {
      try {
        const assignments = await api.getAssignedCaregivers(user.id);
        const caregiverList = assignments
          .filter(a => a.caregivers)
          .map(a => ({ id: a.caregivers.id, name: a.caregivers.name }));
        setCaregivers(caregiverList);
      } catch (error) {
        console.error('Error fetching caregivers:', error);
      }
    };
    fetchCaregivers();
  }, [user.id]);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            // Clean up any active recordings or playback
            if (sound) {
              await sound.unloadAsync();
              setSound(null);
            }
            if (recording) {
              await recording.stopAndUnloadAsync();
              setRecording(null);
            }
            
            // Clear any intervals
            if (recording?._interval) {
              clearInterval(recording._interval);
            }
            
            // Here you would also clear any authentication tokens, user session, etc.
            // For example:
            // await AsyncStorage.removeItem('userToken');
            // await AsyncStorage.removeItem('userData');
            
            // Navigate back to login screen
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }], // Replace 'Login' with your actual login screen name
            });
          },
        },
      ]
    );
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        setRecording(recording);
        setIsRecording(true);
        setHasRecording(false);
        setRecordingDuration(0);
        startPulse();

        // Track recording duration
        const interval = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
        recording._interval = interval;
      } else {
        Alert.alert('Permission Denied', 'Microphone permission is required to record audio.');
      }
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      stopPulse();

      // Clear interval
      if (recording._interval) {
        clearInterval(recording._interval);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setHasRecording(true);
      setRecording(null);

      Alert.alert('Recording Saved', 'Review your recording below.');
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const handleRecordButton = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handlePlayback = async () => {
    try {
      if (isPlaying && sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: recordingUri },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (err) {
      console.error('Failed to play recording', err);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const handleUpload = async () => {
    try {
      // Get today's date
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Create the recording in Supabase
      const recordingData = {
        care_recipient_id: user.id,
        duration: recordingDuration,
        audio_url: recordingUri, // In production, upload to cloud storage first
        date: todayString,
      };

      console.log('[CareRecipientHome] Creating recording:', recordingData);
      const createdRecording = await api.createRecording(recordingData);
      console.log('[CareRecipientHome] Recording created:', createdRecording);

      // Set recording access for each caregiver
      if (excludedCaregivers.length > 0 && createdRecording.uuid) {
        // For excluded caregivers, set has_access to false
        for (const caregiverId of excludedCaregivers) {
          await api.setRecordingAccess(createdRecording.uuid, caregiverId, false);
        }
        // For included caregivers, set has_access to true
        const includedCaregivers = caregivers.filter(c => !excludedCaregivers.includes(c.id));
        for (const caregiver of includedCaregivers) {
          await api.setRecordingAccess(createdRecording.uuid, caregiver.id, true);
        }
      }

      let message = 'Recording uploaded successfully!';
      if (excludedCaregivers.length > 0) {
        message += ` Hidden from: ${caregivers.filter(c => excludedCaregivers.includes(c.id)).map(c => c.name).join(', ')}`;
      }

      Alert.alert('Success', message);

      // Clean up
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      setHasRecording(false);
      setRecordingUri(null);
      setRecordingDuration(0);
      setExcludedCaregivers([]);
    } catch (error) {
      console.error('[CareRecipientHome] Upload failed:', error);
      Alert.alert('Error', 'Failed to upload recording. Please try again.');
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (sound) {
              await sound.unloadAsync();
              setSound(null);
            }
            setHasRecording(false);
            setRecordingUri(null);
            setRecordingDuration(0);
            setExcludedCaregivers([]);
            Alert.alert('Deleted', 'Recording has been deleted');
          }
        },
      ]
    );
  };

  const handleRecordAgain = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    setHasRecording(false);
    setRecordingUri(null);
    setRecordingDuration(0);
    setExcludedCaregivers([]);
    startRecording();
  };

  const toggleCaregiverExclusion = (caregiverId) => {
    if (excludedCaregivers.includes(caregiverId)) {
      setExcludedCaregivers(excludedCaregivers.filter(id => id !== caregiverId));
    } else {
      setExcludedCaregivers([...excludedCaregivers, caregiverId]);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.WelcomeText}>Welcome back,</Text>
              <Text style={styles.nameText}>{user.name}</Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Record/Stop Button */}
        {!hasRecording && (
          <View style={styles.recordingContainer}>
            <View style={styles.durationPlaceholder}>
              {isRecording && (
                <Text style={styles.durationTextAbove}>{formatDuration(recordingDuration)}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.recordButton}
              onPress={handleRecordButton}
            >
              <Animated.View
                style={[
                  styles.recordButtonInner,
                  isRecording && styles.recordingActive,
                  { transform: [{ scale: isRecording ? pulseAnim : 1 }] },
                ]}
              >
                {!isRecording && (
                  <Image
                    source={require('../../assets/mic.png')}
                    style={styles.micImage}
                    resizeMode="contain"
                  />
                )}
                {isRecording && (
                  <View
                    style={[
                      styles.recordIcon,
                      styles.recordIconStop,
                    ]}
                  />
                )}
              </Animated.View>
            </TouchableOpacity>
            {!isRecording && (
              <Text style={styles.instructionText}>Tap to record a voice message</Text>
            )}
            {isRecording && (
              <Text style={styles.instructionText}>Recording... Tap to stop</Text>
            )}
          </View>
        )}

        {/* Review instruction for playback */}
        {hasRecording && (
          <View style={styles.reviewInstructionContainer}>
            <Text style={styles.instructionText}>Review your recording</Text>
          </View>
        )}

        {/* Playback Section */}
        {hasRecording && (
          <View style={styles.playbackSection}>
            <View style={styles.playbackCard}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={handlePlayback}
              >
                {isPlaying ? (
                  <Image
                    source={require('../../assets/playing.png')}
                    style={styles.playButtonImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.playButtonText}>▶</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.playbackText}>
                {isPlaying ? 'Playing...' : 'Tap to play'}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.uploadButton]}
                onPress={handleUpload}
              >
                <Text style={styles.actionButtonText}>📤 Upload</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.recordAgainButton]}
                onPress={handleRecordAgain}
              >
                <Text style={styles.actionButtonText}>🔄 Record Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>

            {/* Privacy Settings - Inline */}
            <View style={styles.privacySection}>
              <Text style={styles.privacyTitle}>🔒 Privacy Settings</Text>
              <Text style={styles.privacySubtitle}>
                Select caregivers to exclude from viewing this recording
              </Text>

              <View style={styles.caregiverList}>
                {caregivers.map((caregiver) => {
                  const isExcluded = excludedCaregivers.includes(caregiver.id);
                  return (
                    <TouchableOpacity
                      key={caregiver.id}
                      style={[
                        styles.caregiverItem,
                        isExcluded && styles.caregiverItemExcluded,
                      ]}
                      onPress={() => toggleCaregiverExclusion(caregiver.id)}
                    >
                      <Text
                        style={[
                          styles.caregiverName,
                          isExcluded && styles.caregiverNameExcluded,
                        ]}
                      >
                        {caregiver.name}
                      </Text>
                      <Text
                        style={[
                          styles.caregiverStatus,
                          { color: isExcluded ? '#f44336' : '#4CAF50' },
                        ]}
                      >
                        {isExcluded ? '❌ Hidden' : '✅ Visible'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
  },
  WelcomeText: {
    fontSize: 20,
    color: '#6c757d',
    marginBottom: 4,
    fontWeight: '500',
  },
  nameText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 25,
    color: '#495057',   
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#fee',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fcc',
    marginLeft: 12,
  },
  logoutButtonText: {
    color: '#f44336',
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
  },
  durationContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  durationText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  durationTextAbove: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f44336',
    textAlign: 'center',
    letterSpacing: 1,
  },
  durationPlaceholder: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingTextContainer: {
    alignItems: 'center',
    marginTop: 2,
  },
  recordingContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 100,
  },
  recordButton: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  micImage: {
    width: 90,
    height: 90,
  },
  recordButtonInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  recordingActive: {
    backgroundColor: '#f44336',
    shadowColor: '#f44336',
  },
  recordIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  recordIconStop: {
    borderRadius: 8,
  },
  reviewInstructionContainer: {
    alignItems: 'center',
    paddingTop: 5,
  },
  playbackSection: {
    padding: 20,
  },
  playbackCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  playButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  playButtonText: {
    fontSize: 40,
    color: 'white',
  },
  playButtonImage: {
    width: 120,
    height: 120,
  },
  playbackText: {
    fontSize: 23,
    color: '#495057',
    fontWeight: '500',
  },
  actionButtons: {
    marginBottom: 16,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
  },
  recordAgainButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 25,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 25,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  privacySection: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  privacyTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  privacySubtitle: {
    fontSize: 20,
    color: '#6c757d',
    marginBottom: 20,
    fontWeight: '500',
    lineHeight: 26,
  },
  caregiverList: {
    marginTop: 4,
  },
  caregiverItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#f8f9fa',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  caregiverItemExcluded: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  caregiverName: {
    fontSize: 21,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  caregiverNameExcluded: {
    color: '#6c757d',
    textDecorationLine: 'line-through',
  },
  caregiverStatus: {
    fontSize: 18,
    fontWeight: '700',
  },
});