import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const setItemAsync = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error('AsyncStorage Error: ', e);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

export const getItemAsync = async (key: string) => {
  if (Platform.OS === 'web') {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.error('AsyncStorage Error: ', e);
      return null;
    }
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

export const deleteItemAsync = async (key: string) => {
  if (Platform.OS === 'web') {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('AsyncStorage Error: ', e);
    }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};
