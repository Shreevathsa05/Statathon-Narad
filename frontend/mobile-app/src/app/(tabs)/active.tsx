import { baseURI } from '@/utils/constant';
import { getDownloadedSurveys, saveDownloadedSurvey } from '@/utils/filestorage';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ActiveSurveysScreen() {
  const [surveys, setSurveys] = useState([]);
  const [downloadedSurveys, setDownloadedSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDownloadedSurveys().then((data) => {
      if (data) setDownloadedSurveys(data);
    });

    setLoading(true);
    fetch(baseURI + '/api/survey', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setSurveys(data.data);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleDownload = async (survey: any) => {
    try {
      const updated = await saveDownloadedSurvey(survey);
      setDownloadedSurveys(updated);
    } catch (error) {
      console.error(error);
    }
  };

  const activeSurveys = surveys ? surveys.filter((s: any) => s.status === 'active' && !downloadedSurveys.find((d: any) => d.surveyId === s.surveyId)) : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Surveys</Text>
        <Text style={styles.headerSubtitle}>Discover and download new surveys</Text>
      </View>

      <View style={styles.section}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Fetching surveys...</Text>
          </View>
        ) : activeSurveys.length > 0 ? (
          activeSurveys.map((survey: any) => (
            <TouchableOpacity key={survey._id} style={styles.surveyCard} activeOpacity={0.7}>
              <View style={styles.cardHeader}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Active</Text>
                </View>
                <Text style={styles.surveyIdText}>ID: {survey.surveyId}</Text>
              </View>
              <Text style={styles.surveyName}>{survey.name}</Text>
              <View style={[styles.cardFooter, { justifyContent: 'space-between' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="document-text-outline" size={16} color="#6b7280" />
                  <Text style={styles.footerText}>Tap to view details</Text>
                </View>
                <TouchableOpacity style={styles.downloadButton} onPress={() => handleDownload(survey)}>
                  <Ionicons name="cloud-download-outline" size={18} color="#fff" />
                  <Text style={styles.downloadButtonText}>Download</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No active surveys found.</Text>
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
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
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
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748b',
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
});
