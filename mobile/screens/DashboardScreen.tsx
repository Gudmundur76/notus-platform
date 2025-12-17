import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../lib/trpc';

export default function DashboardScreen() {
  const { data: tasks, isLoading, refetch, isRefetching } = trpc.tasks.getTasks.useQuery();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'failed':
        return '#ef4444';
      case 'running':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'failed':
        return 'close-circle';
      case 'running':
        return 'time';
      default:
        return 'ellipse';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="folder-open-outline" size={64} color="#d1d5db" />
        <Text style={styles.emptyTitle}>No tasks yet</Text>
        <Text style={styles.emptySubtitle}>
          Submit your first task from the Home screen
        </Text>
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
        <Text style={styles.headerTitle}>Task History</Text>
        <Text style={styles.headerSubtitle}>{tasks.length} total tasks</Text>
      </View>

      {tasks.map((task) => (
        <TouchableOpacity key={task.id} style={styles.taskCard}>
          <View style={styles.taskHeader}>
            <View style={styles.taskStatus}>
              <Ionicons
                name={getStatusIcon(task.status) as any}
                size={20}
                color={getStatusColor(task.status)}
              />
              <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                {task.status}
              </Text>
            </View>
            <Text style={styles.taskTime}>{formatDate(task.createdAt)}</Text>
          </View>

          <Text style={styles.taskDescription} numberOfLines={2}>
            {task.description}
          </Text>

          <View style={styles.taskFooter}>
            <View style={styles.taskType}>
              <Ionicons name="pricetag-outline" size={14} color="#6b7280" />
              <Text style={styles.taskTypeText}>{task.type}</Text>
            </View>
            {task.result && (
              <View style={styles.resultBadge}>
                <Ionicons name="document-text-outline" size={14} color="#6366f1" />
                <Text style={styles.resultText}>Has result</Text>
              </View>
            )}
          </View>

          {task.result && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Result:</Text>
              <Text style={styles.resultContent} numberOfLines={3}>
                {task.result.content || 'No content'}
              </Text>
              {task.result.files && task.result.files.length > 0 && (
                <View style={styles.filesContainer}>
                  <Ionicons name="attach-outline" size={14} color="#6b7280" />
                  <Text style={styles.filesText}>
                    {task.result.files.length} file(s) attached
                  </Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      ))}
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
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
  taskCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  taskTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  taskDescription: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskTypeText: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resultText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  resultContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  resultContent: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
  },
  filesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  filesText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
