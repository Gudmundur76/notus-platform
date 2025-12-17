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

export default function MemoryScreen() {
  const [activeTab, setActiveTab] = useState<'stats' | 'entries'>('stats');
  const [newMemory, setNewMemory] = useState('');
  const [memoryType, setMemoryType] = useState<'fact' | 'preference' | 'context' | 'insight'>('fact');
  const [isAdding, setIsAdding] = useState(false);

  const { data: stats, isLoading, refetch, isRefetching } = trpc.memory.getMemoryStats.useQuery();
  const { data: entries } = trpc.memory.getMemoryEntries.useQuery({ limit: 20 });
  const addMemoryMutation = trpc.memory.addMemoryEntry.useMutation();
  const deleteMemoryMutation = trpc.memory.deleteMemoryEntry.useMutation();

  const handleAddMemory = async () => {
    if (!newMemory.trim()) {
      Alert.alert('Error', 'Please enter memory content');
      return;
    }

    setIsAdding(true);
    try {
      await addMemoryMutation.mutateAsync({
        content: newMemory,
        type: memoryType,
      });
      Alert.alert('Success', 'Memory added successfully!');
      setNewMemory('');
      refetch();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add memory');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteMemory = async (id: number) => {
    Alert.alert(
      'Delete Memory',
      'Are you sure you want to delete this memory entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMemoryMutation.mutateAsync({ id });
              refetch();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete memory');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fact':
        return '#3b82f6';
      case 'preference':
        return '#8b5cf6';
      case 'context':
        return '#10b981';
      case 'insight':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading memory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
            Statistics
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'entries' && styles.tabActive]}
          onPress={() => setActiveTab('entries')}
        >
          <Text style={[styles.tabText, activeTab === 'entries' && styles.tabTextActive]}>
            Entries
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {activeTab === 'stats' ? (
          <>
            {/* Statistics Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="chatbubbles-outline" size={28} color="#6366f1" />
                <Text style={styles.statValue}>{stats?.totalConversations || 0}</Text>
                <Text style={styles.statLabel}>Conversations</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="chatbox-outline" size={28} color="#8b5cf6" />
                <Text style={styles.statValue}>{stats?.totalMessages || 0}</Text>
                <Text style={styles.statLabel}>Messages</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="bulb-outline" size={28} color="#10b981" />
                <Text style={styles.statValue}>{stats?.totalMemories || 0}</Text>
                <Text style={styles.statLabel}>Memories</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="settings-outline" size={28} color="#f59e0b" />
                <Text style={styles.statValue}>{stats?.totalPreferences || 0}</Text>
                <Text style={styles.statLabel}>Preferences</Text>
              </View>
            </View>

            {/* Memory Types Breakdown */}
            {stats?.byType && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Memory by Type</Text>
                {Object.entries(stats.byType).map(([type, count]) => (
                  <View key={type} style={styles.typeCard}>
                    <View style={styles.typeHeader}>
                      <View
                        style={[
                          styles.typeIndicator,
                          { backgroundColor: getTypeColor(type) },
                        ]}
                      />
                      <Text style={styles.typeName}>{type}</Text>
                    </View>
                    <Text style={styles.typeCount}>{count}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={24} color="#6366f1" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>About Memory System</Text>
                <Text style={styles.infoText}>
                  The memory system stores conversations, facts, preferences, and
                  insights to provide context-aware responses across sessions.
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Add Memory Form */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add New Memory</Text>

              {/* Memory Type Selection */}
              <View style={styles.typeSelector}>
                {(['fact', 'preference', 'context', 'insight'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      memoryType === type && styles.typeButtonActive,
                      { borderColor: getTypeColor(type) },
                    ]}
                    onPress={() => setMemoryType(type)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        memoryType === type && { color: getTypeColor(type) },
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Memory Input */}
              <TextInput
                style={styles.textArea}
                placeholder="Enter memory content..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                value={newMemory}
                onChangeText={setNewMemory}
                textAlignVertical="top"
              />

              {/* Add Button */}
              <TouchableOpacity
                style={[styles.addButton, isAdding && styles.addButtonDisabled]}
                onPress={handleAddMemory}
                disabled={isAdding}
              >
                {isAdding ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>Add Memory</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Memory Entries List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Memories</Text>
              {entries && entries.length > 0 ? (
                entries.map((entry) => (
                  <View key={entry.id} style={styles.memoryCard}>
                    <View style={styles.memoryHeader}>
                      <View
                        style={[
                          styles.memoryTypeBadge,
                          { backgroundColor: getTypeColor(entry.type) + '20' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.memoryTypeText,
                            { color: getTypeColor(entry.type) },
                          ]}
                        >
                          {entry.type}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteMemory(entry.id)}>
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.memoryContent}>{entry.content}</Text>
                    <Text style={styles.memoryDate}>{formatDate(entry.createdAt)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No memory entries yet</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
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
  typeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  typeName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    textTransform: 'capitalize',
  },
  typeCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    backgroundColor: '#f9fafb',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  memoryCard: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memoryTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  memoryTypeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  memoryContent: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
    marginBottom: 8,
  },
  memoryDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    padding: 16,
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
