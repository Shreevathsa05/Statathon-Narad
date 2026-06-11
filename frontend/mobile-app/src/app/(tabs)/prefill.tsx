import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { usePrefill } from '../../context/PrefillContext';

export default function PrefillScreen() {
  const { prefillData, updatePrefillData } = usePrefill();

  const [localData, setLocalData] = useState(prefillData);

  useEffect(() => {
    setLocalData(prefillData);
  }, [prefillData]);

  const handleSave = async () => {
    try {
      await updatePrefillData(localData);
      Alert.alert('Success', 'Prefill defaults saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save prefill defaults.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Prefill Settings</Text>
      <Text style={styles.subtitle}>Set default values for CAPI surveys</Text>

      <View style={styles.card}>
        <Text style={styles.label}>State LGD Code</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 27"
          value={localData.stateLGDCode}
          onChangeText={(val) => setLocalData({ ...localData, stateLGDCode: val })}
        />

        <Text style={styles.label}>District LGD Code</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 501"
          value={localData.districtLGDCode}
          onChangeText={(val) => setLocalData({ ...localData, districtLGDCode: val })}
        />

        <Text style={styles.label}>Pincode</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 110001"
          keyboardType="number-pad"
          value={localData.pincode}
          onChangeText={(val) => setLocalData({ ...localData, pincode: val })}
        />

        <Text style={styles.label}>State</Text>
        <TextInput
          style={styles.input}
          placeholder="State Name"
          value={localData.state}
          onChangeText={(val) => setLocalData({ ...localData, state: val })}
        />

        <Text style={styles.label}>District</Text>
        <TextInput
          style={styles.input}
          placeholder="District Name"
          value={localData.district}
          onChangeText={(val) => setLocalData({ ...localData, district: val })}
        />

        <Text style={styles.label}>Sub-District</Text>
        <TextInput
          style={styles.input}
          placeholder="Sub-District"
          value={localData.subDistrict}
          onChangeText={(val) => setLocalData({ ...localData, subDistrict: val })}
        />

        <Text style={styles.label}>Block Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Block Name"
          value={localData.blockName}
          onChangeText={(val) => setLocalData({ ...localData, blockName: val })}
        />

        <Text style={styles.label}>Census 2011 Code</Text>
        <TextInput
          style={styles.input}
          placeholder="Census Code"
          value={localData.census_2011}
          onChangeText={(val) => setLocalData({ ...localData, census_2011: val })}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Defaults</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
