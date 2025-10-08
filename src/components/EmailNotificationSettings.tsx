import React, { useState } from 'react';
import { NotificationSettings } from '../types';
import { Mail, Plus, X, Settings, Bell } from 'lucide-react';

interface EmailNotificationSettingsProps {
  settings: NotificationSettings;
  onUpdateSettings: (settings: NotificationSettings) => void;
}

export const EmailNotificationSettings: React.FC<EmailNotificationSettingsProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [isAddingEmail, setIsAddingEmail] = useState(false);

  const addEmailAddress = () => {
    if (newEmail.trim() && isValidEmail(newEmail.trim())) {
      const updatedSettings = {
        ...settings,
        priceChangeNotifications: {
          ...settings.priceChangeNotifications,
          emailAddresses: [...settings.priceChangeNotifications.emailAddresses, newEmail.trim()],
        },
      };
      onUpdateSettings(updatedSettings);
      setNewEmail('');
      setIsAddingEmail(false);
    }
  };

  const removeEmailAddress = (emailToRemove: string) => {
    const updatedSettings = {
      ...settings,
      priceChangeNotifications: {
        ...settings.priceChangeNotifications,
        emailAddresses: settings.priceChangeNotifications.emailAddresses.filter(
          email => email !== emailToRemove
        ),
      },
    };
    onUpdateSettings(updatedSettings);
  };

  const toggleNotifications = () => {
    const updatedSettings = {
      ...settings,
      priceChangeNotifications: {
        ...settings.priceChangeNotifications,
        enabled: !settings.priceChangeNotifications.enabled,
      },
    };
    onUpdateSettings(updatedSettings);
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addEmailAddress();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-6">
        <Bell className="w-6 h-6 text-blue-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-800">Email Notifications</h2>
      </div>

      <div className="space-y-6">
        {/* From Email Configuration */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-3">
            <Mail className="w-5 h-5 mr-2 text-blue-600" />
            From Email Address
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            This email address will appear as the sender for all outgoing emails. Must be from your verified domain.
          </p>
          <input
            type="email"
            value={settings.fromEmail}
            onChange={(e) => onUpdateSettings({ ...settings, fromEmail: e.target.value })}
            placeholder="reservations@yourdomain.com"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-2">
            Make sure this email is from a domain you've verified in Resend (e.g., noreply@seedmkting.com)
          </p>
        </div>
        {/* Price Change Notifications Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-blue-600" />
              Room Price Change Notifications
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Send email alerts when room prices are modified
            </p>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.priceChangeNotifications.enabled}
              onChange={toggleNotifications}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Email Addresses Management */}
        {settings.priceChangeNotifications.enabled && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-800">
                Notification Recipients ({settings.priceChangeNotifications.emailAddresses.length})
              </h4>
              
              <button
                onClick={() => setIsAddingEmail(true)}
                disabled={isAddingEmail}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Email
              </button>
            </div>

            {/* Add New Email Form */}
            {isAddingEmail && (
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter email address..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  
                  <button
                    onClick={addEmailAddress}
                    disabled={!newEmail.trim() || !isValidEmail(newEmail.trim())}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsAddingEmail(false);
                      setNewEmail('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {newEmail.trim() && !isValidEmail(newEmail.trim()) && (
                  <p className="text-red-600 text-sm mt-2">Please enter a valid email address</p>
                )}
              </div>
            )}

            {/* Email List */}
            <div className="space-y-2">
              {settings.priceChangeNotifications.emailAddresses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No email addresses configured</p>
                  <p className="text-sm">Add email addresses to receive price change notifications</p>
                </div>
              ) : (
                settings.priceChangeNotifications.emailAddresses.map((email, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-800">{email}</span>
                    </div>
                    
                    <button
                      onClick={() => removeEmailAddress(email)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="Remove email address"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Settings className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">How it works:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>When enabled, email notifications will be sent whenever room prices are changed</li>
                <li>All configured email addresses will receive the notification</li>
                <li>The email will include details about which room type was changed and the new price</li>
                <li>You can add multiple email addresses for managers, accounting, etc.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};