# Iris-Auth 🔐

A secure biometric authentication app built with React Native and Expo, powered by AI scanning technology.

## Features

- **Biometric Authentication**: Secure login using fingerprint and facial recognition
- **AI-Powered Scanning**: Advanced AI technology for biometric data analysis
- **Secure Storage**: Encrypted storage of authentication data
- **Cross-Platform**: Works on iOS, Android, and Web
- **Modern UI**: Beautiful, responsive interface with dark/light mode support

## Technology Stack

- **React Native** with Expo
- **Expo Local Authentication** for biometric auth
- **Google Gemini AI** for AI-powered features
- **Expo Secure Store** for secure data storage
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

The app uses the following environment variables:

- `GEMINI_API_KEY`: Your Google Gemini API key for AI features

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

- **On-Device Processing**: Biometric data never leaves your device
- **Encrypted Storage**: All sensitive data is encrypted using Expo Secure Store
- **Session Timeout**: Automatic logout after 24 hours
- **Secure API**: Gemini API integration with secure key management

## Development

### Project Structure

```
app/
├── auth.tsx              # Authentication screen
├── index.tsx             # Main entry point
├── _layout.tsx           # Root layout with AuthProvider
└── (tabs)/
    ├── dashboard.tsx     # Main dashboard
    ├── explore.tsx       # AI scanner features
    └── _layout.tsx       # Tab navigation

contexts/
└── AuthContext.tsx       # Authentication context

services/
└── authService.ts        # Authentication and AI services
```

### Key Components

- **AuthProvider**: Manages authentication state across the app
- **AuthService**: Handles biometric authentication and AI integration
- **Dashboard**: Main authenticated interface
- **AI Scanner**: Advanced scanning features

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
