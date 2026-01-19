from google import genai
import os
from typing import List, Dict

class GeminiService:
    """Service for interacting with Google Gemini API"""

    def __init__(self):
        """Initialize Gemini API with API key from environment"""
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY not found in environment variables. "
                "Please add it to your .env file or set it as an environment variable."
            )
        self.client = genai.Client(api_key=api_key)
        self.model_name = 'gemini-2.5-flash'  # Use Gemini 2.5 Flash

    def analyze_shift_notes(
        self,
        shift_notes: List[Dict],
        care_recipient_name: str = None,
        shift_context: Dict = None,
        care_recipient_profile: Dict = None
    ) -> Dict:
        """
        Analyze shift notes and provide suggestions for improvement

        Args:
            shift_notes: List of shift note dictionaries with 'content', 'caregiver_name', 'timestamp'
            care_recipient_name: Optional name of care recipient
            shift_context: Optional dict with additional context (shift_number, date, etc.)
            care_recipient_profile: Optional dict with recipient's personal data (birthday, meal times, preferences, etc.)

        Returns:
            Dict with 'suggestions', 'summary', and 'priorities' keys
        """
        if not shift_notes:
            return {
                'suggestions': [],
                'summary': 'No shift notes available for analysis.',
                'priorities': []
            }

        # Build the prompt for Gemini
        prompt = self._build_analysis_prompt(shift_notes, care_recipient_name, shift_context, care_recipient_profile)

        try:
            # Generate response from Gemini using new SDK
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )

            # Parse the response
            result = self._parse_gemini_response(response.text)
            return result

        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            return {
                'suggestions': [],
                'summary': f'Error analyzing notes: {str(e)}',
                'priorities': [],
                'error': str(e)
            }

    def _build_analysis_prompt(
        self,
        shift_notes: List[Dict],
        care_recipient_name: str,
        shift_context: Dict,
        care_recipient_profile: Dict = None
    ) -> str:
        """Build a detailed prompt for Gemini to analyze shift notes"""

        # Format shift notes into readable text
        notes_text = ""
        for i, note in enumerate(shift_notes, 1):
            caregiver = note.get('caregiver_name', 'Unknown')
            content = note.get('content', '')
            timestamp = note.get('timestamp', '')
            notes_text += f"{i}. [{caregiver} at {timestamp}]: {content}\n"

        # Add context if available
        context_text = ""
        if care_recipient_name:
            context_text += f"Care Recipient: {care_recipient_name}\n"
        if shift_context:
            if shift_context.get('date'):
                context_text += f"Date: {shift_context['date']}\n"
            if shift_context.get('shift_number'):
                context_text += f"Shift Number: {shift_context['shift_number']}\n"

        # Build recipient profile section if available
        profile_text = ""
        if care_recipient_profile:
            profile_text = "\nCARE RECIPIENT PROFILE:\n"

            # Basic info
            if care_recipient_profile.get('preferred_form_of_address'):
                profile_text += f"- Preferred Form of Address: {care_recipient_profile['preferred_form_of_address']}\n"
            if care_recipient_profile.get('age'):
                profile_text += f"- Age: {care_recipient_profile['age']}\n"
            if care_recipient_profile.get('birthday'):
                profile_text += f"- Birthday: {care_recipient_profile['birthday']}\n"

            # Daily routine times
            routine_times = []
            if care_recipient_profile.get('wake_up'):
                routine_times.append(f"Wake up: {care_recipient_profile['wake_up']}")
            if care_recipient_profile.get('breakfast'):
                routine_times.append(f"Breakfast: {care_recipient_profile['breakfast']}")
            if care_recipient_profile.get('lunch'):
                routine_times.append(f"Lunch: {care_recipient_profile['lunch']}")
            if care_recipient_profile.get('dinner'):
                routine_times.append(f"Dinner: {care_recipient_profile['dinner']}")
            if care_recipient_profile.get('bedtime'):
                routine_times.append(f"Bedtime: {care_recipient_profile['bedtime']}")
            if routine_times:
                profile_text += f"- Daily Routine: {', '.join(routine_times)}\n"

            # Communication preferences
            if care_recipient_profile.get('speech_pace'):
                profile_text += f"- Speech Pace Preference: {care_recipient_profile['speech_pace']}\n"
            if care_recipient_profile.get('hearing_status'):
                profile_text += f"- Hearing Status: {care_recipient_profile['hearing_status']}\n"
            if care_recipient_profile.get('visual_cues'):
                profile_text += f"- Visual Cues: {care_recipient_profile['visual_cues']}\n"
            if care_recipient_profile.get('instructions'):
                profile_text += f"- Instructions Preference: {care_recipient_profile['instructions']}\n"

            # Food and medication
            if care_recipient_profile.get('food_preferences'):
                profile_text += f"- Food Preferences: {care_recipient_profile['food_preferences']}\n"
            if care_recipient_profile.get('medication_preferences'):
                profile_text += f"- Medication Preferences: {care_recipient_profile['medication_preferences']}\n"

            # Support needs
            if care_recipient_profile.get('mobility_support'):
                profile_text += f"- Mobility Support: {care_recipient_profile['mobility_support']}\n"
            if care_recipient_profile.get('hearing_vision_support'):
                profile_text += f"- Hearing/Vision Support: {care_recipient_profile['hearing_vision_support']}\n"
            if care_recipient_profile.get('memory_reminders'):
                profile_text += f"- Memory Reminders: {care_recipient_profile['memory_reminders']}\n"

            # Safety information
            if care_recipient_profile.get('fall_risk'):
                profile_text += f"- Fall Risk: {care_recipient_profile['fall_risk']}\n"
            if care_recipient_profile.get('allergies'):
                profile_text += f"- ALLERGIES: {care_recipient_profile['allergies']}\n"
            if care_recipient_profile.get('medical_conditions'):
                profile_text += f"- Medical Conditions: {care_recipient_profile['medical_conditions']}\n"

            # Personal interests
            if care_recipient_profile.get('hobbies'):
                profile_text += f"- Hobbies: {care_recipient_profile['hobbies']}\n"
            if care_recipient_profile.get('favourite_topics'):
                profile_text += f"- Favorite Topics: {care_recipient_profile['favourite_topics']}\n"

            # Boundaries and preferences
            if care_recipient_profile.get('privacy_boundaries'):
                profile_text += f"- Privacy Boundaries: {care_recipient_profile['privacy_boundaries']}\n"
            if care_recipient_profile.get('sensitive_topics'):
                profile_text += f"- Sensitive Topics to Avoid: {care_recipient_profile['sensitive_topics']}\n"
            if care_recipient_profile.get('independence_preferences'):
                profile_text += f"- Independence Preferences: {care_recipient_profile['independence_preferences']}\n"
            if care_recipient_profile.get('physical_comfort'):
                profile_text += f"- Physical Comfort Preferences: {care_recipient_profile['physical_comfort']}\n"

        prompt = f"""You are an expert healthcare assistant analyzing caregiver shift notes for elderly care.

{context_text}
{profile_text}
SHIFT NOTES:
{notes_text}

Please analyze these shift notes and provide personalized recommendations based on the care recipient's profile.

1. SUMMARY: A brief 2-3 sentence summary of the key events and observations from this shift.

2. SUGGESTIONS: 3-5 specific, actionable suggestions for the next shift to improve care quality. Consider:
   - The recipient's preferred daily routine and meal times
   - Their communication preferences and how to address them
   - Any mobility, hearing, or vision support needs
   - Their hobbies and interests for engagement activities
   - Respect their privacy boundaries and avoid sensitive topics
   - Any allergies or medical conditions to be aware of
   - Follow-up actions needed based on shift observations

3. PRIORITIES: Identify 2-3 top priority items that the next caregiver should focus on immediately, taking into account:
   - Upcoming meals or routine activities based on their schedule
   - Any safety concerns (fall risk, allergies, medical conditions)
   - Observations from the shift notes that need immediate attention

Format your response EXACTLY as follows:
SUMMARY:
[Your summary here]

SUGGESTIONS:
- [Suggestion 1]
- [Suggestion 2]
- [Suggestion 3]
...

PRIORITIES:
- [Priority 1]
- [Priority 2]
- [Priority 3]
"""
        return prompt

    def _parse_gemini_response(self, response_text: str) -> Dict:
        """Parse Gemini's structured response into a dictionary"""
        result = {
            'suggestions': [],
            'summary': '',
            'priorities': []
        }

        # Split response into sections
        lines = response_text.strip().split('\n')
        current_section = None

        for line in lines:
            line = line.strip()

            if line.startswith('SUMMARY:'):
                current_section = 'summary'
                # Get summary text after "SUMMARY:"
                summary_text = line.replace('SUMMARY:', '').strip()
                if summary_text:
                    result['summary'] = summary_text
                continue
            elif line.startswith('SUGGESTIONS:'):
                current_section = 'suggestions'
                continue
            elif line.startswith('PRIORITIES:'):
                current_section = 'priorities'
                continue

            # Process content based on current section
            if current_section == 'summary' and line:
                if result['summary']:
                    result['summary'] += ' ' + line
                else:
                    result['summary'] = line
            elif current_section == 'suggestions' and line.startswith('-'):
                suggestion = line[1:].strip()
                if suggestion:
                    result['suggestions'].append(suggestion)
            elif current_section == 'priorities' and line.startswith('-'):
                priority = line[1:].strip()
                if priority:
                    result['priorities'].append(priority)

        return result

    def generate_shift_summary(self, shift_notes: List[Dict]) -> str:
        """
        Generate a concise summary of shift notes

        Args:
            shift_notes: List of shift note dictionaries

        Returns:
            String summary of the shift
        """
        if not shift_notes:
            return "No notes recorded for this shift."

        notes_text = "\n".join([
            f"- [{note.get('caregiver_name', 'Unknown')}]: {note.get('content', '')}"
            for note in shift_notes
        ])

        prompt = f"""Summarize these caregiver shift notes in 2-3 sentences:

{notes_text}

Provide a clear, concise summary focusing on the most important information."""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            print(f"Error generating summary: {e}")
            return f"Error generating summary: {str(e)}"
