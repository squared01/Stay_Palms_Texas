import React, { useState } from 'react';
import { Reservation, Customer } from '../types';
import { formatDate } from '../utils/reservationUtils';
import { generateReminderEmail, generateConfirmationEmail } from '../utils/emailService';
import { Mail, Clock, CheckCircle, AlertCircle, FileCheck } from 'lucide-react';

interface EmailServiceProps {
  reservations: Reservation[];
  customers: Customer[];
  onSendReminder: (reservationId: string) => Promise<void>;
  onSendConfirmation: (reservationId: string) => Promise<void>;
}

export const EmailService: React.FC<EmailServiceProps> = ({
  reservations,
  customers,
  onSendReminder,
  onSendConfirmation
}) => {
  const [activeTab, setActiveTab] = useState<'confirmations' | 'reminders'>('confirmations');

  const pendingConfirmations = reservations.filter(r =>
    r.status === 'confirmed' && !r.confirmationSent
  );

  const pendingReminders = reservations.filter(r => {
    const checkInDate = new Date(r.checkInDate);
    const today = new Date();
    const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Include confirmed reservations needing reminders OR cancelled reservations needing cancellation confirmation
    return !r.reminderSent && (
      (r.status === 'confirmed' && daysUntilCheckIn <= 3 && daysUntilCheckIn >= 0) ||
      r.status === 'cancelled'
    );
  });

  const getCustomer = (customerId: string) =>
    customers.find(c => c.id === customerId);

  const handleSendReminder = async (reservationId: string) => {
    await onSendReminder(reservationId);
  };

  const handleSendConfirmation = async (reservationId: string) => {
    await onSendConfirmation(reservationId);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-6">
        <Mail className="w-6 h-6 text-orange-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-800">Email Notifications</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <FileCheck className="w-5 h-5 text-green-600 mr-2" />
            <span className="font-semibold text-green-800">Pending Confirmations</span>
          </div>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {pendingConfirmations.length}
          </p>
          <p className="text-xs text-green-700 mt-1">Booking confirmations</p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="font-semibold text-yellow-800">Pending Reminders</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {pendingReminders.length}
          </p>
          <p className="text-xs text-yellow-700 mt-1">Check-in reminders</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-semibold text-blue-800">Emails Sent</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {reservations.filter(r => r.confirmationSent || r.reminderSent).length}
          </p>
          <p className="text-xs text-blue-700 mt-1">Total sent</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-slate-600 mr-2" />
            <span className="font-semibold text-slate-800">Total Reservations</span>
          </div>
          <p className="text-2xl font-bold text-slate-600 mt-1">
            {reservations.length}
          </p>
        </div>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('confirmations')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'confirmations'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Booking Confirmations ({pendingConfirmations.length})
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'reminders'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Check-in Reminders ({pendingReminders.length})
          </button>
        </div>
      </div>

      {activeTab === 'confirmations' && (
        <>
          {pendingConfirmations.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Pending Booking Confirmations
              </h3>

              <div className="space-y-4">
                {pendingConfirmations.map(reservation => {
                  const customer = getCustomer(reservation.customerId);
                  if (!customer) return null;

                  return (
                    <div key={reservation.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {customer.firstName} {customer.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            #{reservation.id} - Check-in: {formatDate(reservation.checkInDate)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {reservation.roomType.charAt(0).toUpperCase() + reservation.roomType.slice(1)} - ${reservation.totalAmount.toFixed(2)}
                          </p>
                        </div>

                        <button
                          onClick={() => handleSendConfirmation(reservation.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Send Confirmation
                        </button>
                      </div>

                      <details className="mt-3">
                        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                          Preview Email Content
                        </summary>
                        <div className="mt-2 text-xs bg-white p-3 rounded border overflow-x-auto text-gray-700">
                          <div className="mb-2">
                            <strong>Subject:</strong> {generateConfirmationEmail(reservation, customer).subject}
                          </div>
                          <div>
                            <strong>Content:</strong>
                            <pre className="mt-1 whitespace-pre-wrap">{generateConfirmationEmail(reservation, customer).text}</pre>
                          </div>
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No pending booking confirmations</p>
              <p className="text-sm">All confirmed reservations have received their confirmation emails</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'reminders' && (
        <>
          {pendingReminders.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Pending Check-in Reminders
              </h3>

              <div className="space-y-4">
                {pendingReminders.map(reservation => {
                  const customer = getCustomer(reservation.customerId);
                  const daysUntilCheckIn = reservation.status === 'cancelled'
                    ? null
                    : Math.ceil((new Date(reservation.checkInDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                  if (!customer) return null;

                  return (
                    <div key={reservation.id} className={`border rounded-lg p-4 ${
                      reservation.status === 'cancelled'
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {customer.firstName} {customer.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            #{reservation.id} - Check-in: {formatDate(reservation.checkInDate)}
                          </p>
                          <p className={`text-sm font-semibold ${
                            reservation.status === 'cancelled'
                              ? 'text-red-600'
                              : 'text-orange-600'
                          }`}>
                            {reservation.status === 'cancelled'
                              ? 'Cancellation confirmation needed'
                              : daysUntilCheckIn === 0
                                ? 'Today'
                                : `${daysUntilCheckIn} days until check-in`
                            }
                          </p>
                        </div>

                        <button
                          onClick={() => handleSendReminder(reservation.id)}
                          className={`px-4 py-2 text-white rounded-lg font-semibold transition-colors flex items-center ${
                            reservation.status === 'cancelled'
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-orange-600 hover:bg-orange-700'
                          }`}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          {reservation.status === 'cancelled' ? 'Send Confirmation' : 'Send Reminder'}
                        </button>
                      </div>

                      <details className="mt-3">
                        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                          Preview Email Content
                        </summary>
                        <div className="mt-2 text-xs bg-gray-50 p-3 rounded border overflow-x-auto text-gray-700">
                          <div className="mb-2">
                            <strong>Subject:</strong> {generateReminderEmail(reservation, customer).subject}
                          </div>
                          <div>
                            <strong>Content:</strong>
                            <pre className="mt-1 whitespace-pre-wrap">{generateReminderEmail(reservation, customer).text}</pre>
                          </div>
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No pending check-in reminders</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};