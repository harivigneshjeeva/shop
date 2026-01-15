'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/lib/context/SettingsContext';
import { useToast } from '@/lib/context/ToastContext';
import { getDayName, getEndDayName } from '@/lib/utils/payrollWeek';

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { showToast } = useToast();
  const [localSettings, setLocalSettings] = useState(settings);

  function handleSave() {
    updateSettings(localSettings);
    showToast('success', 'Settings saved successfully');
  }

  function handleExport() {
    handleFullBackup();
  }

  async function handleFullBackup() {
    const { getAllData } = await import('@/lib/supabase/queries');
    const { exportToJSON } = await import('@/lib/utils/export');
    const allData = await getAllData();
    exportToJSON(allData, 'full_backup');
    showToast('success', 'Backup downloaded successfully');
  }

  function handleClear() {
    if (!confirm('This will delete ALL data. Are you sure?')) return;
    const password = prompt('Enter password to confirm:');
    if (password === 'DELETE') {
      showToast('info', 'Clear data functionality requires backend implementation');
    }
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Settings</h1>
        <p className="text-sm lg:text-base text-muted-foreground">Configure application settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Payroll Week Start Day</Label>
            <select
              className="w-full h-12 lg:h-10 rounded-md border border-input bg-background px-3 mt-1 text-base"
              value={localSettings.payrollWeekStartDay}
              onChange={(e) => setLocalSettings({ ...localSettings, payrollWeekStartDay: parseInt(e.target.value) })}
            >
              <option value="0">Sunday</option>
              <option value="1">Monday</option>
              <option value="2">Tuesday</option>
              <option value="3">Wednesday</option>
              <option value="4">Thursday</option>
              <option value="5">Friday</option>
              <option value="6">Saturday</option>
            </select>
            <p className="text-sm text-muted-foreground mt-2">
              Week runs from {getDayName(localSettings.payrollWeekStartDay)} to {getEndDayName(localSettings.payrollWeekStartDay)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Currency Symbol</Label>
            <select
              className="w-full h-12 lg:h-10 rounded-md border border-input bg-background px-3 mt-1 text-base"
              value={localSettings.currency}
              onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })}
            >
              <option value="£">£ (GBP)</option>
              <option value="$">$ (USD)</option>
              <option value="€">€ (EUR)</option>
              <option value="₹">₹ (INR)</option>
              <option value="¥">¥ (JPY)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Business Name</Label>
            <Input
              value={localSettings.businessName}
              onChange={(e) => setLocalSettings({ ...localSettings, businessName: e.target.value })}
              className="mt-1 h-12 lg:h-10 text-base"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Export All Data</Label>
            <p className="text-sm text-muted-foreground mb-2">Download a JSON backup of all your data</p>
            <Button variant="outline" onClick={handleExport}>Export Data</Button>
          </div>
          <div>
            <Label>Clear All Data</Label>
            <p className="text-sm text-muted-foreground mb-2">Permanently delete all data (requires password)</p>
            <Button variant="destructive" onClick={handleClear}>Clear All Data</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSave} size="lg">Save Settings</Button>
      </div>
    </div>
  );
}
