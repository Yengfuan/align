class GeminiService {
  // Backend URL for AI analysis (Flask server)
  // Use the public Railway URL (not the internal one)
  BACKEND_URL = 'align-production-b858.up.railway.app';

  /**
   * Analyze shift notes using Gemini AI
   * Calls the Flask backend which connects to Supabase and Gemini
   */
  async analyzeShiftNotes(shiftId) {
    try {
      const response = await fetch(`${this.BACKEND_URL}/shifts/${shiftId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze shift notes');
      }

      return await response.json();
    } catch (error) {
      console.error('[API] analyzeShiftNotes error:', error);
      throw error;
    }
  }

  /**
   * Get AI-generated summary of shift notes
   * Calls the Flask backend which connects to Supabase and Gemini
   */
  async getShiftSummary(shiftId) {
    try {
      const response = await fetch(`${this.BACKEND_URL}/shifts/${shiftId}/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get shift summary');
      }

      return await response.json();
    } catch (error) {
      console.error('[API] getShiftSummary error:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export default new GeminiService();