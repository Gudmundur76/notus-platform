# Manus AI Mobile App

React Native mobile companion app for the Manus AI replica platform.

## Features

- ✅ Task submission with quick action buttons
- ✅ Task history and results dashboard
- ✅ Mirror agents monitoring
- ✅ Training feedback submission
- ✅ Memory management
- ✅ Real-time updates via tRPC
- ✅ Cross-platform (iOS & Android)

## Prerequisites

- Node.js 18+ and npm/pnpm
- Expo CLI (`npm install -g expo-cli`)
- For iOS: macOS with Xcode
- For Android: Android Studio with emulator OR physical device
- Backend server running (see main project README)

## Setup Instructions

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Backend URL

Create a `.env` file in the `mobile` directory:

```bash
# For local development, use your computer's IP address (not localhost)
# Find your IP: 
#   - macOS/Linux: ifconfig | grep "inet "
#   - Windows: ipconfig
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api/trpc
```

**Important:** Do NOT use `localhost` or `127.0.0.1` - use your actual local network IP address so the mobile app can connect to your backend.

### 3. Start the Backend Server

Make sure your backend server is running:

```bash
cd /home/ubuntu/manus_replica
pnpm run dev
```

The backend should be accessible at `http://YOUR_IP:3000`

### 4. Start the Mobile App

```bash
npm start
```

This will open Expo DevTools in your browser.

### 5. Run on Device/Emulator

#### Option A: Physical Device (Recommended)

1. Install **Expo Go** app from App Store (iOS) or Google Play (Android)
2. Scan the QR code shown in the terminal with your phone camera
3. The app will open in Expo Go

#### Option B: Android Emulator

```bash
npm run android
```

#### Option C: iOS Simulator (macOS only)

```bash
npm run ios
```

## Project Structure

```
mobile/
├── screens/              # Screen components
│   ├── HomeScreen.tsx    # Task submission
│   ├── DashboardScreen.tsx  # Task history
│   ├── AgentsScreen.tsx  # Mirror agents
│   ├── TrainingScreen.tsx   # Feedback submission
│   └── MemoryScreen.tsx  # Memory management
├── navigation/           # Navigation setup
│   └── AppNavigator.tsx  # Tab navigation
├── lib/                  # Utilities
│   └── trpc.ts          # tRPC client config
├── App.tsx              # Root component
└── package.json         # Dependencies

## Troubleshooting

### Cannot connect to backend

- Verify your backend is running: `curl http://YOUR_IP:3000/api/trpc`
- Check firewall settings allow connections on port 3000
- Ensure you're using your local network IP, not localhost
- Try disabling VPN if active

### "Network request failed"

- Make sure your phone and computer are on the same WiFi network
- Check the EXPO_PUBLIC_API_URL in your `.env` file
- Restart the Expo dev server

### Android emulator not starting

- Open Android Studio and start the emulator manually
- Run `adb devices` to verify the emulator is detected
- Try `npm run android` again

### iOS build errors

- Run `cd ios && pod install` (if ios folder exists)
- Clean build: `rm -rf ios/build`
- Restart Xcode and try again

## Development

### Adding New Screens

1. Create screen component in `screens/`
2. Add to navigation in `navigation/AppNavigator.tsx`
3. Connect to backend via `trpc` hooks

### Using tRPC

```typescript
import { trpc } from '../lib/trpc';

// Query example
const { data, isLoading } = trpc.tasks.getTasks.useQuery();

// Mutation example
const submitTask = trpc.tasks.submitTask.useMutation({
  onSuccess: () => console.log('Task submitted!'),
});

submitTask.mutate({ description: 'My task', type: 'general' });
```

## Building for Production

### Android APK

```bash
expo build:android -t apk
```

### iOS App

```bash
expo build:ios
```

Note: iOS builds require an Apple Developer account.

## Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **React Navigation** - Navigation
- **tRPC** - Type-safe API client
- **React Query** - Data fetching
- **TypeScript** - Type safety

## License

Same as main project
