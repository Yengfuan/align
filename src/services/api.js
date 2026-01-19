// API Service using Supabase
import { supabase } from './supabase';

class ApiService {
  // ============= NOTES API =============

  /**
   * Get all notes for a recording
   */
  async getNotes(recordingUuid) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('recording_id', recordingUuid);

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Add a new note to a recording
   */
  async addNote(recordingUuid, noteData) {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        recording_id: recordingUuid,
        caregiver_id: noteData.caregiverId,
        caregiver_name: noteData.caregiverName,
        content: noteData.content,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Update an existing note
   */
  async updateNote(noteUuid, content) {
    const { data, error } = await supabase
      .from('notes')
      .update({ content })
      .eq('uuid', noteUuid)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Delete a note
   */
  async deleteNote(noteUuid) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('uuid', noteUuid);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  // ============= RECORDINGS API =============

  /**
   * Get all recordings, optionally filtered by care recipient
   */
  async getRecordings(careRecipientId = null) {
    let query = supabase.from('recordings').select('*');

    if (careRecipientId) {
      query = query.eq('care_recipient_id', careRecipientId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Get a specific recording with its notes
   */
  async getRecording(recordingUuid) {
    const { data, error } = await supabase
      .from('recordings')
      .select('*, notes(*)')
      .eq('uuid', recordingUuid)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Create a new recording
   */
  async createRecording(recordingData) {
    console.log('[API] createRecording called with:', recordingData);
    try {
      const { data, error } = await supabase
        .from('recordings')
        .insert({
          care_recipient_id: recordingData.care_recipient_id,
          duration: recordingData.duration,
          audio_url: recordingData.audio_url,
          date: recordingData.date || new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      console.log('[API] createRecording success:', data);
      return data;
    } catch (error) {
      console.error('[API] createRecording failed:', error);
      throw error;
    }
  }

  /**
   * Set recording access for caregivers
   */
  async setRecordingAccess(recordingUuid, caregiverId, hasAccess) {
    const { data, error } = await supabase
      .from('recording_access')
      .upsert({
        recording_id: recordingUuid,
        caregiver_id: caregiverId,
        has_access: hasAccess,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Get recording access list
   */
  async getRecordingAccess(recordingUuid) {
    const { data, error } = await supabase
      .from('recording_access')
      .select('*')
      .eq('recording_id', recordingUuid);

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Check if a caregiver has access to a specific recording
   * Returns true if caregiver has access, false if explicitly denied
   * If no access record exists, returns true (default is visible)
   */
  async checkRecordingAccess(recordingUuid, caregiverId) {
    const { data, error } = await supabase
      .from('recording_access')
      .select('has_access')
      .eq('recording_id', recordingUuid)
      .eq('caregiver_id', caregiverId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    // If no record exists, default to having access (visible to all)
    if (!data) return true;

    // Return the has_access value
    return data.has_access;
  }

  /**
   * Get all recordings that a caregiver has access to for a care recipient
   * Filters out recordings where the caregiver has been explicitly denied access
   */
  async getAccessibleRecordings(careRecipientId, caregiverId) {
    // First get all recordings for the care recipient
    const allRecordings = await this.getRecordings(careRecipientId);

    if (!caregiverId) {
      // If no caregiver ID provided, return all recordings
      return allRecordings;
    }

    // Filter recordings based on access permissions
    const accessibleRecordings = [];

    for (const recording of allRecordings) {
      const hasAccess = await this.checkRecordingAccess(recording.uuid, caregiverId);
      if (hasAccess) {
        accessibleRecordings.push(recording);
      }
    }

    return accessibleRecordings;
  }

  // ============= SHIFTS API =============

  /**
   * Get all shifts, optionally filtered by care recipient
   */
  async getShifts(careRecipientId = null) {
    let query = supabase.from('shifts').select('*');

    if (careRecipientId) {
      query = query.eq('care_recipient_id', careRecipientId);
    }

    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Get a specific shift
   */
  async getShift(shiftUuid) {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('uuid', shiftUuid)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Create a new shift
   */
  async createShift(shiftData) {
    const { data, error } = await supabase
      .from('shifts')
      .insert({
        care_recipient_id: shiftData.care_recipient_id,
        care_giver_id: shiftData.care_giver_id,
        shift_no: shiftData.shift_no,
        date: shiftData.date,
        start_time: shiftData.start_time,
        end_time: shiftData.end_time,
        content: shiftData.content || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Update shift content (notes)
   */
  async updateShiftContent(shiftUuid, content) {
    const { data, error } = await supabase
      .from('shifts')
      .update({ content })
      .eq('uuid', shiftUuid)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // ============= USERS API =============

  /**
   * Get all users
   */
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Get a specific user
   */
  async getUser(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // ============= CAREGIVERS API =============

  /**
   * Get all caregivers
   */
  async getCaregivers() {
    const { data, error } = await supabase
      .from('caregivers')
      .select('*');

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Get a specific caregiver
   */
  async getCaregiver(caregiverId) {
    const { data, error } = await supabase
      .from('caregivers')
      .select('*')
      .eq('id', caregiverId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // ============= CARE RECIPIENTS API =============

  /**
   * Get all care recipients
   */
  async getCareRecipients() {
    const { data, error } = await supabase
      .from('care_recipients')
      .select('*');

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Get a specific care recipient
   */
  async getCareRecipient(recipientId) {
    const { data, error } = await supabase
      .from('care_recipients')
      .select('*')
      .eq('id', recipientId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // ============= CAREGIVER ASSIGNMENTS API =============

  /**
   * Get caregivers assigned to a care recipient
   */
  async getAssignedCaregivers(careRecipientId) {
    const { data, error } = await supabase
      .from('caregiver_assignments')
      .select('*, caregivers(*)')
      .eq('care_recipient_id', careRecipientId);

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Get care recipients assigned to a caregiver
   */
  async getAssignedCareRecipients(caregiverId) {
    const { data, error } = await supabase
      .from('caregiver_assignments')
      .select('*, care_recipients(*)')
      .eq('caregiver_id', caregiverId);

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Assign a caregiver to a care recipient
   */
  async assignCaregiver(caregiverId, careRecipientId) {
    const { data, error } = await supabase
      .from('caregiver_assignments')
      .insert({
        caregiver_id: caregiverId,
        care_recipient_id: careRecipientId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Check if Supabase connection is working
   */
  async healthCheck() {
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      if (error) throw error;
      return { status: 'healthy', database: 'connected' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

// Export a singleton instance
export default new ApiService();
