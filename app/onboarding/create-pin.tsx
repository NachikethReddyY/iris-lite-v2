import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { authService } from '@/services/authService';
import { router } from 'expo-router';

const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [' ', '0', 'back'],
];

export default function CreatePinScreen() {
  const insets = useSafeAreaInsets();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const activePin = isConfirming ? confirmPin : pin;
  const canAdvance = activePin.length >= 4;

  const handleNumberPress = (value: string) => {
    if (value === 'back') {
      if (isConfirming && confirmPin.length) {
        setConfirmPin(confirmPin.slice(0, -1));
      } else if (!isConfirming && pin.length) {
        setPin(pin.slice(0, -1));
      }
      return;
    }

    if (value.trim().length === 0) {
      return;
    }

    if (isConfirming) {
      if (confirmPin.length < 4) {
        setConfirmPin(confirmPin + value);
      }
    } else if (pin.length < 4) {
      setPin(pin + value);
    }
  };

  const handlePrimaryAction = async () => {
    if (activePin.length < 4) {
      Alert.alert('Incomplete PIN', 'Please enter a 4-digit PIN.');
      return;
    }

    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'The PIN entries do not match. Re-enter your PIN.');
      setPin('');
      setConfirmPin('');
      setIsConfirming(false);
      return;
    }

    try {
      await authService.setPIN(pin);
      router.push('/onboarding/connect-pi');
    } catch (error) {
      console.error('Failed to store PIN:', error);
      Alert.alert('Error', 'We could not save your PIN. Please try again.');
    }
  };

  const handleBack = () => {
    if (isConfirming) {
      setIsConfirming(false);
      setConfirmPin('');
      return;
    }
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            <View style={styles.dotMatrix}>
              {Array.from({ length: 9 }).map((_, index) => (
                <View key={index} style={styles.matrixDot} />
              ))}
            </View>
          </View>

          <ThemedText style={styles.titleText}>
            {isConfirming ? 'Confirm PIN' : 'Create Security PIN'}
          </ThemedText>
          <ThemedText style={styles.subtitleText}>
            {isConfirming
              ? 'Re-enter your PIN to make sure it matches.'
              : 'Set a PIN used for securing sensitive actions like deleting iris data.'}
          </ThemedText>

          <View style={styles.pinRow}>
            {Array.from({ length: 4 }).map((_, index) => {
              const filled = index < activePin.length;
              return <View key={index} style={[styles.pinDot, filled && styles.pinDotFilled]} />;
            })}
          </View>

          <View style={styles.keypadContainer}>
            {KEYPAD.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.keypadRow}>
                {row.map((value) => {
                  if (value === ' ') {
                    return <View key="empty" style={[styles.keypadButton, styles.keypadPlaceholder]} />;
                  }

                  if (value === 'back') {
                    return (
                      <TouchableOpacity
                        key="backspace"
                        style={styles.keypadButton}
                        onPress={() => handleNumberPress(value)}
                      >
                        <Ionicons name="backspace" size={20} color="#007AFF" />
                      </TouchableOpacity>
                    );
                  }

                  const disabled =
                    (isConfirming && confirmPin.length >= 4) ||
                    (!isConfirming && pin.length >= 4);

                  return (
                    <TouchableOpacity
                      key={value}
                      style={[styles.keypadButton, disabled && styles.keypadButtonDisabled]}
                      disabled={disabled}
                      onPress={() => handleNumberPress(value)}
                    >
                      <ThemedText
                        style={[
                          styles.keypadText,
                          disabled && styles.keypadTextDisabled,
                        ]}
                      >
                        {value}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, !canAdvance && styles.primaryButtonDisabled]}
            onPress={handlePrimaryAction}
            disabled={!canAdvance}
          >
            <ThemedText
              style={[styles.primaryButtonText, !canAdvance && styles.primaryButtonTextDisabled]}
            >
              {isConfirming ? 'Complete Setup' : 'Next'}
            </ThemedText>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={canAdvance ? '#FFFFFF' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  headerButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: 24,
    padding: 28,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
  },
  dotMatrix: {
    width: 64,
    height: 64,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  matrixDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 15,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 32,
  },
  pinRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 36,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  pinDotFilled: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  keypadContainer: {
    width: 260,
    marginBottom: 36,
    gap: 18,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  keypadPlaceholder: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  keypadButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  keypadText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  keypadTextDisabled: {
    color: '#9CA3AF',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 28,
    gap: 10,
    backgroundColor: '#007AFF',
  },
  primaryButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  primaryButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
