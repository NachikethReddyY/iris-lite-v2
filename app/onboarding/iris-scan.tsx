import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView, Animated } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { authService } from '@/services/authService';

export default function IrisScanScreen() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const [quality, setQuality] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const totalFrames = 8;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (isScanning) {
      // Start scanning animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnimation, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanAnimation.setValue(0);
      pulseAnimation.setValue(1);
    }
  }, [isScanning]);

  useEffect(() => {
    if (isScanning && currentFrame < totalFrames) {
      const timer = setTimeout(() => {
        captureFrame();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isScanning, currentFrame]);

  const captureFrame = async () => {
    try {
      // Mock frame capture
      const frameData = `mock_iris_frame_${currentFrame}_${Date.now()}`;
      const newFrames = [...frames, frameData];
      setFrames(newFrames);
      
      // Mock quality assessment
      const frameQuality = Math.random() * 0.3 + 0.7; // 70-100%
      setQuality(frameQuality);
      
      if (currentFrame < totalFrames - 1) {
        setCurrentFrame(currentFrame + 1);
      } else {
        // All frames captured
        setIsScanning(false);
        setIsComplete(true);
        await processFrames(newFrames);
      }
    } catch (error) {
      console.error('Error capturing frame:', error);
      Alert.alert('Error', 'Failed to capture frame. Please try again.');
      setIsScanning(false);
    }
  };

  const processFrames = async (capturedFrames: string[]) => {
    try {
      // Enhance frames with AI
      const enhancedFrames = await authService.enhanceIrisQuality(capturedFrames);
      
      // Create iris template
      const template = {
        id: Date.now().toString(),
        frames: enhancedFrames,
        quality: quality,
        createdAt: Date.now()
      };
      
      // Store template
      await authService.storeIrisTemplate(template);
      
      // Add success log
      await authService.addAuthLog({
        timestamp: Date.now(),
        type: 'success',
        details: 'Iris enrollment completed',
        confidence: quality
      });
      
    } catch (error) {
      console.error('Error processing frames:', error);
      Alert.alert('Error', 'Failed to process iris data. Please try again.');
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setCurrentFrame(0);
    setFrames([]);
    setQuality(0);
    setIsComplete(false);
  };

  const handleComplete = () => {
    router.replace('/(tabs)/dashboard');
  };

  const handleBack = () => {
    if (isScanning) {
      Alert.alert(
        'Cancel Enrollment',
        'Are you sure you want to cancel iris enrollment?',
        [
          { text: 'Continue Enrollment', style: 'cancel' },
          { text: 'Cancel', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  const getStatusText = () => {
    if (isComplete) return 'Enrollment Complete!';
    if (isScanning) return `Capturing frame ${currentFrame + 1} of ${totalFrames}`;
    return 'Ready to capture iris';
  };

  const getStatusColor = () => {
    if (isComplete) return '#34C759';
    if (isScanning) return '#007AFF';
    return '#999';
  };

  const scanLineTranslateY = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Iris Enrollment
          </ThemedText>
          
          <ThemedText style={styles.subtitle}>
            {isComplete 
              ? 'Your iris has been successfully enrolled'
              : 'Position your eye in the center and look directly at the camera'
            }
          </ThemedText>

          <View style={styles.cameraContainer}>
            <Animated.View
              style={[
                styles.cameraFrame,
                {
                  transform: [{ scale: isScanning ? pulseAnimation : 1 }],
                  borderColor: getStatusColor(),
                }
              ]}
            >
              {/* Camera Preview Circle */}
              {hasPermission ? (
                <View style={styles.cameraPreview}>
                  <Ionicons name="eye" size={80} color={getStatusColor()} />
                  <View style={styles.cameraText}>
                    <ThemedText style={styles.cameraTextLabel}>Camera Ready</ThemedText>
                  </View>
                </View>
              ) : (
                <View style={styles.cameraPreview}>
                  <Ionicons name="eye" size={80} color={getStatusColor()} />
                  <View style={styles.cameraText}>
                    <ThemedText style={styles.cameraTextLabel}>Requesting Camera...</ThemedText>
                  </View>
                </View>
              )}
              
              {/* Face ID-style scanning grid */}
              {isScanning && (
                <>
                  <View style={styles.gridOverlay}>
                    {[...Array(5)].map((_, i) => (
                      <View key={`h-${i}`} style={styles.gridLineHorizontal} />
                    ))}
                    {[...Array(5)].map((_, i) => (
                      <View key={`v-${i}`} style={styles.gridLineVertical} />
                    ))}
                  </View>
                  
                  <Animated.View 
                    style={[
                      styles.scanningLine,
                      {
                        transform: [{ translateY: scanLineTranslateY }]
                      }
                    ]} 
                  />
                </>
              )}
              
              {/* Corner brackets */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </Animated.View>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((currentFrame + (isComplete ? 1 : 0)) / totalFrames) * 100}%` }
                ]} 
              />
            </View>
            <ThemedText style={styles.progressText}>
              {currentFrame + (isComplete ? 1 : 0)} / {totalFrames} frames
            </ThemedText>
          </View>
          
          <View style={styles.statusContainer}>
            <Ionicons 
              name={isComplete ? "checkmark-circle" : isScanning ? "scan" : "eye"} 
              size={24} 
              color={getStatusColor()} 
            />
            <ThemedText style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </ThemedText>
          </View>
          
          {quality > 0 && (
            <View style={styles.qualityContainer}>
              <ThemedText style={styles.qualityLabel}>Quality:</ThemedText>
              <ThemedText style={styles.qualityValue}>
                {Math.round(quality * 100)}%
              </ThemedText>
            </View>
          )}
          
          <View style={styles.instructionsContainer}>
            <ThemedText style={styles.instructionsTitle}>Instructions:</ThemedText>
            <ThemedText style={styles.instructionText}>
              • Keep your eye steady and open{'\n'}
              • Look directly at the camera{'\n'}
              • Ensure good lighting{'\n'}
              • Don't blink during capture
            </ThemedText>
          </View>
          
          {!isScanning && !isComplete && (
            <TouchableOpacity style={styles.startButton} onPress={startScanning}>
              <Ionicons name="camera" size={24} color="white" />
              <ThemedText style={styles.buttonText}>Start Capture</ThemedText>
            </TouchableOpacity>
          )}
          
          {isComplete && (
            <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
              <ThemedText style={styles.buttonText}>Complete Setup</ThemedText>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  cameraContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  cameraFrame: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  cameraPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  cameraText: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  cameraTextLabel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  gridLineHorizontal: {
    height: 1,
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
  gridLineVertical: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    left: `${20 * (Math.random() * 5)}%`,
  },
  scanningLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#007AFF',
  },
  cornerTopLeft: {
    top: 10,
    left: 10,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 10,
  },
  cornerTopRight: {
    top: 10,
    right: 10,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 10,
  },
  cornerBottomLeft: {
    bottom: 10,
    left: 10,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 10,
  },
  cornerBottomRight: {
    bottom: 10,
    right: 10,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 10,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    opacity: 0.7,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  qualityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  qualityLabel: {
    fontSize: 16,
    opacity: 0.7,
  },
  qualityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
  },
  instructionsContainer: {
    width: '100%',
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 15,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.8,
  },
  startButton: {
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
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
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
});
