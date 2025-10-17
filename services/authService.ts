import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = 'AIzaSyDwr9i19AK67Nv7AiDIR12OsMnRFPtbXYo';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  sessionExpiry: number | null;
}

export interface AuthLog {
  id: string;
  timestamp: number;
  type: 'success' | 'failure' | 'expired' | 'pin_success' | 'pin_failure';
  details: string;
  confidence?: number;
}

export interface AuthStats {
  successRate: number;
  totalAttempts: number;
  weeklyAttempts: number;
  failureReasons: { [key: string]: number };
  recentTrends: { date: string; count: number }[];
}

export interface IrisTemplate {
  id: string;
  frames: string[]; // Base64 encoded iris frames
  quality: number;
  createdAt: number;
}

export class AuthService {
  private genAI: GoogleGenerativeAI;
  private sessionTimeout: number = 10 * 60 * 1000; // 10 minutes default

  constructor() {
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }

  async checkBiometricAvailability(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  async authenticateWithBiometrics(): Promise<boolean> {
    try {
      const isAvailable = await this.checkBiometricAvailability();
      if (!isAvailable) {
        throw new Error('Biometric authentication not available');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with Iris-Auth',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Store authentication state
        await SecureStore.setItemAsync('isAuthenticated', 'true');
        await SecureStore.setItemAsync('authTimestamp', Date.now().toString());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  async checkAuthenticationStatus(): Promise<boolean> {
    try {
      const isAuthenticated = await SecureStore.getItemAsync('isAuthenticated');
      const authTimestamp = await SecureStore.getItemAsync('authTimestamp');
      
      if (!isAuthenticated || !authTimestamp) {
        return false;
      }

      // Check if authentication is still valid (24 hours)
      const now = Date.now();
      const authTime = parseInt(authTimestamp);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (now - authTime > twentyFourHours) {
        await this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('isAuthenticated');
      await SecureStore.deleteItemAsync('authTimestamp');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  async generateAIResponse(prompt: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async scanWithAI(imageData: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent([
        'Analyze this image and provide detailed insights about what you see.',
        {
          inlineData: {
            data: imageData,
            mimeType: 'image/jpeg'
          }
        }
      ]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error scanning with AI:', error);
      throw new Error('Failed to scan image with AI');
    }
  }

  // PIN Management
  async setPIN(pin: string): Promise<void> {
    try {
      await SecureStore.setItemAsync('user_pin', pin);
    } catch (error) {
      console.error('Error setting PIN:', error);
      throw new Error('Failed to set PIN');
    }
  }

  async verifyPIN(pin: string): Promise<boolean> {
    try {
      const storedPIN = await SecureStore.getItemAsync('user_pin');
      return storedPIN === pin;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  }

  async changePIN(oldPin: string, newPin: string): Promise<boolean> {
    try {
      const isValid = await this.verifyPIN(oldPin);
      if (isValid) {
        await this.setPIN(newPin);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error changing PIN:', error);
      return false;
    }
  }

  // Iris Template Management
  async storeIrisTemplate(template: IrisTemplate): Promise<void> {
    try {
      await SecureStore.setItemAsync('iris_template', JSON.stringify(template));
    } catch (error) {
      console.error('Error storing iris template:', error);
      throw new Error('Failed to store iris template');
    }
  }

  async getIrisTemplate(): Promise<IrisTemplate | null> {
    try {
      const template = await SecureStore.getItemAsync('iris_template');
      return template ? JSON.parse(template) : null;
    } catch (error) {
      console.error('Error getting iris template:', error);
      return null;
    }
  }

  async deleteIrisTemplate(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('iris_template');
    } catch (error) {
      console.error('Error deleting iris template:', error);
    }
  }

  // Iris Scanning with 8-frame capture
  async captureIrisFrames(): Promise<string[]> {
    // This would integrate with camera and Raspberry Pi
    // For now, return mock data
    const frames: string[] = [];
    for (let i = 0; i < 8; i++) {
      frames.push(`mock_iris_frame_${i}_base64_data`);
    }
    return frames;
  }

  async enhanceIrisQuality(frames: string[]): Promise<string[]> {
    try {
      const enhancedFrames: string[] = [];
      for (const frame of frames) {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent([
          'Enhance this iris image for better biometric recognition. Focus on clarity, contrast, and removing artifacts.',
          {
            inlineData: {
              data: frame,
              mimeType: 'image/jpeg'
            }
          }
        ]);
        // In a real implementation, this would return enhanced image data
        enhancedFrames.push(frame); // Mock return
      }
      return enhancedFrames;
    } catch (error) {
      console.error('Error enhancing iris quality:', error);
      return frames; // Return original frames if enhancement fails
    }
  }

  async verifyIrisMatch(capturedFrames: string[]): Promise<{ success: boolean; confidence: number; details: string }> {
    try {
      const storedTemplate = await this.getIrisTemplate();
      if (!storedTemplate) {
        return { success: false, confidence: 0, details: 'No iris template found' };
      }

      // Mock iris matching logic
      // In a real implementation, this would use advanced biometric algorithms
      const confidence = Math.random() * 0.3 + 0.7; // Mock confidence between 70-100%
      const success = confidence > 0.85;

      return {
        success,
        confidence,
        details: success ? 'Iris match confirmed' : 'Iris match failed'
      };
    } catch (error) {
      console.error('Error verifying iris match:', error);
      return { success: false, confidence: 0, details: 'Verification error' };
    }
  }

  // Authentication Logging
  async addAuthLog(log: Omit<AuthLog, 'id'>): Promise<void> {
    try {
      const logs = await this.getAuthLogs();
      const newLog: AuthLog = {
        ...log,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      };
      logs.unshift(newLog);
      
      // Keep only last 50 logs
      if (logs.length > 50) {
        logs.splice(50);
      }
      
      await SecureStore.setItemAsync('auth_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Error adding auth log:', error);
    }
  }

  async getAuthLogs(): Promise<AuthLog[]> {
    try {
      const logs = await SecureStore.getItemAsync('auth_logs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Error getting auth logs:', error);
      return [];
    }
  }

  async clearAuthLogs(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('auth_logs');
    } catch (error) {
      console.error('Error clearing auth logs:', error);
    }
  }

  // Statistics
  async getAuthStats(): Promise<AuthStats> {
    try {
      const logs = await this.getAuthLogs();
      const now = Date.now();
      const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
      
      const recentLogs = logs.filter(log => log.timestamp > weekAgo);
      const successLogs = recentLogs.filter(log => log.type === 'success' || log.type === 'pin_success');
      
      const successRate = recentLogs.length > 0 ? (successLogs.length / recentLogs.length) * 100 : 0;
      
      const failureReasons: { [key: string]: number } = {};
      recentLogs
        .filter(log => log.type === 'failure')
        .forEach(log => {
          failureReasons[log.details] = (failureReasons[log.details] || 0) + 1;
        });

      // Generate recent trends (last 7 days)
      const trends = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now - (i * 24 * 60 * 60 * 1000));
        const dayStart = date.setHours(0, 0, 0, 0);
        const dayEnd = dayStart + (24 * 60 * 60 * 1000);
        
        const dayLogs = logs.filter(log => log.timestamp >= dayStart && log.timestamp < dayEnd);
        trends.push({
          date: date.toISOString().split('T')[0],
          count: dayLogs.length
        });
      }

      return {
        successRate: Math.round(successRate),
        totalAttempts: logs.length,
        weeklyAttempts: recentLogs.length,
        failureReasons,
        recentTrends: trends
      };
    } catch (error) {
      console.error('Error getting auth stats:', error);
      return {
        successRate: 0,
        totalAttempts: 0,
        weeklyAttempts: 0,
        failureReasons: {},
        recentTrends: []
      };
    }
  }

  // Session Management
  setSessionTimeout(timeout: number): void {
    this.sessionTimeout = timeout;
  }

  getSessionTimeout(): number {
    return this.sessionTimeout;
  }

  async getSessionExpiry(): Promise<number | null> {
    try {
      const expiry = await SecureStore.getItemAsync('session_expiry');
      return expiry ? parseInt(expiry) : null;
    } catch (error) {
      console.error('Error getting session expiry:', error);
      return null;
    }
  }

  async setSessionExpiry(): Promise<void> {
    try {
      const expiry = Date.now() + this.sessionTimeout;
      await SecureStore.setItemAsync('session_expiry', expiry.toString());
    } catch (error) {
      console.error('Error setting session expiry:', error);
    }
  }

  async isSessionValid(): Promise<boolean> {
    try {
      const expiry = await this.getSessionExpiry();
      if (!expiry) return false;
      
      const now = Date.now();
      if (now > expiry) {
        await this.logout();
        await this.addAuthLog({
          timestamp: now,
          type: 'expired',
          details: 'Session expired'
        });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  }
}

export const authService = new AuthService();
