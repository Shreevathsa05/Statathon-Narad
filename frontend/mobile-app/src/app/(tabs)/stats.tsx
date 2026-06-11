import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { getSurveyResponses, syncResponses } from '@/utils/filestorage';

export default function StatsScreen() {
  const [responses, setResponses] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    const resps = await getSurveyResponses();
    if (resps) setResponses(resps);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncResponses();
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEdit = (res: any) => {
    // Pass editResponseId via router params
    router.push(`/survey/${res.surveyId}?editResponseId=${res.id}`);
  };

  const totalCount = responses.length;
  const syncedCount = responses.filter(r => r.syncStatus === 'synced').length;
  const failedCount = responses.filter(r => r.syncStatus === 'failed').length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stats & Sync</Text>
        <Text style={styles.headerSubtitle}>Monitor your responses</Text>
      </View>

      <View style={styles.tilesContainer}>
        <View style={styles.tile}>
          <Text style={styles.tileTitle}>Total</Text>
          <Text style={styles.tileCount}>{totalCount}</Text>
        </View>
        <View style={[styles.tile, { backgroundColor: '#dcfce7' }]}>
          <Text style={[styles.tileTitle, { color: '#166534' }]}>Synced</Text>
          <Text style={[styles.tileCount, { color: '#15803d' }]}>{syncedCount}</Text>
        </View>
        <View style={[styles.tile, { backgroundColor: '#fee2e2' }]}>
          <Text style={[styles.tileTitle, { color: '#991b1b' }]}>Failed</Text>
          <Text style={[styles.tileCount, { color: '#b91c1c' }]}>{failedCount}</Text>
        </View>
      </View>

      <View style={styles.syncSection}>
        <View style={styles.syncHeader}>
          <Text style={styles.sectionTitle}>All Responses</Text>
          <TouchableOpacity 
            style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]} 
            onPress={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
            ) : (
              <Ionicons name="sync-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
            )}
            <Text style={styles.syncButtonText}>{isSyncing ? 'Syncing...' : 'Sync Now'}</Text>
          </TouchableOpacity>
        </View>

        {responses.map((res: any) => (
          <View key={res.id} style={styles.responseCard}>
            <View style={styles.responseInfo}>
              <Text style={styles.responseSurveyId}>Survey: {res.surveyId.substring(0,8)}...</Text>
              <Text style={styles.responseTime}>{new Date(res.completedAt).toLocaleString()}</Text>
            </View>
            <View style={styles.actionContainer}>
              <View style={[
                styles.statusPill, 
                res.syncStatus === 'synced' ? styles.statusPillSuccess : 
                res.syncStatus === 'failed' ? styles.statusPillFailed : styles.statusPillPending
              ]}>
                <Text style={[
                  styles.statusText,
                  res.syncStatus === 'synced' ? styles.statusTextSuccess : 
                  res.syncStatus === 'failed' ? styles.statusTextFailed : styles.statusTextPending
                ]}>
                  {res.syncStatus.toUpperCase()}
                </Text>
              </View>
              {res.syncStatus === 'failed' && (
                <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(res)}>
                  <Ionicons name="create-outline" size={16} color="#fff" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  tilesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  tile: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  tileCount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  syncSection: {
    marginBottom: 24,
  },
  syncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  responseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  responseInfo: {
    flex: 1,
  },
  responseSurveyId: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  responseTime: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  actionContainer: {
    alignItems: 'flex-end',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  statusPillSuccess: {
    backgroundColor: '#dcfce7',
  },
  statusPillPending: {
    backgroundColor: '#fef9c3',
  },
  statusPillFailed: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextSuccess: {
    color: '#166534',
  },
  statusTextPending: {
    color: '#854d0e',
  },
  statusTextFailed: {
    color: '#991b1b',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});
