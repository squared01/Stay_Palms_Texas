import React from 'react';
import { useState } from 'react';
import { Reservation, Customer, RoomType, Room } from '../types';
import { formatDate, formatCurrency } from '../utils/reservationUtils';
import { Calendar, User, DollarSign, MessageSquare, Mail, X } from 'lucide-react';
import { Modal } from './Modal';
import { AccessibleDataTable } from './AccessibleDataTable';

interface ReservationListProps {
  reservations: Reservation[];
  customers: Customer[];
  roomTypes: RoomType[];
  rooms: Room[];
  onUpdateStatus: (reservationId: string, status: Reservation['status'], comment?: string) => void;
  onEdit: (reservation: Reservation) => void;
  onSendReminder: (reservationId: string) => void;
  onResendConfirmation: (reservationId: string) => void;
}

export const ReservationList: React.FC<ReservationListProps> = ({
  reservations,
  customers,
  roomTypes,
  rooms,
  onUpdateStatus,
  onEdit,
  onSendReminder,
  onResendConfirmation
}) => {
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null);
  const [cancellationComment, setCancellationComment] = useState('');

  const getCustomer = (customerId: string) => 
    customers.find(c => c.id === customerId);

  const getRoomTypeName = (roomTypeId: string) => {
    const roomType = roomTypes.find(rt => rt.id === roomTypeId);
    return roomType?.name || roomTypeId;
  };
  
  const getRoomNumber = (roomId?: string) => {
    if (!roomId) return null;
    const room = rooms.find(r => r.id === roomId);
    return room?.roomNumber || null;
  };

  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'checked-in': return 'bg-green-100 text-green-800';
      case 'checked-out': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const sortedReservations = [...reservations].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleCancelReservation = () => {
    if (reservationToCancel) {
      onUpdateStatus(reservationToCancel.id, 'cancelled', cancellationComment);
      setReservationToCancel(null);
      setCancellationComment('');
    }
  };

  const closeCancellationModal = () => {
    setReservationToCancel(null);
    setCancellationComment('');
  };

  // Transform reservations for the data table
  const tableData = sortedReservations.map(reservation => {
    const customer = getCustomer(reservation.customerId);
    const isUpcoming = new Date(reservation.checkInDate) > new Date();
    const needsReminder = isUpcoming && !reservation.reminderSent && reservation.status === 'confirmed';
    
    // Check if this is a potential no-show (check-in date is today and it's past 9 AM)
    const now = new Date();
    const checkInDate = new Date(reservation.checkInDate);
    const checkInDateOnly = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const isNoShowRisk = checkInDateOnly.getTime() === today.getTime() && 
                       reservation.status === 'confirmed' && 
                       now.getHours() >= 9;
    
    return {
      ...reservation,
      customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown',
      customerEmail: customer?.email || '',
      roomTypeName: getRoomTypeName(reservation.roomType),
      roomNumber: getRoomNumber(reservation.specificRoomId),
      dateRange: `${formatDate(reservation.checkInDate)} - ${formatDate(reservation.checkOutDate)}`,
      formattedAmount: formatCurrency(reservation.totalAmount),
      needsReminder,
      isNoShowRisk,
    };
  });

  const columns = [
    {
      key: 'id' as const,
      header: 'Reservation ID',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono text-sm">#{value}</span>
      ),
    },
    {
      key: 'customerName' as const,
      header: 'Customer',
      sortable: true,
      filterable: true,
    },
    {
      key: 'dateRange' as const,
      header: 'Dates',
      sortable: false,
    },
    {
      key: 'roomTypeName' as const,
      header: 'Room Type',
      sortable: true,
      filterable: true,
      render: (value: string, row: any) => (
        <div>
          <span>{value}</span>
          {row.roomNumber && (
            <span className="ml-1 text-blue-600 font-semibold">
              (Room {row.roomNumber})
            </span>
          )}
          <div className="text-xs text-gray-500">
            {row.numberOfGuests} guests
          </div>
        </div>
      ),
    },
    {
      key: 'status' as const,
      header: 'Status',
      sortable: true,
      filterable: true,
      render: (value: string, row: any) => (
        <div className="space-y-1">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(value)}`}>
            {value.replace('-', ' ').toUpperCase()}
          </span>
          {row.confirmationSent && (
            <div className="flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full" title={row.confirmationDate ? `Sent: ${formatDate(new Date(row.confirmationDate))}` : 'Confirmation sent'}>
              <Mail className="w-3 h-3 mr-1" />
              Confirmation Sent
            </div>
          )}
          {row.reminderSent && (
            <div className="flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full" title={row.reminderDate ? `Sent: ${formatDate(new Date(row.reminderDate))}` : 'Reminder sent'}>
              <Mail className="w-3 h-3 mr-1" />
              Reminder Sent
            </div>
          )}
          {row.needsReminder && (
            <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
              Reminder Pending
            </div>
          )}
          {row.isNoShowRisk && (
            <div className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
              No-Show Risk
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'formattedAmount' as const,
      header: 'Amount',
      sortable: true,
      render: (value: string) => (
        <span className="font-semibold">{value}</span>
      ),
    },
    {
      key: 'id' as const,
      header: 'Actions',
      sortable: false,
      render: (value: string, row: any) => (
        <div className="flex gap-2 flex-wrap">
          {row.status === 'confirmed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(row.id, 'checked-in');
              }}
              className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              title="Check in guest"
            >
              Check In
            </button>
          )}
          {row.status === 'checked-in' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(row.id, 'checked-out');
              }}
              className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              title="Check out guest"
            >
              Check Out
            </button>
          )}
          {row.confirmationSent && (row.status === 'confirmed' || row.status === 'checked-in') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResendConfirmation(row.id);
              }}
              className="px-3 py-1 text-xs font-medium bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors flex items-center"
              title={`Resend confirmation email${row.confirmationDate ? ` (Last sent: ${formatDate(new Date(row.confirmationDate))})` : ''}`}
            >
              <Mail className="w-3 h-3 mr-1" />
              Resend
            </button>
          )}
          {(row.status === 'confirmed' || row.status === 'checked-in') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setReservationToCancel(reservations.find(r => r.id === row.id) || null);
              }}
              className="px-3 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              title="Cancel reservation"
            >
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];
  return (
    <div className="space-y-6">
      <AccessibleDataTable
        data={tableData}
        columns={columns}
        caption="Hotel reservations with customer details, dates, and status information"
        searchable={true}
        exportable={true}
        pageSize={10}
        rowKeyField="id"
        onRowClick={(row) => {
          // Find the original reservation
          const reservation = reservations.find(r => r.id === row.id);
          if (reservation) {
            onEdit(reservation);
          }
        }}
        className="bg-white rounded-xl shadow-lg"
      />
      
      {/* Cancellation Modal */}
      <Modal
        isOpen={!!reservationToCancel}
        onClose={closeCancellationModal}
        title="Cancel Reservation"
      >
        {reservationToCancel && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Cancel Reservation #{reservationToCancel.id}
              </h3>
              <p className="text-gray-600">
                Are you sure you want to cancel this reservation? This action cannot be undone.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">
                <p><strong>Customer:</strong> {getCustomer(reservationToCancel.customerId)?.firstName} {getCustomer(reservationToCancel.customerId)?.lastName}</p>
                <p><strong>Dates:</strong> {formatDate(reservationToCancel.checkInDate)} - {formatDate(reservationToCancel.checkOutDate)}</p>
                <p><strong>Room:</strong> {getRoomTypeName(reservationToCancel.roomType)}</p>
                {getRoomNumber(reservationToCancel.specificRoomId) && (
                  <p><strong>Room Number:</strong> {getRoomNumber(reservationToCancel.specificRoomId)}</p>
                )}
                <p><strong>Amount:</strong> {formatCurrency(reservationToCancel.totalAmount)}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cancellation Reason (Optional)
              </label>
              <textarea
                value={cancellationComment}
                onChange={(e) => setCancellationComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                placeholder="Enter reason for cancellation..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelReservation}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Confirm Cancellation
              </button>
              <button
                onClick={closeCancellationModal}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Keep Reservation
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};