from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from gemini_service import GeminiService

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for React Native app

# Initialize Supabase client
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Warning: SUPABASE_URL or SUPABASE_ANON_KEY not found in environment variables.")
    print("Please add them to your .env file.")
    supabase: Client = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("Supabase client initialized successfully!")

# Initialize Gemini service (will be None if API key not configured)
try:
    gemini_service = GeminiService()
    print("Gemini AI service initialized successfully!")
except Exception as e:
    gemini_service = None
    print(f"Warning: Gemini AI service not available: {e}")

# ============= API ENDPOINTS =============

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'Server is running',
        'supabase': 'connected' if supabase else 'not configured',
        'gemini': 'available' if gemini_service else 'not configured'
    })

# ============= AI/GEMINI ENDPOINTS =============

@app.route('/shifts/<shift_id>/analyze', methods=['POST'])
def analyze_shift_notes(shift_id):
    """
    Analyze shift notes using Gemini AI and provide suggestions.
    In the new Supabase schema, shift notes are stored in the 'content' field of the shifts table.
    """
    if not gemini_service:
        return jsonify({
            'error': 'AI service not available. Please configure GEMINI_API_KEY in .env file.'
        }), 503

    if not supabase:
        return jsonify({
            'error': 'Database not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env file.'
        }), 503

    try:
        # Get shift information from Supabase
        shift_response = supabase.table('shifts').select('*').eq('uuid', shift_id).single().execute()

        if not shift_response.data:
            return jsonify({'error': 'Shift not found'}), 404

        shift = shift_response.data

        # Get care recipient profile with all personal data
        care_recipient_name = None
        care_recipient_profile = None
        if shift.get('care_recipient_id'):
            recipient_response = supabase.table('care_recipients').select('*').eq('id', shift['care_recipient_id']).single().execute()
            if recipient_response.data:
                care_recipient_name = recipient_response.data.get('name')
                care_recipient_profile = recipient_response.data

        # In the new schema, shift notes are stored in the 'content' field
        shift_content = shift.get('content')

        if not shift_content:
            return jsonify({
                'suggestions': [],
                'summary': 'No shift notes available for this shift.',
                'priorities': []
            })

        # Convert single content string to the format expected by gemini_service
        # The gemini_service expects a list of note dictionaries
        notes = [{
            'content': shift_content,
            'caregiver_name': 'Shift Caregiver',
            'timestamp': shift.get('date', '')
        }]

        # Prepare shift context
        shift_context = {
            'shift_number': shift.get('shift_no'),
            'date': shift.get('date'),
            'start_time': shift.get('start_time'),
            'end_time': shift.get('end_time')
        }

        # Call Gemini service to analyze notes with recipient profile
        analysis = gemini_service.analyze_shift_notes(
            shift_notes=notes,
            care_recipient_name=care_recipient_name,
            shift_context=shift_context,
            care_recipient_profile=care_recipient_profile
        )
        return jsonify(analysis)

    except Exception as e:
        print(f"Error analyzing shift notes: {e}")
        return jsonify({
            'error': f'Error analyzing shift notes: {str(e)}',
            'suggestions': [],
            'summary': '',
            'priorities': []
        }), 500


@app.route('/shifts/<shift_id>/summary', methods=['GET'])
def get_shift_summary(shift_id):
    """
    Generate a concise AI summary of shift notes.
    In the new Supabase schema, shift notes are stored in the 'content' field of the shifts table.
    """
    if not gemini_service:
        return jsonify({
            'error': 'AI service not available. Please configure GEMINI_API_KEY in .env file.'
        }), 503

    if not supabase:
        return jsonify({
            'error': 'Database not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env file.'
        }), 503

    try:
        # Get shift information from Supabase
        shift_response = supabase.table('shifts').select('*').eq('uuid', shift_id).single().execute()

        if not shift_response.data:
            return jsonify({'error': 'Shift not found'}), 404

        shift = shift_response.data
        shift_content = shift.get('content')

        if not shift_content:
            return jsonify({'summary': 'No notes recorded for this shift.'})

        # Convert to format expected by gemini_service
        notes = [{
            'content': shift_content,
            'caregiver_name': 'Shift Caregiver',
            'timestamp': shift.get('date', '')
        }]

        summary = gemini_service.generate_shift_summary(notes)
        return jsonify({'summary': summary})

    except Exception as e:
        print(f"Error generating summary: {e}")
        return jsonify({
            'error': f'Error generating summary: {str(e)}',
            'summary': ''
        }), 500


# ============= ADDITIONAL ENDPOINTS FOR SUPABASE DATA =============

@app.route('/care-recipients', methods=['GET'])
def get_care_recipients():
    """Get all care recipients from Supabase"""
    if not supabase:
        return jsonify({'error': 'Database not configured'}), 503

    try:
        response = supabase.table('care_recipients').select('*').execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/shifts', methods=['GET'])
def get_shifts():
    """Get all shifts, optionally filtered by care_recipient_id"""
    if not supabase:
        return jsonify({'error': 'Database not configured'}), 503

    care_recipient_id = request.args.get('care_recipient_id')

    try:
        query = supabase.table('shifts').select('*')
        if care_recipient_id:
            query = query.eq('care_recipient_id', care_recipient_id)

        response = query.order('date', desc=True).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/shifts/<shift_id>', methods=['GET'])
def get_shift(shift_id):
    """Get a specific shift by UUID"""
    if not supabase:
        return jsonify({'error': 'Database not configured'}), 503

    try:
        response = supabase.table('shifts').select('*').eq('uuid', shift_id).single().execute()
        if response.data:
            return jsonify(response.data)
        return jsonify({'error': 'Shift not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
