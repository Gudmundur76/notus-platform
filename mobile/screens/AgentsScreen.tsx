import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../lib/trpc';

export default function AgentsScreen() {
  const { data: stats, isLoading, refetch, isRefetching } = trpc.agents.getKnowledgeStats.useQuery();
  const { data: agents } = trpc.agents.getAgents.useQuery();

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading agents...</Text>
      </View>
    );
  }

  const domainColors: Record<string, string> = {
    biotech: '#10b981',
    finance: '#3b82f6',
    legal: '#8b5cf6',
    marketing: '#ec4899',
    tech: '#f59e0b',
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mirror Agent System</Text>
        <Text style={styles.headerSubtitle}>
          Self-learning AI agents with debate and research capabilities
        </Text>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={32} color="#6366f1" />
          <Text style={styles.statValue}>{stats?.totalAgents || 0}</Text>
          <Text style={styles.statLabel}>Total Agents</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="git-network-outline" size={32} color="#8b5cf6" />
          <Text style={styles.statValue}>{stats?.totalPairs || 0}</Text>
          <Text style={styles.statLabel}>Agent Pairs</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="bulb-outline" size={32} color="#f59e0b" />
          <Text style={styles.statValue}>{stats?.totalKnowledge || 0}</Text>
          <Text style={styles.statLabel}>Knowledge</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="chatbubbles-outline" size={32} color="#10b981" />
          <Text style={styles.statValue}>{stats?.totalDialogues || 0}</Text>
          <Text style={styles.statLabel}>Dialogues</Text>
        </View>
      </View>

      {/* Domain Breakdown */}
      {stats?.byDomain && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Knowledge by Domain</Text>
          {Object.entries(stats.byDomain).map(([domain, count]) => (
            <View key={domain} style={styles.domainCard}>
              <View style={styles.domainHeader}>
                <View
                  style={[
                    styles.domainIndicator,
                    { backgroundColor: domainColors[domain] || '#6b7280' },
                  ]}
                />
                <Text style={styles.domainName}>{domain}</Text>
              </View>
              <View style={styles.domainStats}>
                <Text style={styles.domainCount}>{count}</Text>
                <Text style={styles.domainLabel}>insights</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Active Agents */}
      {agents && agents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Agents</Text>
          {agents.map((agent) => (
            <View key={agent.id} style={styles.agentCard}>
              <View style={styles.agentHeader}>
                <Ionicons
                  name={agent.type === 'primary' ? 'person' : 'person-outline'}
                  size={20}
                  color={agent.type === 'primary' ? '#6366f1' : '#8b5cf6'}
                />
                <Text style={styles.agentName}>{agent.name}</Text>
              </View>
              <View style={styles.agentDetails}>
                <View style={styles.agentTag}>
                  <Text style={styles.agentTagText}>{agent.domain}</Text>
                </View>
                <View
                  style={[
                    styles.agentTypeBadge,
                    {
                      backgroundColor:
                        agent.type === 'primary' ? '#eff6ff' : '#f5f3ff',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.agentTypeText,
                      {
                        color: agent.type === 'primary' ? '#2563eb' : '#7c3aed',
                      },
                    ]}
                  >
                    {agent.type}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={24} color="#6366f1" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>About Mirror Agents</Text>
          <Text style={styles.infoText}>
            Mirror agents work in pairs to debate topics, conduct research, and
            refine knowledge. They learn continuously through scheduled jobs and
            cross-domain collaboration.
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
    fontSize: 28,
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
  domainCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  domainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  domainIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  domainName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    textTransform: 'capitalize',
  },
  domainStats: {
    alignItems: 'flex-end',
  },
  domainCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  domainLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  agentCard: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  agentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  agentDetails: {
    flexDirection: 'row',
    gap: 8,
  },
  agentTag: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  agentTagText: {
    fontSize: 12,
    color: '#4b5563',
    textTransform: 'capitalize',
  },
  agentTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  agentTypeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
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
