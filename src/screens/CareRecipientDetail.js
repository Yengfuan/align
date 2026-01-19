import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import gemini from '../services/gemini'
import { Colors, TextStyles, ButtonStyles, ContainerStyles, Shadows, BorderRadius, InputStyles } from '../styles/CommonStyles';
import { Bot } from 'lucide-react-native';

export default function CareRecipientDetail({ route, navigation }) {
  const { recipient, caregiver } = route.params;

  // State management
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Add shift modal state
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [newShiftDate, setNewShiftDate] = useState('');
  const [newShiftStartTime, setNewShiftStartTime] = useState('');
  const [newShiftEndTime, setNewShiftEndTime] = useState('');
  const [newShiftNotes, setNewShiftNotes] = useState('');
  const [newShiftCaregiverName, setNewShiftCaregiverName] = useState('');

  // AI analysis modal state
  const [showAiAnalysisModal, setShowAiAnalysisModal] = useState(false);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysisData, setAiAnalysisData] = useState(null);
  const [selectedDayForAnalysis, setSelectedDayForAnalysis] = useState(null);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch shifts and recordings from backend
  useEffect(() => {
    fetchShiftsAndRecordings();
  }, [recipient.id, caregiver?.id]);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[CareRecipientDetail] Screen focused, refreshing data...');
      fetchShiftsAndRecordings();
    }, [recipient.id, caregiver?.id])
  );

  const fetchShiftsAndRecordings = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch shifts for this care recipient
      const shifts = await api.getShifts(recipient.id);

      // Fetch recordings for this care recipient
      // If a caregiver is viewing, filter to only show recordings they have access to
      const allRecordings = caregiver?.id
        ? await api.getAccessibleRecordings(recipient.id, caregiver.id)
        : await api.getRecordings(recipient.id);

      // Group data by date
      const groupedByDate = {};

      // First, process existing shifts from the backend
      // Fetch all caregivers to map IDs to names
      const allCaregivers = await api.getCaregivers();
      const caregiverMap = {};
      for (const cg of allCaregivers) {
        caregiverMap[cg.id] = cg.name;
      }

      for (const shift of shifts) {
        const shiftDate = shift.date;

        if (!groupedByDate[shiftDate]) {
          groupedByDate[shiftDate] = {
            date: shiftDate,
            displayDate: formatDisplayDate(shiftDate),
            shifts: [],
            recordings: [],
          };
        }

        // Build time string from start_time and end_time
        let shiftTime = '';
        if (shift.start_time && shift.end_time) {
          shiftTime = `${shift.start_time} - ${shift.end_time}`;
        }

        // Get caregiver name from the map
        const caregiverName = caregiverMap[shift.care_giver_id] || `Shift ${shift.shift_no}`;

        // Add shift info - use uuid as the id
        groupedByDate[shiftDate].shifts.push({
          id: shift.uuid, // Use uuid from Supabase
          uuid: shift.uuid,
          shiftNumber: shift.shift_no,
          caregiverName: caregiverName,
          caregiverId: shift.care_giver_id,
          time: shiftTime,
          notes: shift.content || `No notes available for this shift`,
          day: shift.shift_no,
        });
      }

      // Process all recordings and group by date
      for (const recording of allRecordings) {
        // Use recording.date if available, otherwise extract from created_at
        const recordingDate = recording.date || recording.created_at?.split('T')[0];

        if (!recordingDate) continue; // Skip if no date available

        if (!groupedByDate[recordingDate]) {
          groupedByDate[recordingDate] = {
            date: recordingDate,
            displayDate: formatDisplayDate(recordingDate),
            shifts: [],
            recordings: [],
          };
        }

        // Fetch notes for the recording using uuid
        const notes = await api.getNotes(recording.uuid);

        // Add recording to the appropriate date
        groupedByDate[recordingDate].recordings.push({
          ...recording,
          id: recording.uuid, // Use uuid as id for compatibility
          timestamp: recording.created_at, // Map created_at to timestamp
          notes: notes,
          uploadedBy: recipient.name,
        });
      }

      // Auto-generate containers for today and yesterday if they don't exist
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const todayString = formatDateToString(today);
      const yesterdayString = formatDateToString(yesterday);

      // Add today if it doesn't exist
      if (!groupedByDate[todayString]) {
        groupedByDate[todayString] = {
          date: todayString,
          displayDate: 'Today',
          shifts: [],
          recordings: [],
        };
      }

      // Add yesterday if it doesn't exist
      if (!groupedByDate[yesterdayString]) {
        groupedByDate[yesterdayString] = {
          date: yesterdayString,
          displayDate: 'Yesterday',
          shifts: [],
          recordings: [],
        };
      }

      // Convert to array and filter out future dates (beyond today)
      const todayDate = new Date(todayString);
      const dailyDataArray = Object.values(groupedByDate)
        .filter(day => {
          const dayDate = new Date(day.date);
          // Only keep dates that are today or in the past
          return dayDate <= todayDate;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setDailyData(dailyDataArray);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please check if the backend server is running.');
      if (!isRefreshing) {
        Alert.alert('Error', 'Failed to load care recipient data. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = () => {
    fetchShiftsAndRecordings(true);
  };

  // Helper function to format date as YYYY-MM-DD
  const formatDateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time parts for comparison
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
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

  const toggleShiftExpansion = (dayIndex, shiftIndex) => {
    const updatedData = [...dailyData];
    const shift = updatedData[dayIndex].shifts[shiftIndex];
    shift.expanded = !shift.expanded;
    setDailyData(updatedData);
  };

  const handleAddShift = async () => {
    if (!newShiftDate || !newShiftStartTime || !newShiftEndTime || !newShiftNotes.trim() || !newShiftCaregiverName.trim()) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newShiftStartTime) || !timeRegex.test(newShiftEndTime)) {
      Alert.alert('Invalid Time Format', 'Please enter times in HH:MM format (e.g., 08:00, 14:00)');
      return;
    }

    // Convert times to minutes for comparison
    const [startHour, startMinute] = newShiftStartTime.split(':').map(Number);
    const [endHour, endMinute] = newShiftEndTime.split(':').map(Number);
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    // Check if end time is before start time
    if (endTimeInMinutes <= startTimeInMinutes) {
      Alert.alert(
        'Invalid Time Range',
        'End time must be after start time. For overnight shifts, please create separate entries for each day.'
      );
      return;
    }

    try {
      // Calculate the next shift number for this date
      // Find the day in dailyData that matches the newShiftDate
      const existingDay = dailyData.find(day => day.date === newShiftDate);
      const existingShiftsOnDate = existingDay ? existingDay.shifts.length : 0;
      const nextShiftNo = existingShiftsOnDate + 1;

      // Create shift in Supabase with new schema
      const shiftData = {
        care_recipient_id: recipient.id,
        care_giver_id: caregiver.id,
        date: newShiftDate,
        start_time: newShiftStartTime,
        end_time: newShiftEndTime,
        content: newShiftNotes,
        shift_no: nextShiftNo,
      };

      await api.createShift(shiftData);

      // Reset form
      setNewShiftDate('');
      setNewShiftStartTime('');
      setNewShiftEndTime('');
      setNewShiftNotes('');
      setNewShiftCaregiverName('');
      setShowAddShiftModal(false);

      // Refresh data
      await fetchShiftsAndRecordings();

      Alert.alert('Success', 'Shift added successfully!');
    } catch (error) {
      console.error('Error creating shift:', error);
      Alert.alert('Error', 'Failed to create shift. Please try again.');
    }
  };

  const handleRecordingPress = (recording, day) => {
    const shift = day.shifts[0]; // You can implement logic to match recording to specific shift
    navigation.navigate('RecordingDetail', {
      recording,
      shift,
      recipient,
      caregiver,
    });
  };

  const handleAiAnalysis = async (day) => {
    // Check if there are any shifts for this day
    if (!day.shifts || day.shifts.length === 0) {
      Alert.alert('No Shifts Available', 'There are no shifts recorded for this day to analyze.');
      return;
    }

    setSelectedDayForAnalysis(day);
    setShowAiAnalysisModal(true);
    setAiAnalysisLoading(true);
    setAiAnalysisData(null);

    try {
      // Use the first shift of the day for analysis
      const shiftId = day.shifts[0].id;
      const analysis = await gemini.analyzeShiftNotes(shiftId);
      setAiAnalysisData(analysis);
    } catch (error) {
      console.error('Error analyzing shift:', error);
      setAiAnalysisData({
        error: 'Failed to analyze shift notes. Please make sure the AI service is configured.',
        summary: '',
        suggestions: [],
      });
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  const handleViewProfile = () => {
    navigation.navigate('RecipientProfile', { recipient });
  };

  const handleGroupChat = () => {
    navigation.navigate('CaregiverGroupChat', {
      recipient,
      caregiver
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.recipientName}>{recipient.name}</Text>
        <View style={styles.headerDetails}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerText}>Age: {recipient.age}</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerText}>Room: {recipient.room}</Text>
          </View>
        </View>

        {/* Button Container for Profile and Group Chat */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.profileButton} onPress={handleViewProfile}>
            <Text style={styles.profileButtonText}>View Full Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.groupChatButton} onPress={handleGroupChat}>
            <Text style={styles.groupChatButtonText}>Group Chat with Caregivers</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Daily Data */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="red" />
            <Text style={styles.loadingText}>Loading care recipient data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchShiftsAndRecordings}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : dailyData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No data available for this care recipient</Text>
          </View>
        ) : (
          dailyData.map((day, dayIndex) => (
          <View key={day.date} style={styles.dayBox}>
            {/* Day Header */}
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{day.displayDate}</Text>
              <Text style={styles.dayDate}>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
            </View>

            {/* Shifts */}
            <View style={styles.shiftsContainer}>
              {day.shifts.length > 0 ? (
                day.shifts.map((shift, shiftIndex) => (
                  <TouchableOpacity
                    key={shiftIndex}
                    style={styles.shiftBox}
                    onPress={() => toggleShiftExpansion(dayIndex, shiftIndex)}
                    activeOpacity={0.7}
                  >
                    {/* Shift Summary - Always Visible */}
                    <View style={styles.shiftSummaryContainer}>
                      <View style={styles.shiftHeader}>
                        <View style={styles.caregiverInfoContainer}>
                          <View style={styles.caregiverAvatar}>
                            <Text style={styles.caregiverAvatarText}>
                              {shift.caregiverName ? shift.caregiverName.split(' ').map(n => n[0]).join('') : 'S' + shift.shiftNumber}
                            </Text>
                          </View>
                          <View style={styles.shiftMainInfo}>
                            <Text style={styles.shiftCaregiver}>
                              {shift.caregiverName || `Shift ${shift.shiftNumber}`}
                            </Text>
                            {shift.time && (
                              <Text style={styles.shiftTime}>
                                {shift.time}
                              </Text>
                            )}
                          </View>
                        </View>
                        <View style={styles.shiftBadge}>
                          <Text style={styles.shiftBadgeText}>
                            Shift {shift.shiftNumber}
                          </Text>
                        </View>
                      </View>

                      {/* Expand Indicator */}
                      <Text style={styles.expandIndicator}>
                        {shift.expanded ? '▼ Tap to collapse' : '▶ Tap for details'}
                      </Text>
                    </View>

                    {/* Expanded Notes */}
                    {shift.expanded && (
                      <View style={styles.shiftDetails}>
                        <View style={styles.divider} />
                        <Text style={styles.notesLabel}>Shift Notes:</Text>
                        <Text style={styles.notesText}>
                          {shift.notes || 'No notes available for this shift. Tap "+" to add notes.'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noShiftsBox}>
                  <Text style={styles.noShiftsText}>No shifts recorded yet</Text>
                  <Text style={styles.noShiftsSubtext}>Tap the "+" button to add a shift</Text>
                </View>
              )}
            </View>

            {/* Recordings */}
            {day.recordings.length > 0 && (
              <View style={styles.recordingsContainer}>
                <View style={styles.recordingsHeader}>
                  <Text style={styles.recordingsIcon}>🎙️</Text>
                  <Text style={styles.recordingsTitle}>Recordings ({day.recordings.length})</Text>
                </View>
                
                {day.recordings.map((recording, recordingIndex) => (
                  <TouchableOpacity
                    key={recording.id}
                    style={styles.recordingBox}
                    onPress={() => handleRecordingPress(recording, day)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.recordingContent}>
                      <View style={styles.recordingIcon}>
                        <Text style={styles.recordingIconText}>▶</Text>
                      </View>
                      <View style={styles.recordingInfo}>
                        <Text style={styles.recordingTime}>{formatTime(recording.timestamp)}</Text>
                        <Text style={styles.recordingDuration}>{formatDuration(recording.duration)}</Text>
                        {recording.notes.length > 0 && (
                          <View style={styles.notesBadge}>
                            <Text style={styles.notesBadgeText}>💬 {recording.notes.length} note{recording.notes.length > 1 ? 's' : ''}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.recordingArrow}>
                        <Text style={styles.arrow}>›</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {day.recordings.length === 0 && (
              <View style={styles.noRecordingsBox}>
                <Text style={styles.noRecordingsText}>No recordings for this day</Text>
              </View>
            )}

            {/* AI Analysis Button */}
            {day.shifts.length > 0 && (
              <TouchableOpacity
                style={styles.aiAnalysisButton}
                onPress={() => handleAiAnalysis(day)}
                activeOpacity={0.7}
              >
                <Bot color={Colors.gray700} style={{marginRight: 5}} />
                <Text style={styles.aiAnalysisButtonText}>AI Analysis & Suggestions</Text>
              </TouchableOpacity>
            )}
          </View>
          ))
        )}
      </ScrollView>

      {/* Add Shift Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setNewShiftDate(getTodayDate());
          setNewShiftCaregiverName(caregiver?.name || '');
          setShowAddShiftModal(true);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      {/* Add Shift Modal */}
      <Modal
        visible={showAddShiftModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddShiftModal(false)}
      >
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView
            style={styles.modalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Shift</Text>
              <TouchableOpacity onPress={() => setShowAddShiftModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Caregiver Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter caregiver name"
                placeholderTextColor={Colors.gray400}
                value={newShiftCaregiverName}
                onChangeText={setNewShiftCaregiverName}
              />

              <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="2026-01-15"
                placeholderTextColor={Colors.gray400}
                value={newShiftDate}
                onChangeText={setNewShiftDate}
              />

              <Text style={styles.inputLabel}>Start Time (HH:MM)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder=" e.g. 08:00"
                placeholderTextColor={Colors.gray400}
                value={newShiftStartTime}
                onChangeText={setNewShiftStartTime}
              />

              <Text style={styles.inputLabel}>End Time (HH:MM)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 14:00"
                placeholderTextColor={Colors.gray400}
                value={newShiftEndTime}
                onChangeText={setNewShiftEndTime}
              />

              <Text style={styles.inputLabel}>Shift Notes</Text>
              <TextInput
                style={[styles.modalInput, styles.notesInput]}
                placeholder="Describe activities, meals, medications, mood, etc."
                placeholderTextColor={Colors.gray400}
                value={newShiftNotes}
                onChangeText={setNewShiftNotes}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddShift}
              >
                <Text style={styles.submitButtonText}>Add Shift</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* AI Analysis Modal */}
      <Modal
        visible={showAiAnalysisModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAiAnalysisModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.aiModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Analysis</Text>
              <TouchableOpacity onPress={() => setShowAiAnalysisModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {aiAnalysisLoading ? (
                <View style={styles.aiLoadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.aiLoadingText}>Analyzing shift notes...</Text>
                </View>
              ) : aiAnalysisData ? (
                <View>
                  {aiAnalysisData.error ? (
                    <View style={styles.aiErrorContainer}>
                      <Text style={styles.aiErrorText}>{aiAnalysisData.error}</Text>
                    </View>
                  ) : (
                    <>
                      {/* Summary Section */}
                      {aiAnalysisData.summary && (
                        <View style={styles.aiSectionContainer}>
                          <Text style={styles.aiSectionTitle}>Summary</Text>
                          <View style={styles.aiContentBox}>
                            <Text style={styles.aiSummaryText}>{aiAnalysisData.summary}</Text>
                          </View>
                        </View>
                      )}

                      {/* Suggestions Section */}
                      {aiAnalysisData.suggestions && aiAnalysisData.suggestions.length > 0 && (
                        <View style={styles.aiSectionContainer}>
                          <Text style={styles.aiSectionTitle}>Suggestions for Next Shift</Text>
                          {aiAnalysisData.suggestions.map((suggestion, index) => (
                            <View key={index} style={styles.aiSuggestionBox}>
                              <Text style={styles.aiSuggestionNumber}>{index + 1}</Text>
                              <Text style={styles.aiSuggestionText}>{suggestion}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Priorities Section */}
                      {aiAnalysisData.priorities && aiAnalysisData.priorities.length > 0 && (
                        <View style={styles.aiSectionContainer}>
                          <Text style={styles.aiSectionTitle}>Priority Items</Text>
                          {aiAnalysisData.priorities.map((priority, index) => (
                            <View key={index} style={styles.aiPriorityBox}>
                              <Text style={styles.aiPriorityIcon}>⚠️</Text>
                              <Text style={styles.aiPriorityText}>{priority}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  )}
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  recipientName: {
    ...TextStyles.h2,
    marginBottom: 12,
  },
  headerDetails: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  headerIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  headerText: {
    fontSize: 14,
    color: Colors.gray700,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
  },
  profileButton: {
    ...ButtonStyles.base,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  profileButtonText: {
    ...TextStyles.buttonText,
    fontSize: 16,
    textAlign: 'center',
    flex: 1,
    lineHeight: 20,
  },
  groupChatButton: {
    ...ButtonStyles.base,
    backgroundColor: '#FF9A76',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    ...Shadows.medium,
  },
  groupChatButtonText: {
    ...TextStyles.buttonText,
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
    flex: 1,
    lineHeight: 20,
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  dayBox: {
    ...ContainerStyles.cardLarge,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  dayHeader: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  dayTitle: {
    ...TextStyles.h3,
    marginBottom: 4,
  },
  dayDate: {
    ...TextStyles.small,
    color: Colors.gray600,
  },
  shiftsContainer: {
    marginBottom: 16,
  },
  shiftBox: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray300,
    position: 'relative',
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  shiftBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  shiftBadgeText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  shiftTime: {
    fontSize: 13,
    color: Colors.gray600,
    fontWeight: '600',
  },
  shiftCaregiver: {
    fontSize: 15,
    color: Colors.gray700,
    fontWeight: '600',
    marginBottom: 10,
  },
  notesBox: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  notesLabel: {
    fontSize: 12,
    color: Colors.gray600,
    fontWeight: '600',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  shiftArrowContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  shiftArrow: {
    fontSize: 28,
    color: Colors.gray500,
    fontWeight: 'bold',
  },
  recordingsContainer: {
    marginTop: 4,
  },
  recordingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordingsIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  recordingsTitle: {
    ...TextStyles.h4,
  },
  recordingBox: {
    backgroundColor: '#fff5e6',
    borderRadius: BorderRadius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ffe0b2',
    ...Shadows.small,
  },
  recordingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  recordingIconText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  recordingInfo: {
    flex: 1,
  },
  recordingTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  recordingDuration: {
    fontSize: 14,
    color: Colors.gray600,
    fontWeight: '500',
  },
  notesBadge: {
    marginTop: 6,
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  notesBadgeText: {
    fontSize: 12,
    color: Colors.info,
    fontWeight: '600',
  },
  recordingArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 20,
    color: Colors.white,
    fontWeight: 'bold',
  },
  noRecordingsBox: {
    backgroundColor: Colors.gray50,
    padding: 20,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderStyle: 'dashed',
  },
  noRecordingsText: {
    ...TextStyles.small,
    color: Colors.gray500,
    fontStyle: 'italic',
  },
  noShiftsBox: {
    backgroundColor: Colors.gray50,
    padding: 24,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderStyle: 'dashed',
  },
  noShiftsText: {
    fontSize: 15,
    color: Colors.gray600,
    fontWeight: '600',
    marginBottom: 6,
  },
  noShiftsSubtext: {
    fontSize: 13,
    color: Colors.gray500,
    fontStyle: 'italic',
  },
  loadingContainer: {
    ...ContainerStyles.centered,
    paddingVertical: 60,
  },
  loadingText: {
    ...TextStyles.body,
    color: Colors.gray600,
    marginTop: 16,
  },
  errorContainer: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorText: {
    fontSize: 15,
    color: '#c00',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  retryButton: {
    ...ButtonStyles.base,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    ...TextStyles.buttonText,
    fontSize: 15,
  },
  emptyContainer: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.md,
    padding: 40,
    margin: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderStyle: 'dashed',
  },
  emptyText: {
    ...TextStyles.body,
    color: Colors.gray500,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  caregiverInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  caregiverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  caregiverAvatarText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  shiftMainInfo: {
    flex: 1,
  },
  shiftSummaryContainer: {
    width: '100%',
  },
  shiftDetails: {
    marginTop: 12,
    paddingTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray300,
    marginBottom: 12,
  },
  expandIndicator: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.large,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: '300',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalClose: {
    fontSize: 28,
    color: Colors.gray600,
    fontWeight: '300',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    ...InputStyles.rounded,
    fontSize: 15,
    marginBottom: 8,
  },
  notesInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    ...Shadows.medium,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  aiAnalysisButton: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.md,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  aiAnalysisIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  aiAnalysisButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray700,
  },
  aiModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
    minHeight: '60%',
  },
  aiLoadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLoadingText: {
    fontSize: 15,
    color: Colors.gray600,
    marginTop: 16,
  },
  aiErrorContainer: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  aiErrorText: {
    fontSize: 14,
    color: '#c00',
    textAlign: 'center',
    lineHeight: 20,
  },
  aiSectionContainer: {
    marginBottom: 24,
  },
  aiSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  aiContentBox: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.md,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  aiSummaryText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  aiSuggestionBox: {
    backgroundColor: '#f0f4ff',
    borderRadius: BorderRadius.md,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#d0dcff',
  },
  aiSuggestionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
    backgroundColor: Colors.white,
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  aiSuggestionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  aiPriorityBox: {
    backgroundColor: '#fff5f0',
    borderRadius: BorderRadius.md,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#ffe0d0',
  },
  aiPriorityIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  aiPriorityText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    fontWeight: '500',
  },
});

