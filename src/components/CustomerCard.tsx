import React from 'react';
import { useState } from 'react';
import { CustomerWithReservations } from '../types';
import { formatPhoneNumber, formatDate } from '../utils/reservationUtils';
import { User, Mail, Phone, MapPin, Users, Calendar, MessageSquare, X, Eye } from 'lucide-react';
import { Modal } from './Modal';

interface CustomerCardProps {
  customer: CustomerWithReservations;
  onEdit: (customer: CustomerWithReservations) => void;
  onDelete: (customerId: string) => void;
  onCreateReservation: (customerId: string) => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ 
  customer, 
  onEdit, 
  onDelete,
  onCreateReservation 
}) => {
  const [showCurrentReservations, setShowCurrentReservations] = useState(false);
  const [showPastReservations, setShowPastReservations] = useState(false);

  const currentReservations = customer.reservations.filter(
    r => r.status === 'confirmed' || r.status === 'checked-in'
  );
  const pastReservations = customer.reservations.filter(
    r => r.status === 'checked-out' || r.status === 'cancelled'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'checked-in': return 'bg-green-100 text-green-800';
      case 'checked-out': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-3 sm:space-y-0">
        <div className="flex items-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
              {customer.firstName} {customer.lastName}
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm">
              Customer since {formatDate(customer.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => onEdit(customer)}
            className="px-3 py-1 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex-1 sm:flex-none"
          >
            Edit
          </button>
          <button
            onClick={() => onCreateReservation(customer.id)}
            className="px-3 py-1 text-xs sm:text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex-1 sm:flex-none whitespace-nowrap"
          >
            New Booking
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete ${customer.firstName} ${customer.lastName} and all their reservations?`)) {
                onDelete(customer.id);
              }
            }}
            className="px-3 py-1 text-xs sm:text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex-1 sm:flex-none"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-4">
        <div className="flex items-center text-gray-600 min-w-0">
          <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-xs sm:text-sm truncate">{customer.email}</span>
        </div>

        <div className="flex items-center text-gray-600">
          <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-xs sm:text-sm">{formatPhoneNumber(customer.phone)}</span>
        </div>

        <div className="flex items-center text-gray-600">
          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-xs sm:text-sm">
            {customer.address.city}, {customer.address.state}
          </span>
        </div>

        <div className="flex items-center text-gray-600">
          <Users className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-xs sm:text-sm">{customer.numberOfKids} children</span>
        </div>
      </div>

      {customer.comments && (
        <div className="mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center text-sm sm:text-base">
            <MessageSquare className="w-4 h-4 mr-1" />
            Customer Notes
          </h4>
          <p className="text-blue-700 text-xs sm:text-sm whitespace-pre-wrap">{customer.comments}</p>
        </div>
      )}

      <div className="border-t pt-3 sm:pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center justify-between">
              <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-1 text-green-600" />
              Current Reservations ({currentReservations.length})
              </span>
              {currentReservations.length > 2 && (
                <button
                  onClick={() => setShowCurrentReservations(true)}
                  className="text-green-600 hover:text-green-800 transition-colors"
                  title="View all current reservations"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
            </h4>
            {currentReservations.length > 0 ? (
              <div className="space-y-2">
                {currentReservations.slice(0, 2).map(reservation => (
                  <div key={reservation.id} className="bg-green-50 p-3 rounded-lg">
                    <p className="font-semibold text-green-800">#{reservation.id}</p>
                    <p className="text-sm text-green-700">
                      {formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}
                    </p>
                    <p className="text-sm text-green-600 capitalize">{reservation.roomType}</p>
                  </div>
                ))}
                {currentReservations.length > 2 && (
                  <p className="text-sm text-gray-500">+{currentReservations.length - 2} more</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No current reservations</p>
            )}
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center justify-between">
              <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-1 text-gray-400" />
              Past Reservations ({pastReservations.length})
              </span>
              {pastReservations.length > 2 && (
                <button
                  onClick={() => setShowPastReservations(true)}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                  title="View all past reservations"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
            </h4>
            {pastReservations.length > 0 ? (
              <div className="space-y-2">
                {pastReservations.slice(0, 2).map(reservation => (
                  <div key={reservation.id} className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-semibold text-gray-700">#{reservation.id}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">{reservation.status}</p>
                  </div>
                ))}
                {pastReservations.length > 2 && (
                  <p className="text-sm text-gray-500">+{pastReservations.length - 2} more</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No past reservations</p>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Current Reservations Modal */}
      <Modal
        isOpen={showCurrentReservations}
        onClose={() => setShowCurrentReservations(false)}
        title={`Current Reservations - ${customer.firstName} ${customer.lastName}`}
      >
        <div className="space-y-4">
          {currentReservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No current reservations</p>
            </div>
          ) : (
            currentReservations.map(reservation => (
              <div key={reservation.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg text-gray-800">#{reservation.id}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(reservation.status)}`}>
                    {reservation.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{reservation.roomType} • {reservation.numberOfGuests} guests</span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="font-semibold">${reservation.totalAmount.toFixed(2)}</span>
                  </div>
                  
                  {reservation.specialRequests && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <MessageSquare className="w-3 h-3 inline mr-1" />
                      {reservation.specialRequests}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Past Reservations Modal */}
      <Modal
        isOpen={showPastReservations}
        onClose={() => setShowPastReservations(false)}
        title={`Past Reservations - ${customer.firstName} ${customer.lastName}`}
      >
        <div className="space-y-4">
          {pastReservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No past reservations</p>
            </div>
          ) : (
            pastReservations.map(reservation => (
              <div key={reservation.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg text-gray-800">#{reservation.id}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(reservation.status)}`}>
                    {reservation.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{reservation.roomType} • {reservation.numberOfGuests} guests</span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="font-semibold">${reservation.totalAmount.toFixed(2)}</span>
                  </div>
                  
                  {reservation.specialRequests && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <MessageSquare className="w-3 h-3 inline mr-1" />
                      {reservation.specialRequests}
                    </div>
                  )}
                  
                  {reservation.cancellationComment && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">
                      <X className="w-3 h-3 inline mr-1" />
                      <strong>Cancellation reason:</strong> {reservation.cancellationComment}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  );
};