import { getDownloadedSurveys, saveSurveyResponse, getSurveyResponses, updateSurveyResponse } from '@/utils/filestorage';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { usePrefill } from '../../context/PrefillContext';

export default function SurveyScreen() {
  const { id, editResponseId } = useLocalSearchParams();
  const router = useRouter();
  
  const { prefillData } = usePrefill();
  const [survey, setSurvey] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<string>('english');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [interviewStartTime] = useState<Date>(new Date());
  const [locationInfo, setLocationInfo] = useState(prefillData);

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const surveys = await getDownloadedSurveys();
        const found = surveys.find((s: any) => s.surveyId === id);
        if (found) {
          setSurvey(found);
          if (found.supportedLanguages && found.supportedLanguages.length > 0) {
            setLanguage(found.supportedLanguages[0]);
          }
        }

        // If editing, load previous responses
        if (editResponseId) {
          const allResps = await getSurveyResponses();
          const targetResp = allResps.find((r: any) => r.id === editResponseId);
          if (targetResp && targetResp.responseData) {
            // Restore location info if present
            if (targetResp.responseData.paraInfo?.locationInfo) {
              setLocationInfo(targetResp.responseData.paraInfo.locationInfo);
            }
            
            // Restore answers
            if (targetResp.responseData.response) {
              const restoredAnswers: Record<string, string> = {};
              targetResp.responseData.response.forEach((item: any) => {
                restoredAnswers[item.qid] = item.answer;
              });
              setResponses(restoredAnswers);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load survey", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSurvey();
  }, [id]);

  const handleInputChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const shouldShowQuestion = (question: any) => {
    if (!question.showIf) return true;
    const { questionId, equals } = question.showIf;
    return responses[questionId] === equals;
  };

  const handleSubmit = async () => {
    try {
      // Format the response to match the target schema
      const formattedResponse = Object.entries(responses).map(([qid, answer]) => ({
        qid,
        answer
      }));

      const payload = {
        surveyId: id as string,
        paraInfo: {
          interviewInfo: {
            interviewMode: "CAPI",
            interviewStartTime: interviewStartTime.toISOString(),
            interviewEndTime: new Date().toISOString()
          },
          locationInfo: {
            ...locationInfo
          }
        },
        response: formattedResponse,
        flags: [],
        isFlagged: false
      };

      if (editResponseId) {
        await updateSurveyResponse(editResponseId as string, id as string, payload);
      } else {
        await saveSurveyResponse(id as string, payload);
      }
      
      Alert.alert(
        editResponseId ? "Survey Updated" : "Survey Completed",
        editResponseId ? "Your corrections have been saved." : "Thank you for completing the survey!",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error(error);
      Alert.alert("Error", editResponseId ? "Failed to update survey response." : "Failed to save survey response.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading survey...</Text>
      </View>
    );
  }

  if (!survey) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Survey not found. Please download it first.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{survey.name}</Text>
          <Text style={styles.headerSubtitle}>ID: {survey.surveyId}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Language Selector */}
        {survey.supportedLanguages && survey.supportedLanguages.length > 1 && (
          <View style={styles.languageContainer}>
            <Text style={styles.languageLabel}>Select Language:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.languageScroll}>
              {survey.supportedLanguages.map((lang: string) => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.languageChip, language === lang && styles.languageChipActive]}
                  onPress={() => setLanguage(lang)}
                >
                  <Text style={[styles.languageChipText, language === lang && styles.languageChipTextActive]}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Agent & Location Info Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>CAPI Agent & Location Info</Text>
          <View style={styles.questionContainer}>
            <TextInput style={[styles.textInput, {marginBottom: 12}]} placeholder="State LGD Code" value={locationInfo.stateLGDCode} onChangeText={(val) => setLocationInfo(prev => ({...prev, stateLGDCode: val}))} />
            <TextInput style={[styles.textInput, {marginBottom: 12}]} placeholder="District LGD Code" value={locationInfo.districtLGDCode} onChangeText={(val) => setLocationInfo(prev => ({...prev, districtLGDCode: val}))} />
            <TextInput style={[styles.textInput, {marginBottom: 12}]} placeholder="Pincode" keyboardType="number-pad" value={locationInfo.pincode} onChangeText={(val) => setLocationInfo(prev => ({...prev, pincode: val}))} />
            <TextInput style={[styles.textInput, {marginBottom: 12}]} placeholder="State" value={locationInfo.state} onChangeText={(val) => setLocationInfo(prev => ({...prev, state: val}))} />
            <TextInput style={[styles.textInput, {marginBottom: 12}]} placeholder="District" value={locationInfo.district} onChangeText={(val) => setLocationInfo(prev => ({...prev, district: val}))} />
            <TextInput style={[styles.textInput, {marginBottom: 12}]} placeholder="Sub-District" value={locationInfo.subDistrict} onChangeText={(val) => setLocationInfo(prev => ({...prev, subDistrict: val}))} />
            <TextInput style={[styles.textInput, {marginBottom: 12}]} placeholder="Block Name" value={locationInfo.blockName} onChangeText={(val) => setLocationInfo(prev => ({...prev, blockName: val}))} />
            <TextInput style={styles.textInput} placeholder="Census 2011 Code" value={locationInfo.census_2011} onChangeText={(val) => setLocationInfo(prev => ({...prev, census_2011: val}))} />
          </View>
        </View>

        {/* Survey Questions */}
        {survey.questionSections?.map((section: any, sectionIdx: number) => (
          <View key={sectionIdx} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.sectionName}</Text>
            
            {section.questions.map((question: any) => {
              if (!shouldShowQuestion(question)) return null;

              const questionText = question.text[language] || question.text.english;

              return (
                <View key={question.qid} style={styles.questionContainer}>
                  <Text style={styles.questionText}>{questionText}</Text>
                  
                  {question.type === 'text' && (
                    <TextInput
                      style={styles.textInput}
                      placeholder="Type your answer here..."
                      placeholderTextColor="#94a3b8"
                      value={responses[question.qid] || ''}
                      onChangeText={(val) => handleInputChange(question.qid, val)}
                    />
                  )}

                  {question.type === 'mcq' && (
                    <View style={styles.optionsContainer}>
                      {question.options.map((option: any) => {
                        const optionText = option.label[language] || option.label.english;
                        const isSelected = responses[question.qid] === option.id;
                        
                        return (
                          <TouchableOpacity
                            key={option.id}
                            style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                            onPress={() => handleInputChange(question.qid, option.id)}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                              {isSelected && <View style={styles.radioButtonInner} />}
                            </View>
                            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                              {optionText}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Survey</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerBackButton: {
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  languageContainer: {
    marginBottom: 24,
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  languageScroll: {
    flexDirection: 'row',
  },
  languageChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    marginRight: 8,
  },
  languageChipActive: {
    backgroundColor: '#2563eb',
  },
  languageChipText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  languageChipTextActive: {
    color: '#ffffff',
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#cbd5e1',
  },
  questionContainer: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
    lineHeight: 24,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  optionCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: '#2563eb',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
  },
  optionText: {
    fontSize: 16,
    color: '#475569',
    flex: 1,
  },
  optionTextSelected: {
    color: '#1e3a8a',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
