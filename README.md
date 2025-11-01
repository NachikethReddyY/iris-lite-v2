# Iris Auth Lite 🔐

Fully offline iris capture, enhancement, and verification powered by React Native, Expo, and on-device super-resolution.

## Features

- **On-Device Iris Capture**: Five-frame bursts per eye with deterministic quality scoring
- **QuickSRNet Super-Resolution**: Bundled ONNX model enhances captures locally in under 500 ms
- **Secure Template Storage**: Encrypted Secure Store keeps biometric templates and PINs private
- **Session Controls**: Configurable timeouts and detailed verification logs
- **Modern UI**: Responsive Expo Router experience with onboarding, verification, and settings flows

## Technology Stack

- **React Native** with Expo
- **Expo Local Authentication** for biometric auth
- **Expo Secure Store** for encrypted persistence
- **onnxruntime-react-native** for on-device neural inference
- **TypeScript** for type safety

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd iris-auth
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npx expo start
   ```

4. Open the app on your device/simulator
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## Usage

### Authentication Flow

1. **First Launch**: The app will prompt for biometric authentication
2. **Biometric Setup**: Ensure your device has biometric authentication enabled
3. **Secure Access**: Once authenticated, you'll have access to all features
4. **Session Management**: Authentication persists for 24 hours

### Features

#### Dashboard
- Welcome screen with user information
- AI chat interface for interactive conversations
- Feature overview cards
- Secure logout functionality

#### AI Scanner
- AI-powered scanning technology
- Biometric data analysis
- Real-time AI responses
- Secure processing

## Configuration

### Environment Variables

No external API keys are required. The full iris pipeline runs locally.

### iOS Configuration

The app is configured to request Face ID permissions. The usage description is set in `app.json`:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSFaceIDUsageDescription": "Iris-Auth uses Face ID for secure biometric authentication."
      }
    }
  }
}
```

## Security Features

- **On-Device Pipeline**: Capture, fusion, enhancement, and matching stay local
- **Encrypted Storage**: All sensitive data is encrypted using Expo Secure Store
- **Session Timeout**: Automatic logout after 24 hours (configurable)
- **Detailed Logs**: Local audit trail with confidence scores and sources

## Development

### Project Structure

```
app/
├── index.tsx             # Main entry point
├── _layout.tsx           # Root layout with AuthProvider
└── (tabs)/
    ├── dashboard.tsx     # Main dashboard
    ├── settings.tsx      # Settings and device management
    └── _layout.tsx       # Tab navigation

contexts/
└── AuthContext.tsx       # Authentication context

services/
└── authService.ts        # Authentication and AI services
```

### Key Components

- **AuthProvider**: Manages authentication state across the app
- **AuthService**: Handles biometrics, Secure Store persistence, and session logic
- **Dashboard**: Main authenticated interface
- **Iris Capture Flow**: Dual-eye enrollment and verification with on-device super-resolution

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both iOS and Android
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue on GitHub
- Check the Expo documentation
- Join the Expo Discord community
# iris-lite-v2
