# Changelog - Elderly Care App

All notable changes to this project are documented in this file.

---

## [2026-01-18] - Supabase Migration

### 🔄 Major Infrastructure Change: Flask → Supabase

Migrated the entire backend from Flask/SQLite to Supabase for real-time database capabilities and easier deployment.

**Files Changed:**
- `src/services/supabase.js` - NEW: Supabase client configuration
- `src/services/api.js` - COMPLETE REWRITE: Now uses Supabase instead of Flask
- `package.json` - Added `@supabase/supabase-js` dependency

---

#### What Changed in `api.js`:

**REMOVED:**
- Flask backend URL constant (`API_BASE_URL`)
- `request()` method that made fetch calls to Flask

**ADDED:**
- Import from `./supabase` for Supabase client
- All methods now use Supabase queries directly

**Method Changes:**

| Method | Old (Flask) | New (Supabase) |
|--------|-------------|----------------|
| `getNotes(recordingId)` | `GET /recordings/{id}/notes` | `supabase.from('notes').select('*').eq('recording_id', id)` |
| `addNote(recordingId, noteData)` | `POST /recordings/{id}/notes` | `supabase.from('notes').insert({...}).select().single()` |
| `updateNote(noteId, content)` | `PUT /notes/{id}` | `supabase.from('notes').update({content}).eq('id', id)` |
| `deleteNote(noteId)` | `DELETE /notes/{id}` | `supabase.from('notes').delete().eq('id', id)` |
| `getRecordings(careRecipientId)` | `GET /recordings?care_recipient_id={id}` | `supabase.from('recordings').select('*').eq('care_recipient_id', id)` |
| `getRecording(recordingId)` | `GET /recordings/{id}` | `supabase.from('recordings').select('*, notes(*)').eq('id', id)` |
| `createRecording(data)` | `POST /recordings` | `supabase.from('recordings').insert(data).select().single()` |
| `getShifts(careRecipientId)` | `GET /shifts?care_recipient_id={id}` | `supabase.from('shifts').select('*').eq('care_recipient_id', id)` |
| `getShift(shiftId)` | `GET /shifts/{id}` | `supabase.from('shifts').select('*').eq('id', id)` |
| `createShift(data)` | `POST /shifts` | `supabase.from('shifts').insert(data).select().single()` |
| `getShiftNotes(shiftId)` | `GET /shifts/{id}/notes` | `supabase.from('shift_notes').select('*').eq('shift_id', id)` |
| `addShiftNote(shiftId, noteData)` | `POST /shifts/{id}/notes` | `supabase.from('shift_notes').insert({...}).select().single()` |
| `updateShiftNote(noteId, content)` | `PUT /shift-notes/{id}` | `supabase.from('shift_notes').update({content}).eq('id', id)` |
| `deleteShiftNote(noteId)` | `DELETE /shift-notes/{id}` | `supabase.from('shift_notes').delete().eq('id', id)` |
| `getUsers()` | `GET /users` | `supabase.from('users').select('*')` |
| `getUser(userId)` | `GET /users/{id}` | `supabase.from('users').select('*').eq('id', id)` |
| `getCareRecipients()` | `GET /care-recipients` | `supabase.from('care_recipients').select('*')` |
| `getCareRecipient(id)` | `GET /care-recipients/{id}` | `supabase.from('care_recipients').select('*').eq('id', id)` |
| `healthCheck()` | `GET /health` | Tests Supabase connection with simple query |

---

#### New File: `src/services/supabase.js`

```javascript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qqkaowchizgilmgwktxr.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

---

#### Required Supabase Tables

Your Supabase database should have these tables (matching the Flask schema):

| Table | Columns |
|-------|---------|
| `users` | id, name, role, ... |
| `care_recipients` | id, name, ... |
| `recordings` | id, care_recipient_id, shift_id, duration, audio_url, excluded_caregivers, timestamp |
| `notes` | id, recording_id, content, timestamp |
| `shifts` | id, care_recipient_id, date, shift_number, ... |
| `shift_notes` | id, shift_id, caregiver_id, caregiver_name, content, timestamp |

---

### 🚀 Benefits of Supabase Migration

1. **No Flask server required** - Direct database access from app
2. **Real-time updates** - Can subscribe to data changes
3. **Built-in authentication** - Ready for future auth features
4. **Automatic REST API** - No need to write backend endpoints
5. **Easier deployment** - No server to host/maintain

---

### ⚠️ Breaking Changes

- Flask backend (`backend/app.py`) is no longer used
- Must have Supabase project set up with correct tables
- Row Level Security (RLS) policies may need configuration

---

## [2026-01-14] - Major Feature Updates

### 🎉 New Features

#### 1. **Recording Upload to Backend** (Care Recipient Feature)
Care recipients can now upload their voice recordings to the backend, making them accessible to their caregivers in real-time.

**Files Changed:**
- `backend/app.py` - Added `POST /recordings` endpoint (lines 262-293)
- `src/services/api.js` - Added `createRecording()` method (lines 89-97)
- `src/screens/CareRecipientHome.js` - Updated upload functionality (lines 198-314)

**What Changed:**
- **Backend (`app.py`):**
  - NEW: `POST /recordings` endpoint to create new recordings
  - Accepts: `care_recipient_id`, `shift_id`, `duration`, `audio_url`, `excluded_caregivers`
  - Returns: Created recording object with auto-generated ID and timestamp

- **API Service (`api.js`):**
  - NEW: `createRecording(recordingData)` method
  - Sends POST request to `/recordings` endpoint

- **Care Recipient Home (`CareRecipientHome.js`):**
  - OLD CODE (lines 198-248): Mock upload with Alert only - **COMMENTED OUT**
  - NEW CODE (lines 250-314):
    - Uploads recording to backend via API
    - Auto-assigns recording to current shift based on time
    - Includes privacy settings (excluded_caregivers)
    - Shows loading indicator during upload
    - Proper error handling with user feedback

**How It Works:**
1. Care recipient records a voice message
2. On upload, app determines current shift (Shift 1 if before 4 PM, Shift 2 after)
3. Creates shift ID: `{user.id}-{date}-S{shiftNumber}`
4. Sends recording data to backend
5. Caregivers can now see this recording in their views

---

#### 2. **Shift Notes Feature** (Caregiver Feature)
Caregivers can now add, view, and share notes about entire shifts (not just individual recordings).

**Files Changed:**
- `backend/app.py` - Added shift notes table and endpoints (lines 83-95, 265-343)
- `src/services/api.js` - Added shift notes methods (lines 106-142)
- `src/screens/ShiftDetail.js` - Complete overhaul with shift notes section (lines 1-311)
- `src/screens/CareRecipientDetail.js` - Made shifts touchable (lines 124-143, 182-223)

**What Changed:**
- **Backend (`app.py`):**
  - NEW TABLE: `shift_notes` with columns: id, shift_id, caregiver_id, caregiver_name, content, timestamp
  - NEW: `GET /shifts/<shift_id>/notes` - Fetch all notes for a shift
  - NEW: `POST /shifts/<shift_id>/notes` - Add a new shift note
  - NEW: `PUT /shift-notes/<note_id>` - Update a shift note
  - NEW: `DELETE /shift-notes/<note_id>` - Delete a shift note

- **API Service (`api.js`):**
  - NEW: `getShiftNotes(shiftId)` - Get notes for a shift
  - NEW: `addShiftNote(shiftId, noteData)` - Add a shift note
  - NEW: `updateShiftNote(noteId, content)` - Update a shift note
  - NEW: `deleteShiftNote(noteId)` - Delete a shift note

- **Shift Detail Screen (`ShiftDetail.js`):**
  - NEW SECTION: Shift Notes at top of screen (lines 130-187)
    - Text input for adding new shift notes
    - List of existing shift notes with caregiver names and timestamps
    - Loading states while fetching notes
    - Empty state when no notes exist
  - EXISTING: Recordings section moved below shift notes (lines 189-236)
  - UI enhancements: KeyboardAvoidingView for better keyboard handling

- **Care Recipient Detail (`CareRecipientDetail.js`):**
  - CHANGED: Shift boxes now wrapped in TouchableOpacity (line 182-223)
  - NEW: `handleShiftPress()` function to navigate to ShiftDetail (lines 124-143)
  - NEW: Arrow indicator (›) on shift boxes to show they're tappable (lines 199-201)
  - CHANGED: Label changed from "Notes:" to "Tap to view/add shift notes" (line 196)

**How It Works:**
1. Caregiver taps on any shift box in Care Recipient Detail screen
2. Opens Shift Detail screen showing:
   - Shift information (shift number, date, care recipient)
   - Input field to add new shift notes
   - List of all shift notes from all caregivers
   - All recordings for that shift (existing functionality)
3. Notes are shared in real-time across all caregivers
4. Perfect for documenting: patient mood, activities, concerns, handoff information

---

#### 3. **Backend Data Integration for Care Recipient Details**
Care recipient detail screen now fetches real data from the backend instead of using mock data.

**Files Changed:**
- `src/screens/CareRecipientDetail.js` - Complete data flow overhaul (lines 1-540)

**What Changed:**
- OLD: Hardcoded mock data array (lines 15-98) - **REMOVED**
- NEW:
  - State management for loading, error, and real data (lines 16-19)
  - `useEffect` hook to fetch data on mount (lines 21-24)
  - `fetchShiftsAndRecordings()` function (lines 26-85):
    - Fetches shifts from backend via `api.getShifts(recipient.id)`
    - For each recording, fetches note count via `api.getNotes(recording.id)`
    - Groups data by date
    - Sorts by most recent first
  - Loading UI with spinner (lines 151-155)
  - Error UI with retry button (lines 156-165)
  - Empty state UI (lines 166-169)
  - Proper error handling and user feedback

**How It Works:**
1. When caregiver views a care recipient's details
2. App fetches all shifts for that recipient from backend
3. For each shift, fetches recordings and their note counts
4. Groups by date and displays: "Today", "Yesterday", or formatted date
5. Shows accurate note counts on each recording badge
6. Updates automatically when new notes are added

---

### 🔧 Infrastructure Changes

#### Database Schema Updates
**File:** `backend/app.py`

- NEW: `shift_notes` table (lines 83-95)
  - Stores notes associated with entire shifts
  - Links to shifts table via foreign key
  - Includes caregiver information and timestamps

#### Git Configuration
**Files:** `.gitignore`, Git history

- ADDED: Database files to `.gitignore` (lines 63-66)
  - `*.db`, `*.sqlite`, `*.sqlite3`
- ADDED: Claude Code temp files to `.gitignore` (line 70)
  - `tmpclaude-*`
- REMOVED: `elderly_care.db` from version control
  - Database is now generated locally on first run
  - Prevents conflicts and keeps repos clean

---

### 📚 Documentation Updates

#### Backend API Documentation
**File:** `backend/README.md`

**ADDED:**
- Shift Notes endpoints (lines 42-46):
  - `GET /shifts/<shift_id>/notes`
  - `POST /shifts/<shift_id>/notes`
  - `PUT /shift-notes/<note_id>`
  - `DELETE /shift-notes/<note_id>`

- Recording creation endpoint (line 37):
  - `POST /recordings`

**ADDED:**
- Example: Adding a shift note (lines 75-84)
- Example: Creating a recording (lines 86-96)

---

### 🎨 UI/UX Improvements

#### Care Recipient Detail Screen
- Shift boxes now have visual affordance (arrow icon) showing they're interactive
- Loading states with spinner for better feedback
- Error states with retry functionality
- Empty states with helpful messaging

#### Shift Detail Screen
- Two-section layout: Shift Notes at top, Recordings below
- Shift notes prominently displayed for better handoff communication
- Consistent styling with recording notes
- Keyboard handling for better mobile experience

#### Care Recipient Home Screen
- Upload button now shows loading spinner during upload
- Disabled state while uploading to prevent double-submission
- Better error messages if backend is unavailable

---

### 🐛 Bug Fixes

- Fixed: Recording note counts now sync with actual backend data
- Fixed: Shift data persistence across caregiver views
- Fixed: Database file conflicts in version control
- Fixed: **Critical timezone bug in shift date assignment** - Recordings uploaded after midnight were being assigned to previous day's shift due to UTC/local timezone mismatch. Now consistently uses local timezone for both date and time calculations.

---

### 🔄 Migration Notes

#### For Existing Installations:

1. **Database Migration Required:**
   ```bash
   cd backend
   python -c "
   import sqlite3
   conn = sqlite3.connect('elderly_care.db')
   cursor = conn.cursor()
   cursor.execute('''
       CREATE TABLE IF NOT EXISTS shift_notes (
           id TEXT PRIMARY KEY,
           shift_id TEXT NOT NULL,
           caregiver_id TEXT NOT NULL,
           caregiver_name TEXT NOT NULL,
           content TEXT NOT NULL,
           timestamp TEXT NOT NULL,
           FOREIGN KEY (shift_id) REFERENCES shifts(id),
           FOREIGN KEY (caregiver_id) REFERENCES users(id)
       )
   ''')
   conn.commit()
   conn.close()
   print('shift_notes table created!')
   "
   ```

2. **Restart Backend:**
   ```bash
   python app.py
   ```

3. **No Frontend Changes Required** - Just reload the app

---

### 📝 Technical Details

#### Timezone Bug Fix (January 15, 2026)

**Problem:**
Recordings uploaded after midnight local time were being assigned to the previous day's shift. For example, recordings uploaded at 00:40 AM on January 15 were assigned to shift `CR001-2026-01-14-S1`.

**Root Cause:**
Mixed timezone usage in date/time calculation:
- `today.toISOString().split('T')[0]` returned UTC date (January 14)
- `today.getHours()` returned local hour (00:40 = hour 0)

For users in timezones ahead of UTC (e.g., UTC+8), their midnight (January 15, 00:00) is still UTC afternoon (January 14, 16:00), causing the date mismatch.

**Solution:**
Changed from UTC-based date calculation to local timezone consistently:
```javascript
// OLD (BUGGY CODE):
const dateString = today.toISOString().split('T')[0]; // UTC date
const hour = today.getHours(); // Local hour

// NEW (FIXED CODE):
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const dateString = `${year}-${month}-${day}`; // Local date
const hour = today.getHours(); // Local hour
```

Added debug logging to track date calculations during upload.

**File Changed:** `src/screens/CareRecipientHome.js` (lines 273-288)

#### API Endpoints Summary

**NEW Endpoints:**
```
POST   /recordings                    - Create a new recording
GET    /shifts/<shift_id>/notes       - Get all notes for a shift
POST   /shifts/<shift_id>/notes       - Add a note to a shift
PUT    /shift-notes/<note_id>         - Update a shift note
DELETE /shift-notes/<note_id>         - Delete a shift note
```

**Recording Upload Payload:**
```json
{
  "care_recipient_id": "CR001",
  "shift_id": "CR001-2026-01-14-S1",
  "duration": 125,
  "audio_url": "file:///path/to/audio.m4a",
  "excluded_caregivers": ["CG001", "CG002"]
}
```

**Shift Note Payload:**
```json
{
  "caregiverId": "CG001",
  "caregiverName": "Alice Johnson",
  "content": "Patient was cooperative during morning routine"
}
```

---

### 🚀 What's Next

**Potential Future Enhancements:**
1. Cloud storage integration for audio files (currently local URIs)
2. Audio playback in caregiver app
3. Shift handoff reports (auto-generated from shift notes)
4. Push notifications when new recordings/notes are added
5. Search and filter functionality for notes
6. Bulk operations for shift management

---

### 👥 Contributors

- Development and implementation: Claude Code Assistant
- Feature requests and testing: Development Team

---

### 📞 Support

If you encounter any issues:
1. Check that backend server is running (`python app.py`)
2. Verify API URL in `src/services/api.js` matches your network setup
3. Check console logs for detailed error messages
4. Ensure database migration (above) was run successfully

---

## Summary of Changes by File

### Backend Changes
- ✅ `backend/app.py` - Added recordings POST endpoint, shift notes table & endpoints
- ✅ `backend/README.md` - Documented new endpoints with examples
- ✅ `backend/elderly_care.db` - Removed from git (added to .gitignore)

### Frontend Changes
- ✅ `src/services/api.js` - Added createRecording() and shift notes methods
- ✅ `src/screens/CareRecipientHome.js` - Implemented backend upload (old code commented)
- ✅ `src/screens/CareRecipientDetail.js` - Integrated backend data, made shifts touchable
- ✅ `src/screens/ShiftDetail.js` - Added shift notes section, kept recordings section

### Configuration Changes
- ✅ `.gitignore` - Added database files and Claude temp files

### Documentation
- ✅ `CHANGELOG.md` - This file!

---

**Version:** 1.1.0
**Date:** January 14, 2026
**Status:** ✅ All changes tested and deployed
