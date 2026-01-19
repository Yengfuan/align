class GeminiService {
  // Backend URL for AI analysis (Flask server)
  // Railway uses HTTPS on the default port (no port number needed)
  BACKEND_URL = 'https://align-production-1a84.up.railway.app';

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

      const data = await response.json();
      console.log('[Gemini] Raw API response:', JSON.stringify(data, null, 2));
      return data;
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