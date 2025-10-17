import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { authService } from '@/services/authService';

export default function CreatePinScreen() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const handleNumberPress = (number: string) => {
    if (isConfirming) {
      if (confirmPin.length < 4) {
        setConfirmPin(confirmPin + number);
      }
    } else {
      if (pin.length < 4) {
        setPin(pin + number);
      }
    }
  };

  const handleBackspace = () => {
    if (isConfirming) {
      setConfirmPin(confirmPin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const handleContinue = async () => {
    if (pin.length < 4) {
      Alert.alert('Invalid PIN', 'PIN must be at least 4 digits long.');
      return;
    }

    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'The PINs do not match. Please try again.');
      setPin('');
      setConfirmPin('');
      setIsConfirming(false);
      return;
    }

    try {
      await authService.setPIN(pin);
      router.push('/onboarding/connect-pi');
    } catch (error) {
      Alert.alert('Error', 'Failed to set PIN. Please try again.');
    }
  };

  const handleBack = () => {
    if (isConfirming) {
      setIsConfirming(false);
      setConfirmPin('');
    } else {
      router.back();
    }
  };

  const currentPin = isConfirming ? confirmPin : pin;
  const canContinue = isConfirming ? confirmPin.length >= 4 : pin.length >= 4;

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.keypadIcon}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <View key={i} style={styles.iconDot} />
            ))}
          </View>
        </View>

        <ThemedText style={styles.title}>
          {isConfirming ? 'Confirm PIN' : 'Create Security PIN'}
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          {isConfirming
            ? 'Enter your PIN again to confirm'
            : 'Create a PIN to securely delete your iris data if needed'
          }
        </ThemedText>

        <View style={styles.pinDisplay}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[
                styles.pinDot,
                index < currentPin.length && styles.pinDotFilled
              ]}
            />
          ))}
        </View>

        <View style={styles.keypad}>
          <View style={styles.keypadRow}>
            {[1, 2, 3].map((number) => (
              <TouchableOpacity
                key={number}
                style={[
                  styles.keypadButton,
                  (isConfirming ? confirmPin.length >= 4 : pin.length >= 4) && styles.keypadButtonDisabled
                ]}
                onPress={() => handleNumberPress(number.toString())}
                disabled={isConfirming ? confirmPin.length >= 4 : pin.length >= 4}
              >
                <ThemedText style={[
                  styles.keypadText,
                  (isConfirming ? confirmPin.length >= 4 : pin.length >= 4) && styles.keypadTextDisabled
                ]}>{number}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keypadRow}>
            {[4, 5, 6].map((number) => (
              <TouchableOpacity
                key={number}
                style={[
                  styles.keypadButton,
                  (isConfirming ? confirmPin.length >= 4 : pin.length >= 4) && styles.keypadButtonDisabled
                ]}
                onPress={() => handleNumberPress(number.toString())}
                disabled={isConfirming ? confirmPin.length >= 4 : pin.length >= 4}
              >
                <ThemedText style={[
                  styles.keypadText,
                  (isConfirming ? confirmPin.length >= 4 : pin.length >= 4) && styles.keypadTextDisabled
                ]}>{number}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keypadRow}>
            {[7, 8, 9].map((number) => (
              <TouchableOpacity
                key={number}
                style={[
                  styles.keypadButton,
                  (isConfirming ? confirmPin.length >= 4 : pin.length >= 4) && styles.keypadButtonDisabled
                ]}
                onPress={() => handleNumberPress(number.toString())}
                disabled={isConfirming ? confirmPin.length >= 4 : pin.length >= 4}
              >
                <ThemedText style={[
                  styles.keypadText,
                  (isConfirming ? confirmPin.length >= 4 : pin.length >= 4) && styles.keypadTextDisabled
                ]}>{number}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keypadRow}>
            <View style={styles.keypadButton} />
            <TouchableOpacity
              style={[
                styles.keypadButton,
                (isConfirming ? confirmPin.length >= 4 : pin.length >= 4) && styles.keypadButtonDisabled
              ]}
              onPress={() => handleNumberPress('0')}
              disabled={isConfirming ? confirmPin.length >= 4 : pin.length >= 4}
            >
              <ThemedText style={[
                styles.keypadText,
                (isConfirming ? confirmPin.length >= 4 : pin.length >= 4) && styles.keypadTextDisabled
              ]}>0</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.keypadButton}
              onPress={handleBackspace}
            >
              <Ionicons name="backspace" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]} 
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <ThemedText style={[styles.buttonText, !canContinue && styles.buttonTextDisabled]}>
            {isConfirming ? 'Complete Setup' : 'Next'}
          </ThemedText>
          <Ionicons name="arrow-forward" size={20} color={canContinue ? "white" : "#999"} />
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    padding: 10,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
    padding: 20,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
  },
  pinDisplay: {
    flexDirection: 'row',
    marginBottom: 50,
    gap: 15,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  pinDotFilled: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  keypadIcon: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  iconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  keypad: {
    width: 280,
    marginBottom: 40,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  keypadButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  keypadText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  keypadButtonDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.5,
  },
  keypadTextDisabled: {
    color: '#999',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
    gap: 10,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  continueButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  buttonTextDisabled: {
    color: '#999',
  },
});
