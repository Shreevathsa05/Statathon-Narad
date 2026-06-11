import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Storage from '../utils/storage';

export type PrefillData = {
  stateLGDCode: string;
  districtLGDCode: string;
  pincode: string;
  state: string;
  district: string;
  subDistrict: string;
  blockName: string;
  census_2011: string;
};

type PrefillContextType = {
  prefillData: PrefillData;
  isLoading: boolean;
  updatePrefillData: (data: Partial<PrefillData>) => Promise<void>;
};

const defaultPrefillData: PrefillData = {
  stateLGDCode: '',
  districtLGDCode: '',
  pincode: '',
  state: '',
  district: '',
  subDistrict: '',
  blockName: '',
  census_2011: '',
};

const PrefillContext = createContext<PrefillContextType | undefined>(undefined);

export function PrefillProvider({ children }: { children: React.ReactNode }) {
  const [prefillData, setPrefillData] = useState<PrefillData>(defaultPrefillData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPrefillData = async () => {
      try {
        const storedStr = await Storage.getItemAsync('prefillData');
        if (storedStr) {
          const parsed = JSON.parse(storedStr);
          setPrefillData({ ...defaultPrefillData, ...parsed });
        }
      } catch (e) {
        console.error('Failed to load prefill data', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadPrefillData();
  }, []);

  const updatePrefillData = async (data: Partial<PrefillData>) => {
    try {
      const newPrefillData = { ...prefillData, ...data };
      setPrefillData(newPrefillData);
      await Storage.setItemAsync('prefillData', JSON.stringify(newPrefillData));
    } catch (e) {
      console.error('Failed to save prefill data', e);
    }
  };

  return (
    <PrefillContext.Provider value={{ prefillData, isLoading, updatePrefillData }}>
      {children}
    </PrefillContext.Provider>
  );
}

export function usePrefill() {
  const context = useContext(PrefillContext);
  if (context === undefined) {
    throw new Error('usePrefill must be used within a PrefillProvider');
  }
  return context;
}
