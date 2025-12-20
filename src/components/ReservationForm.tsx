import React, { useState } from 'react';
import { Customer, Reservation, RoomType, Room, HotelSettings as HotelSettingsType } from '../types';
import { generateReservationId } from '../utils/reservationUtils';
import { Calendar, Users, DollarSign, MessageSquare, Home, AlertCircle, Clock } from 'lucide-react';
import { AccessibleDropdown } from './AccessibleDropdown';

interface ReservationFormProps {
  customers: Customer[];
  roomTypes: RoomType[];
  rooms: Room[];
  existingReservations: Reservation[];
  hotelSettings: HotelSettingsType;
  onSubmit: (reservation: Omit<Reservation, 'id' | 'createdAt' | 'reminderSent'>) => void;
  initialData?: Reservation;
  selectedCustomerId?: string;
  onCancel?: () => void;
}

export const ReservationForm: React.FC<ReservationFormProps> = ({ 
  customers, 
  roomTypes,
  rooms,
  existingReservations,
  hotelSettings,
  onSubmit, 
  initialData,
  selectedCustomerId,
  onCancel 
}) => {
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    customerId: initialData?.customerId || selectedCustomerId || '',
    checkInDate: initialData && initialData.checkInDate instanceof Date ? formatDateForInput(initialData.checkInDate) : '',
    checkOutDate: initialData && initialData.checkOutDate instanceof Date ? formatDateForInput(initialData.checkOutDate) : '',
    roomType: initialData?.roomType || '',
    specificRoomId: initialData?.specificRoomId || '',
    numberOfGuests: initialData?.numberOfGuests || 1,
    totalAmount: initialData?.totalAmount || 0,
    specialRequests: initialData?.specialRequests || '',
  });
  
  const [showAvailability, setShowAvailability] = useState(false);

  // Helper function to create time-aware dates in local timezone
  const createTimeAwareDate = (dateInput: string | Date, timeString: string): Date => {
    let date: Date;

    if (typeof dateInput === 'string') {
      // Parse YYYY-MM-DD string as local date
      const [year, month, day] = dateInput.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      // Use existing Date object, normalize to local midnight
      date = new Date(
        dateInput.getFullYear(),
        dateInput.getMonth(),
        dateInput.getDate()
      );
    }

    // Parse time string (HH:MM) and add to date in local timezone
    const [hours, minutes] = timeString.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);

    return date;
  };

  const calculateTotal = () => {
    if (!formData.checkInDate || !formData.checkOutDate) return 0;
    
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    const roomType = roomTypes.find(rt => rt.id === formData.roomType);
    const basePrice = roomType?.basePrice || 0;
    
    return nights * basePrice;
  };

  const getAvailableRooms = () => {
    if (!formData.checkInDate || !formData.checkOutDate || !formData.roomType) {
      return [];
    }

    // Parse dates as local dates
    const [checkInYear, checkInMonth, checkInDay] = formData.checkInDate.split('-').map(Number);
    const [checkOutYear, checkOutMonth, checkOutDay] = formData.checkOutDate.split('-').map(Number);
    const checkInDate = new Date(checkInYear, checkInMonth - 1, checkInDay);
    const checkOutDate = new Date(checkOutYear, checkOutMonth - 1, checkOutDay);
    
    // Get all rooms of the selected type that are active
    const roomsOfType = rooms.filter(room => 
      room.roomTypeId === formData.roomType && room.isActive
    );
    
    // Create time-aware dates for the new reservation
    const newCheckIn = createTimeAwareDate(checkInDate, hotelSettings.checkInTime);
    const newCheckOut = createTimeAwareDate(checkOutDate, hotelSettings.checkOutTime);
    
    // Get all overlapping reservations for this room type
    const overlappingReservations = existingReservations.filter(reservation => {
      // Skip if editing the same reservation
      if (initialData && reservation.id === initialData.id) {
        return false;
      }
      
      if (reservation.status === 'cancelled' || reservation.status === 'checked-out') {
        return false;
      }
      
      // Only consider reservations for the same room type
      if (reservation.roomType !== formData.roomType) {
        return false;
      }
      
      // Create time-aware dates for existing reservations
      const resCheckIn = createTimeAwareDate(reservation.checkInDate, hotelSettings.checkInTime);
      const resCheckOut = createTimeAwareDate(reservation.checkOutDate, hotelSettings.checkOutTime);
      
      // Check for time-aware overlap: reservations overlap if checkout is after our checkin AND checkin is before our checkout
      return !(resCheckOut <= newCheckIn || resCheckIn >= newCheckOut);
    });
    
    // Separate specific room bookings from generic bookings
    const specificRoomBookings = new Set<string>();
    let genericBookingsCount = 0;
    
    overlappingReservations.forEach(reservation => {
      if (reservation.specificRoomId) {
        specificRoomBookings.add(reservation.specificRoomId);
      } else {
        genericBookingsCount++;
      }
    });
    
    // Filter out rooms that are specifically booked
    const availableSpecificRooms = roomsOfType.filter(room => 
      !specificRoomBookings.has(room.id)
    );
    
    // Account for generic bookings by reducing available rooms
    const totalAvailableRooms = Math.max(0, availableSpecificRooms.length - genericBookingsCount);
    
    // Return the first N available rooms where N is the number we can actually book
    return availableSpecificRooms.slice(0, totalAvailableRooms);
  };

  // Function to find the next available date for the requested duration
  const getNextAvailableDateForRequestedDuration = () => {
    if (!formData.checkInDate || !formData.checkOutDate || !formData.roomType) {
      return null;
    }

    // Parse dates as local dates
    const [checkInYear, checkInMonth, checkInDay] = formData.checkInDate.split('-').map(Number);
    const [checkOutYear, checkOutMonth, checkOutDay] = formData.checkOutDate.split('-').map(Number);
    const checkInDate = new Date(checkInYear, checkInMonth - 1, checkInDay);
    const checkOutDate = new Date(checkOutYear, checkOutMonth - 1, checkOutDay);
    const requestedDurationMs = checkOutDate.getTime() - checkInDate.getTime();

    if (requestedDurationMs <= 0) return null;

    const roomsOfType = rooms.filter(room =>
      room.roomTypeId === formData.roomType && room.isActive
    );

    if (roomsOfType.length === 0) return null;

    // Start checking from today or the requested check-in date, whichever is later
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let searchDate = new Date(Math.max(todayLocal.getTime(), checkInDate.getTime() + 24 * 60 * 60 * 1000));

    const maxSearchDays = 365;
    for (let i = 0; i < maxSearchDays; i++) {
      const potentialCheckOutDate = new Date(searchDate.getTime() + requestedDurationMs);

      // Create time-aware dates for the potential reservation
      const potentialCheckIn = createTimeAwareDate(searchDate, hotelSettings.checkInTime);
      const potentialCheckOut = createTimeAwareDate(potentialCheckOutDate, hotelSettings.checkOutTime);

      // Get all overlapping reservations for this room type and period
      const overlappingReservationsForPeriod = existingReservations.filter(reservation => {
        // Skip if editing the same reservation
        if (initialData && reservation.id === initialData.id) {
          return false;
        }
        
        if (reservation.status === 'cancelled' || reservation.status === 'checked-out') {
          return false;
        }
        
        // Only consider reservations for the same room type
        if (reservation.roomType !== formData.roomType) {
          return false;
        }
        
        // Create time-aware dates for existing reservations
        const resCheckIn = createTimeAwareDate(reservation.checkInDate, hotelSettings.checkInTime);
        const resCheckOut = createTimeAwareDate(reservation.checkOutDate, hotelSettings.checkOutTime);
        
        // Check for time-aware overlap
        return !(resCheckOut <= potentialCheckIn || resCheckIn >= potentialCheckOut);
      });
      
      // Separate specific room bookings from generic bookings
      const specificRoomBookingsForPeriod = new Set<string>();
      let genericBookingsCountForPeriod = 0;
      
      overlappingReservationsForPeriod.forEach(reservation => {
        if (reservation.specificRoomId) {
          specificRoomBookingsForPeriod.add(reservation.specificRoomId);
        } else {
          genericBookingsCountForPeriod++;
        }
      });
      
      // Filter out rooms that are specifically booked
      const availableSpecificRoomsForPeriod = roomsOfType.filter(room => 
        !specificRoomBookingsForPeriod.has(room.id)
      );
      
      // Account for generic bookings by reducing available rooms
      const totalAvailableRoomsForPeriod = Math.max(0, availableSpecificRoomsForPeriod.length - genericBookingsCountForPeriod);
      
      if (totalAvailableRoomsForPeriod > 0) {
        return searchDate;
      }

      // Move to next day in UTC
      searchDate = new Date(searchDate.getTime() + 24 * 60 * 60 * 1000);
    }

    return null;
  };
  
  const availableRooms = getAvailableRooms();
  const hasAvailableRooms = availableRooms.length > 0;
  const nextAvailableDateForDuration = getNextAvailableDateForRequestedDuration();

  // Helper functions
  const parseDateOnly = (s?: string) => {
    if (!s) return undefined;
    // Safe local date from "YYYY-MM-DD" without UTC shift
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  };

  const nightsBetween = (start?: Date, end?: Date) => {
    if (!start || !end) return 0;
    // Normalize to noon local to avoid DST edges
    const a = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12);
    const b = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 12);
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    return Math.max(0, Math.round((b.getTime() - a.getTime()) / MS_PER_DAY));
  };

  const fmtCurrency = (amount: number, currency = "USD", locale = "en-US") =>
    new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);

  const getTodayLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  React.useEffect(() => {
    if (formData.checkInDate && formData.checkOutDate && formData.roomType) {
      setShowAvailability(true);
      // Auto-select first available room if only one is available
      if (availableRooms.length === 1 && !formData.specificRoomId) {
        setFormData(prev => ({ ...prev, specificRoomId: availableRooms[0].id }));
      }
      // Clear room selection if previously selected room is no longer available
      if (formData.specificRoomId && !availableRooms.find(room => room.id === formData.specificRoomId)) {
        setFormData(prev => ({ ...prev, specificRoomId: '' }));
      }
    } else {
      setShowAvailability(false);
    }
  }, [formData.checkInDate, formData.checkOutDate, formData.roomType, formData.specificRoomId, availableRooms]);

  React.useEffect(() => {
    const total = calculateTotal();
    setFormData(prev => ({ ...prev, totalAmount: total }));
  }, [formData.checkInDate, formData.checkOutDate, formData.roomType, roomTypes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse dates as local dates at midnight
    const [checkInYear, checkInMonth, checkInDay] = formData.checkInDate.split('-').map(Number);
    const [checkOutYear, checkOutMonth, checkOutDay] = formData.checkOutDate.split('-').map(Number);

    const checkInDate = new Date(checkInYear, checkInMonth - 1, checkInDay);
    const checkOutDate = new Date(checkOutYear, checkOutMonth - 1, checkOutDay);

    if (checkOutDate <= checkInDate) {
      alert('Check-out date must be after check-in date');
      return;
    }

    // Ensure numberOfGuests is a valid number (at least 1)
    const numberOfGuests = typeof formData.numberOfGuests === 'number' && formData.numberOfGuests > 0
      ? formData.numberOfGuests
      : 1;

    onSubmit({
      customerId: formData.customerId,
      checkInDate,
      checkOutDate,
      roomType: formData.roomType,
      specificRoomId: formData.specificRoomId,
      numberOfGuests,
      totalAmount: formData.totalAmount,
      status: 'confirmed',
      specialRequests: formData.specialRequests || undefined,
    });
  };

  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  // Helper function to format dates consistently in local timezone
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto">
      <div className="flex items-center mb-6">
        <Calendar className="w-6 h-6 text-green-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-800">
          {initialData ? 'Edit Reservation' : 'New Reservation'}
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <AccessibleDropdown
            id="customer-select"
            label="Select Customer"
            options={customers.map(customer => ({
              value: customer.id,
              label: `${customer.firstName} ${customer.lastName} - ${customer.email}`,
            }))}
            value={formData.customerId}
            onChange={(value) => setFormData({ ...formData, customerId: value })}
            placeholder="Choose a customer..."
            required
          />
          
          {selectedCustomer && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Phone:</strong> {selectedCustomer.phone} | 
                <strong> Children:</strong> {selectedCustomer.numberOfKids}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Check-in Date
            </label>
            <input
              type="date"
              value={formData.checkInDate}
              onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
              min={getTodayLocalDate()}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Check-out Date
            </label>
            <input
              type="date"
              value={formData.checkOutDate}
              onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
              min={formData.checkInDate || getTodayLocalDate()}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <AccessibleDropdown
              id="room-type-select"
              label="Room Type"
              options={roomTypes.map(room => ({
                value: room.id,
                label: `${room.name} - $${room.basePrice}/night`,
              }))}
              value={formData.roomType}
              onChange={(value) => setFormData({ ...formData, roomType: value })}
              placeholder="Choose a room type..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Number of Guests
            </label>
            <input
              type="number"
              min="1"
              max="8"
              value={formData.numberOfGuests || ''}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : parseInt(e.target.value);
                setFormData({ ...formData, numberOfGuests: value as number });
              }}
              onBlur={(e) => {
                if (e.target.value === '' || parseInt(e.target.value) < 1) {
                  setFormData({ ...formData, numberOfGuests: 1 });
                }
              }}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        {/* Room Availability Section */}
        {showAvailability && !hasAvailableRooms && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center mb-2">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <h4 className="font-semibold text-red-800">No Rooms Available</h4>
            </div>
            <p className="text-red-700 mb-3">
              All {roomTypes.find(rt => rt.id === formData.roomType)?.name} rooms are booked for the selected dates.
            </p>
            {nextAvailableDateForDuration && (
              <p className="text-red-600 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Next available for this duration: {formatDate(nextAvailableDateForDuration)}
              </p>
            )}
          </div>
        )}

        {showAvailability && hasAvailableRooms && (
          <div>
            <AccessibleDropdown
              id="specific-room-select"
              label="Select Specific Room (Optional)"
              options={[
                { value: '', label: 'Any available room' },
                ...availableRooms.map(room => ({
                  value: room.id,
                  label: `Room ${room.roomNumber}`,
                }))
              ]}
              value={formData.specificRoomId}
              onChange={(value) => setFormData({ ...formData, specificRoomId: value })}
              placeholder="Any available room"
            />
            <p className="text-sm text-gray-500 mt-1">
              {availableRooms.length} room{availableRooms.length === 1 ? '' : 's'} available
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Special Requests (Optional)
          </label>
          <textarea
            value={formData.specialRequests}
            onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
            placeholder="Any special requests or notes..."
          />
        </div>

        {formData.checkInDate && formData.checkOutDate && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="mb-3">
              <h4 className="font-semibold text-green-800 mb-2">Reservation Summary</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Check-in:</strong> {formatDate(new Date(formData.checkInDate))} at {hotelSettings.checkInTime}</p>
                <p><strong>Check-out:</strong> {formatDate(new Date(formData.checkOutDate))} by {hotelSettings.checkOutTime}</p>
                <p><strong>Duration:</strong> {Math.ceil((new Date(formData.checkOutDate).getTime() - new Date(formData.checkInDate).getTime()) / (1000 * 60 * 60 * 24))} nights</p>
                {formData.specificRoomId && (
                  <p><strong>Room:</strong> {rooms.find(r => r.id === formData.specificRoomId)?.roomNumber || 'Assigned at check-in'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-green-800 font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold text-green-600">
                <DollarSign className="w-5 h-5 inline" />
                ${formData.totalAmount}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={!formData.customerId || !formData.checkInDate || !formData.checkOutDate || !formData.roomType}
            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
          >
            {initialData ? 'Update Reservation' : 'Create Reservation'}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
