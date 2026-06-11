import { deleteDownloadedSurvey, getDownloadedSurveys } from '@/utils/filestorage';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useRouter, useFocusEffect } from 'expo-router';

export default function DownloadsScreen() {
  const [downloadedSurveys, setDownloadedSurveys] = useState<any[]>([]);
  const router = useRouter();

  const loadData = async () => {
    const surveys = await getDownloadedSurveys();
    if (surveys) setDownloadedSurveys(surveys);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleDeleteDownload = async (surveyId: string) => {
    try {
      const updated = await deleteDownloadedSurvey(surveyId);
      setDownloadedSurveys(updated);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Downloads</Text>
        <Text style={styles.headerSubtitle}>Manage offline surveys</Text>
      </View>

      <Text style={styles.sectionTitle}>Available Offline</Text>
      <View style={styles.section}>
        {downloadedSurveys.length > 0 ? (
          downloadedSurveys.map((survey: any) => (
            <TouchableOpacity 
              key={survey._id || survey.surveyId} 
              style={styles.surveyCard} 
              activeOpacity={0.7}
              onPress={() => router.push(`/survey/${survey.surveyId}`)}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, { backgroundColor: '#e0f2fe' }]}>
                  <Text style={styles.surveyIdText}>ID: {survey.surveyId}</Text>
                </View>
              </View>
              <Text style={styles.surveyName}>{survey.name}</Text>
              <View style={[styles.cardFooter, { justifyContent: 'space-between' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="document-text-outline" size={16} color="#6b7280" />
                  <Text style={styles.footerText}>Tap to start survey</Text>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteDownload(survey.surveyId)}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  <Text style={styles.deleteButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No downloads yet.</Text>
          </View>
        )}
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
    marginBottom: 28,
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
  section: {
    marginBottom: 32,
  },
  surveyCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  surveyIdText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  surveyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 26,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 15,
    color: '#94a3b8',
    fontWeight: '500',
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
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
});
