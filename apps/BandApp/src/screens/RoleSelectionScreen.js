import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView
} from 'react-native';

export default function RoleSelectionScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>
          Select how you want to use the app
        </Text>

        <TouchableOpacity
          style={[styles.roleButton, styles.managerButton]}
          onPress={() => navigation.navigate('ManagerApp')}
        >
          <Text style={styles.roleEmoji}>⚙️</Text>
          <Text style={styles.roleTitle}>Manager Mode</Text>
          <Text style={styles.roleDescription}>
            • Confirm payments{'\n'}
            • Manage song catalog{'\n'}
            • Create set lists{'\n'}
            • Generate QR codes{'\n'}
            • Full access to all features
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, styles.leaderButton]}
          onPress={() => navigation.navigate('LeaderApp')}
        >
          <Text style={styles.roleEmoji}>🎤</Text>
          <Text style={styles.roleTitle}>Leader Mode</Text>
          <Text style={styles.roleDescription}>
            • View song queue{'\n'}
            • Mark songs as played{'\n'}
            • View/edit set list{'\n'}
            • Streamlined for performing
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 40,
  },
  roleButton: {
    borderRadius: 16,
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
  },
  managerButton: {
    backgroundColor: '#2c5282',
  },
  leaderButton: {
    backgroundColor: '#9C27B0',
  },
  roleEmoji: {
    fontSize: 64,
    marginBottom: 15,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  roleDescription: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
  },
});
