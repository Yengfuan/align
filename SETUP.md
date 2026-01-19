# Setup Guide

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the app**
   ```bash
   npm start
   ```

3. **Run on your device**
   - Download "Expo Go" from App Store (iOS) or Play Store (Android)
   - Scan the QR code that appears in your terminal
   - The app will load on your device

## Testing the App

### Test as Care Recipient
1. Login with ID: `CR001` or `CR002`
2. You'll see a large record button
3. Tap to start recording (you'll need to grant microphone permission)
4. Tap again to stop recording
5. The recording can be uploaded, deleted or rerecorded

### Test as Caregiver
1. Login with ID: `CG001` or `CG002` or `CG003` or `CG004` or `CG005`
2. You'll see a list of different number of care recipients configured based on our database
3. Tap on any care recipient (e.g., "John Doe")
4. View the work shifts
5. Tap on a shift to see recordings
6. Tap on AI analysis to request API for suggestions on how to help the care recipient better
7. Tap on a recording to:
   - Play the audio
   - View existing notes
   - Add new notes

## Available Demo IDs

**Care Recipients:**
- CG001 (John Doe)
- CR002 (Aleena C)

**Caregivers:**
- CG001 (Gan Jia Xuan)
- CG002 (Seah Jun Jie)
- CG003 (Tan Feng Yuan)
- CG004 (Elysia Doe)
- CG005 (Daniel Hogan)

## Current Features

✅ Role-based authentication
✅ Voice recording with visual feedback
✅ Care recipient list view
✅ Shift management
✅ Recording playback interface
✅ Collaborative notes system
✅ Mock data stored on Supabase for prototype
✅ Functional groupchat between care recipients

## Troubleshooting

**App won't start:**
- Make sure you have Node.js installed
- Try deleting `node_modules` and running `npm install` again

**QR code not working:**
- Make sure your phone and computer are on the same WiFi network
- Try the tunnel connection option: `npm start --tunnel`

**Permission errors:**
- Grant microphone permission when prompted
- Check your phone's app settings if recording doesn't work
