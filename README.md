# Elderly Care App: Align

## Problem Statement
Develop a solution that improve relationships between caregiver and the care recipient so that caregivers can provide the care that the care recipients want/need in a mutually respectful, meaningful, and joyful way.

## Our Proposed Solution
A React Native mobile application designed to help NPOs caring for elderly individuals. The app provides voice recording capabilities for care recipients and comprehensive shift management tools for caregivers.

## Features

### For Care Recipients
- Simple voice recording interface
- Visual feedback during recording
- Easy-to-use single-button design
- Straightforward interface to share recordings to caregivers
- Able to select which caregivers receive the recording

### For Caregivers
- View assigned care recipients
- Access work shifts organized by day
- Listen to voice recordings from care recipients
- Create and view notes for each recording
- Collaborate with other caregivers through shared notes
- Analyse shift notes with AI
- Learn from improvements suggested by AI

## Tech Stack

- React Native (with Expo)
- React Navigation for routing
- Expo AV for audio recording
- Supabase for data storage
- Railway for CI/CD

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Hack4Good.git
cd Hack4Good
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your device:
   - Install Expo Go app on your iOS or Android device ( we recommend Android)
   - Scan the QR code from the terminal


## User Flow

### Care Recipient Flow
1. Login with ID → 2. Record voice messages -> 3. Record again OR delete recordings OR select caregivers to send recordings to

### Caregiver Flow
1. Login with ID → 2. View care recipients → 3. Select recipient → 4. View shifts → 5. Access recordings → 6. Play recording, manage, view and write notes and analyse notes with AI

## Future Enhancements

- Cloud storage integration for audio files
- Real-time synchronization
- Push notifications
- Advanced analytics dashboard
- Multi-language support
- Offline mode support
- Enhanced security features


## License

MIT

## Go to SETUP.md for technical details on how to get our app up and running.
