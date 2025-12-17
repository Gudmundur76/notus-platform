import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../lib/trpc';

export default function HomeScreen() {
  const [taskInput, setTaskInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitTaskMutation = trpc.tasks.submitTask.useMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Task submitted successfully!');
      setTaskInput('');
      setIsSubmitting(false);
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to submit task');
      setIsSubmitting(false);
    },
  });

  const handleSubmit = () => {
    if (!taskInput.trim()) {
      Alert.alert('Error', 'Please enter a task description');
      return;
    }

    setIsSubmitting(true);
    submitTaskMutation.mutate({
      description: taskInput,
      type: 'general',
    });
  };

  const handleQuickAction = (type: string, description: string) => {
    setIsSubmitting(true);
    submitTaskMutation.mutate({
      description,
      type: type as any,
    });
  };

  const quickActions = [
    {
      type: 'slides',
      icon: 'easel-outline',
      label: 'Create Slides',
      description: 'Create a presentation about AI trends',
      color: '#3b82f6',
    },
    {
      type: 'website',
      icon: 'globe-outline',
      label: 'Build Website',
      description: 'Build a landing page for a startup',
      color: '#8b5cf6',
    },
    {
      type: 'app',
      icon: 'phone-portrait-outline',
      label: 'Create App',
      description: 'Create a todo list app',
      color: '#ec4899',
    },
    {
      type: 'design',
      icon: 'color-palette-outline',
      label: 'Generate Design',
      description: 'Design a modern logo',
      color: '#f59e0b',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>What can I help you with?</Text>
        <Text style={styles.subtitle}>
          Describe your task or choose a quick action below
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textArea}
          placeholder="Describe your task in detail..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={6}
          value={taskInput}
          onChangeText={setTaskInput}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Submit Task</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.type}
              style={[styles.quickActionCard, { borderColor: action.color }]}
              onPress={() => handleQuickAction(action.type, action.description)}
              disabled={isSubmitting}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon as any} size={28} color="#fff" />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#6366f1" />
          <Text style={styles.infoText}>
            Tasks are processed by our AI agents with memory, learning capabilities, and
            GUI automation powered by Agent-S.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  inputContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    minHeight: 150,
    backgroundColor: '#fff',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActionsContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  infoContainer: {
    padding: 20,
    marginTop: 12,
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 20,
  },
});
