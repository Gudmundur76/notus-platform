import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../lib/trpc';

export default function TrainingScreen() {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: stats, isLoading, refetch, isRefetching } = trpc.training.getTrainingStats.useQuery();
  const { data: tasks } = trpc.tasks.getTasks.useQuery();
  const submitFeedbackMutation = trpc.training.submitFeedback.useMutation();

  const handleSubmitFeedback = async () => {
    if (!selectedTaskId) {
      Alert.alert('Error', 'Please select a task');
      return;
    }
    if (rating === 0) {
      Alert.alert('Error', 'Please provide a rating');
      return;
    }
    if (!feedback.trim()) {
      Alert.alert('Error', 'Please provide feedback text');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedbackMutation.mutateAsync({
        taskId: selectedTaskId,
        rating,
        feedback,
      });
      Alert.alert('Success', 'Feedback submitted successfully!');
      setSelectedTaskId(null);
      setRating(0);
      setFeedback('');
      refetch();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading training data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agent Training</Text>
        <Text style={styles.headerSubtitle}>
          Help improve AI performance through feedback
        </Text>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="chatbubbles-outline" size={28} color="#6366f1" />
          <Text style={styles.statValue}>{stats?.totalFeedback || 0}</Text>
          <Text style={styles.statLabel}>Total Feedback</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trending-up-outline" size={28} color="#10b981" />
          <Text style={styles.statValue}>{stats?.positiveCount || 0}</Text>
          <Text style={styles.statLabel}>Positive</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trending-down-outline" size={28} color="#ef4444" />
          <Text style={styles.statValue}>{stats?.negativeCount || 0}</Text>
          <Text style={styles.statLabel}>Negative</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star-outline" size={28} color="#f59e0b" />
          <Text style={styles.statValue}>
            {stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
          </Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
      </View>

      {/* Feedback Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Submit Feedback</Text>

        {/* Task Selection */}
        <Text style={styles.inputLabel}>Select Task</Text>
        <View style={styles.taskList}>
          {tasks && tasks.length > 0 ? (
            tasks.slice(0, 5).map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.taskOption,
                  selectedTaskId === task.id && styles.taskOptionSelected,
                ]}
                onPress={() => setSelectedTaskId(task.id)}
              >
                <View style={styles.taskOptionContent}>
                  <Text
                    style={[
                      styles.taskOptionText,
                      selectedTaskId === task.id && styles.taskOptionTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {task.description}
                  </Text>
                  <Text style={styles.taskOptionType}>{task.type}</Text>
                </View>
                {selectedTaskId === task.id && (
                  <Ionicons name="checkmark-circle" size={20} color="#6366f1" />
                )}
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noTasksText}>No tasks available for feedback</Text>
          )}
        </View>

        {/* Rating */}
        <Text style={styles.inputLabel}>Rating</Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={36}
                color={star <= rating ? '#f59e0b' : '#d1d5db'}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Feedback Text */}
        <Text style={styles.inputLabel}>Feedback</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe what worked well or what could be improved..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={4}
          value={feedback}
          onChangeText={setFeedback}
          textAlignVertical="top"
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmitFeedback}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={24} color="#6366f1" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Automated Training</Text>
          <Text style={styles.infoText}>
            Your feedback is used to automatically improve agent performance.
            Training jobs run daily at 2 AM and weekly on Sundays for
            comprehensive learning.
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  taskList: {
    gap: 8,
  },
  taskOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  taskOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eff6ff',
  },
  taskOptionContent: {
    flex: 1,
  },
  taskOptionText: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  taskOptionTextSelected: {
    color: '#2563eb',
    fontWeight: '500',
  },
  taskOptionType: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  noTasksText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    padding: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  starButton: {
    padding: 4,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
    backgroundColor: '#fff',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 8,
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 20,
  },
});
