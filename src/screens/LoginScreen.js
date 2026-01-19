import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import api from '../services/api';
import { Colors, TextStyles, InputStyles, ButtonStyles, Shadows } from '../styles/CommonStyles';

export default function LoginScreen({ navigation, setUser }) {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!userId.trim()) {
      Alert.alert('Error', 'Please enter your User ID');
      return;
    }

    try {
      setLoading(true);
      // Fetch user from Supabase
      const user = await api.getUser(userId.trim());

      if (user) {
        setUser(user);
        if (user.role === 'care-recipient') {
          // Fetch care recipient details
          try {
            const recipientDetails = await api.getCareRecipient(user.id);
            const fullUser = { ...user, ...recipientDetails };
            setUser(fullUser);
            navigation.replace('CareRecipientHome', { user: fullUser });
          } catch {
            // If no care_recipient record, just use user data
            navigation.replace('CareRecipientHome', { user });
          }
        } else if (user.role === 'caregiver') {
          // Fetch caregiver details
          try {
            const caregiverDetails = await api.getCaregiver(user.id);
            const fullUser = { ...user, ...caregiverDetails };
            setUser(fullUser);
            navigation.replace('CaregiverHome', { user: fullUser });
          } catch {
            // If no caregiver record, just use user data
            navigation.replace('CaregiverHome', { user });
          }
        } else {
          Alert.alert('Error', 'Unknown user role');
        }
      } else {
        Alert.alert('Error', 'Invalid User ID');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to login. Please check your User ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/caregiving-background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* Semi-transparent overlay */}
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.content}>
            {/* Logo/Title - Made larger and more prominent */}
            <Text style={styles.title}>ALIGN</Text>
            <Text style={styles.subtitle}>Login with your ID</Text>

            {/* Input Field - Reduced margin */}
            <TextInput
              style={styles.input}
              placeholder="Enter User ID"
              value={userId}
              onChangeText={setUserId}
              autoCapitalize="none"
              placeholderTextColor="#999"
              editable={!loading}
            />

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Help Text - Replaced demo IDs */}
            <View style={styles.helpSection}>
              <Text style={styles.helpText}>
                To access your ID, please reach out to your Tsao Foundation officer
              </Text>
            </View>
          </View>

          {/* Tsao Foundation Branding */}
          <View style={styles.branding}>
            <Text style={styles.brandingText}>
              Powered by <Text style={styles.brandingBold}>Tsao Foundation</Text>
            </Text>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
    backgroundColor: Colors.white,
    borderRadius: 16,
    ...Shadows.large,
  },
  title: {
    fontSize: 50,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 2.5,
    fontFamily: 'Helvetica',
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textGray,
    marginBottom: 5,
    textAlign: 'center',
  },
  input: {
    ...InputStyles.base,
    borderColor: Colors.gray400,
    marginBottom: 20,
  },
  button: {
    ...ButtonStyles.base,
    ...ButtonStyles.primary,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...TextStyles.buttonText,
  },
  helpSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  helpText: {
    ...TextStyles.small,
    textAlign: 'center',
    lineHeight: 20,
  },
  branding: {
    marginTop: 3,
  },
  brandingText: {
    fontSize: 13,
    color: Colors.black,
    textAlign: 'center',
  },
  brandingBold: {
    fontWeight: '600',
    color: Colors.primary,
  },
});
