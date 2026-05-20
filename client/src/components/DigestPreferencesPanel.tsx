/**
 * DigestPreferencesPanel — Smart Digest preferences UI component (Story 12.7 Phase 4)
 *
 * Allows users to update their digest settings:
 * - Enable/disable digest notifications
 * - Choose frequency (daily/weekly)
 * - Set preferred time
 * - Select topics
 *
 * Subtask 4.1.2: Preference UI (optional: can defer to Story 12.8)
 */

import { useState } from 'react';
import { useDigestPreferences } from '@/hooks/useDigestPreferences';

const AVAILABLE_TOPICS = ['AI', 'Science', 'Robotics', 'Gadgets'];

export function DigestPreferencesPanel() {
  const { config, isLoading, error, updatePreferences, resetPreferences, isEnabled } =
    useDigestPreferences();

  const [localFrequency, setLocalFrequency] = useState(config?.frequency || 'weekly');
  const [localTime, setLocalTime] = useState(config?.preferredTime || '08:00');
  const [localTopics, setLocalTopics] = useState(config?.topics || ['AI']);
  const [successMessage, setSuccessMessage] = useState('');

  if (!config) return <div className="p-4 text-gray-500">Loading preferences...</div>;

  const handleFrequencyChange = (newFreq: 'daily' | 'weekly') => {
    setLocalFrequency(newFreq);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTime(e.target.value);
  };

  const handleTopicToggle = (topic: string) => {
    if (localTopics.includes(topic)) {
      setLocalTopics(localTopics.filter((t) => t !== topic));
    } else {
      setLocalTopics([...localTopics, topic]);
    }
  };

  const handleSave = async () => {
    try {
      setSuccessMessage('');
      await updatePreferences({
        frequency: localFrequency as 'daily' | 'weekly',
        preferredTime: localTime,
        topics: localTopics,
      });
      setSuccessMessage('✅ Preferences saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    }
  };

  const handleReset = () => {
    resetPreferences();
    setLocalFrequency('weekly');
    setLocalTime('08:00');
    setLocalTopics(['AI']);
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-sm">
      <div>
        <h2 className="text-2xl font-bold mb-1">Smart Digest Preferences</h2>
        <p className="text-gray-600">Customize your email digest settings</p>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
        <span className="font-medium text-blue-900">Smart Digest Status</span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {isEnabled ? '✓ Enabled' : '○ Disabled'}
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">{successMessage}</p>
        </div>
      )}

      {/* Frequency Selection */}
      <fieldset className="space-y-2">
        <legend className="block text-sm font-medium text-gray-700">Frequency</legend>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="frequency"
              value="daily"
              checked={localFrequency === 'daily'}
              onChange={(e) => handleFrequencyChange(e.target.value as 'daily' | 'weekly')}
              className="mr-2"
            />
            <span className="text-sm">Daily</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="frequency"
              value="weekly"
              checked={localFrequency === 'weekly'}
              onChange={(e) => handleFrequencyChange(e.target.value as 'daily' | 'weekly')}
              className="mr-2"
            />
            <span className="text-sm">Weekly (Monday)</span>
          </label>
        </div>
      </fieldset>

      {/* Preferred Time */}
      <div className="space-y-2">
        <label htmlFor="preferred-time" className="block text-sm font-medium text-gray-700">Preferred Time (UTC)</label>
        <input
          id="preferred-time"
          type="time"
          value={localTime}
          onChange={handleTimeChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500">Digest will be sent at this time in UTC timezone</p>
      </div>

      {/* Topics Selection */}
      <fieldset className="space-y-3">
        <legend className="block text-sm font-medium text-gray-700">Topics of Interest</legend>
        <div className="grid grid-cols-2 gap-3">
          {AVAILABLE_TOPICS.map((topic) => (
            <label key={topic} className="flex items-center p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={localTopics.includes(topic)}
                onChange={() => handleTopicToggle(topic)}
                className="mr-2"
              />
              <span className="text-sm font-medium">{topic}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          {localTopics.length === 0
            ? 'Select at least one topic to receive digests'
            : `Selected: ${localTopics.join(', ')}`}
        </p>
      </fieldset>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={isLoading || localTopics.length === 0}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
        >
          Reset
        </button>
      </div>

      {/* Help Text */}
      <div className="p-3 bg-amber-50 rounded-lg">
        <p className="text-xs text-amber-800">
          💡 <strong>Tip:</strong> Changes are saved to your preferences. You can unsubscribe at any time using the link in your digest email.
        </p>
      </div>
    </div>
  );
}
