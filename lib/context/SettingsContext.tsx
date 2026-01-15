'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  payrollWeekStartDay: number; // 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday
  currency: string;
  businessName: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  payrollWeekStartDay: 5, // Friday
  currency: '£',
  businessName: 'MR Services'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    const stored = localStorage.getItem('app_settings');
    if (stored) {
      setSettings({ ...defaultSettings, ...JSON.parse(stored) });
    }
  }, []);

  function updateSettings(newSettings: Partial<Settings>) {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('app_settings', JSON.stringify(updated));
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
