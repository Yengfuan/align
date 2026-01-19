# Elderly Care App - Hack4Good

A React Native mobile application designed to help NPOs caring for elderly individuals. The app provides voice recording capabilities for care recipients and comprehensive shift management tools for caregivers.

## Features

### For Care Recipients
- Simple voice recording interface
- Visual feedback during recording
- Easy-to-use single-button design

### For Caregivers
- View assigned care recipients
- Access work shifts organized by day
- Listen to voice recordings from care recipients
- Create and view notes for each recording
- Collaborate with other caregivers through shared notes

## Tech Stack

- React Native (with Expo)
- React Navigation for routing
- Expo AV for audio recording
- Mock data for initial development

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
   - Install Expo Go app on your iOS or Android device
   - Scan the QR code from the terminal

### Demo Login Credentials

- **Care Recipient**: CR001
- **Caregiver**: CG001

## Project Structure

```
Hack4Good/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── CareRecipientHome.js
│   │   ├── CaregiverHome.js
│   │   ├── CareRecipientDetail.js
│   │   ├── ShiftDetail.js
│   │   └── RecordingDetail.js
│   └── data/
│       └── mockData.js
├── App.js
├── app.json
├── package.json
└── README.md
```

## User Flow

### Care Recipient Flow
1. Login with ID → 2. Record voice messages

### Caregiver Flow
1. Login with ID → 2. View care recipients → 3. Select recipient → 4. View shifts → 5. Access recordings → 6. Play recording & manage notes

## Future Enhancements

- Cloud storage integration for audio files
- Real-time synchronization
- Push notifications
- Advanced analytics dashboard
- Multi-language support
- Offline mode support
- Enhanced security features

## Contributing

This is a basic prototype ready for UI/UX improvements. Feel free to:
- Enhance the visual design
- Add animations and transitions
- Improve accessibility
- Add new features

## License

MIT
