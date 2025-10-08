import React, { useState } from 'react';
import { useMemo } from 'react';
import { Customer, Reservation, CustomerWithReservations, RoomType, NotificationSettings } from './types';
import { useCustomers } from './hooks/useCustomers';
import { useReservations } from './hooks/useReservations';
import { useLocalStorage } from './hooks/useLocalStorage';
import { generateReservationId, formatDate } from './utils/reservationUtils';
import { CustomerForm } from './components/CustomerForm';
import { ReservationForm } from './components/ReservationForm';
import { CustomerCard } from './components/CustomerCard';
import { Modal } from './components/Modal';
import { ReservationList } from './components/ReservationList';
import { Dashboard } from './components/Dashboard';
import { EmailService } from './components/EmailService';
import { RoomPricingSettings } from './components/RoomPricingSettings';
import { EmailNotificationSettings } from './components/EmailNotificationSettings';
import {
  Hotel,
  Users,
  Calendar,
  Plus,
  Search,
  BarChart3,
  Mail,
  Settings,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  X,
  Home,
  LogOut as LogOutIcon
} from 'lucide-react';
import { HotelSettings } from './components/HotelSettings';
import { HotelSettings as HotelSettingsType } from './types';
import { useAutoCancellation } from './hooks/useAutoCancellation';
import { ConnectionStatus } from './components/ProgressiveEnhancement';
import { sendEmail, generateReminderEmail } from './utils/emailService';
import { useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';

// Hotel configuration
const TOTAL_ROOMS = 6;

function App() {
  const { user, loading: authLoading, signOut } = useAuth();

  // Use Supabase hooks for customers and reservations
  const {
    customers: rawCustomers,
    loading: customersLoading,
    error: customersError,
    createCustomer: createCustomerDb,
    updateCustomer: updateCustomerDb,
    deleteCustomer: deleteCustomerDb,
  } = useCustomers();

  const {
    reservations: rawReservations,
    loading: reservationsLoading,
    error: reservationsError,
    createReservation: createReservationDb,
    updateReservation: updateReservationDb,
    updateReservationStatus: updateReservationStatusDb,
  } = useReservations();
  
  // Create consistent UTC date for today at midnight
  const todayUTC = useMemo(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }, []);
  
  const [rawRoomTypes, setRawRoomTypes] = useLocalStorage<RoomType[]>('hotel-room-types', [
    { id: 'standard', name: 'Standard Room', basePrice: 120, description: 'Comfortable room with basic amenities' },
    { id: 'deluxe', name: 'Deluxe Room', basePrice: 180, description: 'Spacious room with premium amenities' },
    { id: 'suite', name: 'Suite', basePrice: 280, description: 'Luxury suite with separate living area' },
    { id: 'family', name: 'Family Room', basePrice: 220, description: 'Large room perfect for families' },
  ]);
  const [hotelSettings, setHotelSettings] = useLocalStorage<HotelSettingsType>('hotel-settings', {
    totalRooms: 6,
    hotelName: 'The Stay Palms Hotel',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    rooms: [
      { id: '1', roomNumber: '101', roomTypeId: 'standard', isActive: true, amenities: ['wifi', 'tv', 'bathroom', 'ac'] },
      { id: '2', roomNumber: '102', roomTypeId: 'standard', isActive: true, amenities: ['wifi', 'tv', 'bathroom', 'ac'] },
      { id: '3', roomNumber: '201', roomTypeId: 'deluxe', isActive: true, amenities: ['wifi', 'tv', 'bathroom', 'ac', 'coffee', 'minibar'] },
      { id: '4', roomNumber: '202', roomTypeId: 'deluxe', isActive: true, amenities: ['wifi', 'tv', 'bathroom', 'ac', 'coffee', 'minibar'] },
      { id: '5', roomNumber: '301', roomTypeId: 'suite', isActive: true, amenities: ['wifi', 'tv', 'bathroom', 'ac', 'coffee', 'minibar', 'balcony'] },
      { id: '6', roomNumber: '302', roomTypeId: 'family', isActive: true, amenities: ['wifi', 'tv', 'bathroom', 'ac', 'coffee'] },
    ],
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'reservations' | 'new-customer' | 'new-reservation' | 'email' | 'settings'>('dashboard');
  const [settingsTab, setSettingsTab] = useState<'hotel' | 'pricing' | 'notifications'>('hotel');
  const [notificationSettings, setNotificationSettings] = useLocalStorage<NotificationSettings>('hotel-notification-settings', {
    fromEmail: 'reservations@seedmkting.com',
    priceChangeNotifications: {
      enabled: false,
      emailAddresses: [],
    },
  });

  // Migrate notification settings if fromEmail is missing
  React.useEffect(() => {
    if (!notificationSettings.fromEmail) {
      setNotificationSettings({
        ...notificationSettings,
        fromEmail: 'reservations@seedmkting.com',
      });
    }
  }, []);

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [selectedCustomerForReservation, setSelectedCustomerForReservation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [reservationSearchTerm, setReservationSearchTerm] = useState('');
  const [showReservationPrompt, setShowReservationPrompt] = useState(false);
  const [newlyCreatedCustomer, setNewlyCreatedCustomer] = useState<Customer | null>(null);
  const [showExistingReservationWarning, setShowExistingReservationWarning] = useState(false);
  const [customerForWarning, setCustomerForWarning] = useState<Customer | null>(null);
  const [openReservationsForWarning, setOpenReservationsForWarning] = useState<Reservation[]>([]);
  const [pendingReservationData, setPendingReservationData] = useState<Omit<Reservation, 'id' | 'createdAt' | 'reminderSent'> | null>(null);
  const [showOverbookingWarning, setShowOverbookingWarning] = useState(false);
  const [overbookedDates, setOverbookedDates] = useState<Date[]>([]);
  const [currentReservationFilter, setCurrentReservationFilter] = useState<{
    status?: Reservation['status'];
    dateType?: 'upcoming' | 'overdue' | 'pending-reminders' | 'no-show-risk';
  } | null>(null);

  // Convert date strings back to Date objects when loading from localStorage
  const reservations = useMemo(() => {
    // rawReservations already has proper Date objects from the hook
    return rawReservations;
  }, [rawReservations]);

  // Calculate overdue check-outs
  const overdueCheckOuts = useMemo(() => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
    const [checkOutHour, checkOutMinute] = hotelSettings.checkOutTime.split(':').map(Number);
    const checkOutTimeInMinutes = checkOutHour * 60 + checkOutMinute;
    
    return reservations.filter(reservation => {
      if (reservation.status !== 'checked-in') return false;
      
      const checkOutDate = new Date(reservation.checkOutDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      checkOutDate.setHours(0, 0, 0, 0);
      
      // Check if check-out date is in the past
      if (checkOutDate < today) return true;
      
      // Check if it's check-out day and past check-out time
      if (checkOutDate.getTime() === today.getTime() && currentTime > checkOutTimeInMinutes) {
        return true;
      }
      
      return false;
    });
  }, [reservations, hotelSettings.checkOutTime]);

  const roomTypes = rawRoomTypes;

  // Convert date strings back to Date objects when loading from localStorage
  const customers = useMemo(() => {
    // rawCustomers already has proper Date objects from the hook
    return rawCustomers;
  }, [rawCustomers]);

  const updateReservationStatus = async (reservationId: string, status: Reservation['status'], comment?: string) => {
    try {
      await updateReservationStatusDb(reservationId, status, comment);
    } catch (error) {
      console.error('Failed to update reservation status:', error);
      alert('Failed to update reservation status. Please try again.');
    }
  };

  // Auto-cancellation for no-shows
  useAutoCancellation({
    reservations,
    onUpdateStatus: updateReservationStatus,
  });

  const checkRoomAvailability = (newReservation: Omit<Reservation, 'id' | 'createdAt' | 'reminderSent'>): Date[] => {
    const overbookedDates: Date[] = [];
    const activeRooms = hotelSettings.rooms.filter(room => room.isActive);
    
    // Helper function to create time-aware dates
    const createTimeAwareDate = (dateInput: string | Date, timeString: string): Date => {
      let date: Date;
      
      if (typeof dateInput === 'string') {
        // Parse YYYY-MM-DD string as UTC date
        const [year, month, day] = dateInput.split('-').map(Number);
        date = new Date(Date.UTC(year, month - 1, day));
      } else {
        // Use existing Date object, normalize to UTC midnight
        date = new Date(Date.UTC(
          dateInput.getUTCFullYear(),
          dateInput.getUTCMonth(),
          dateInput.getUTCDate()
        ));
      }
      
      // Parse time string (HH:MM) and add to date
      const [hours, minutes] = timeString.split(':').map(Number);
      date.setUTCHours(hours, minutes, 0, 0);
      
      return date;
    };
    
    const checkInDate = new Date(newReservation.checkInDate);
    const checkOutDate = new Date(newReservation.checkOutDate);
    
    // Check each night of the proposed stay
    const currentDate = new Date(checkInDate);
    while (currentDate < checkOutDate) {
      // Create time-aware dates for the current night being checked
      const currentCheckIn = createTimeAwareDate(currentDate, hotelSettings.checkInTime);
      const nextDay = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      const currentCheckOut = createTimeAwareDate(nextDay, hotelSettings.checkOutTime);
      
      // Count existing reservations that overlap with this night for the same room type
      const occupiedRoomsOfType = reservations.filter(reservation => {
        if (reservation.status === 'cancelled' || reservation.status === 'checked-out') {
          return false;
        }
        
        // Only count reservations for the same room type
        if (reservation.roomType !== newReservation.roomType) {
          return false;
        }
        
        // Create time-aware dates for existing reservations
        const resCheckIn = createTimeAwareDate(reservation.checkInDate, hotelSettings.checkInTime);
        const resCheckOut = createTimeAwareDate(reservation.checkOutDate, hotelSettings.checkOutTime);
        
        // Check if this reservation overlaps with the current night using time-aware comparison
        return !(resCheckOut <= currentCheckIn || resCheckIn >= currentCheckOut);
      }).length;
      
      // Count available rooms of this type
      const roomsOfType = activeRooms.filter(room => room.roomTypeId === newReservation.roomType).length;
      
      // If adding this new reservation would exceed capacity for this room type
      if (occupiedRoomsOfType + 1 > roomsOfType) {
        overbookedDates.push(new Date(currentDate));
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return overbookedDates;
  };

  const createCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    try {
      const newCustomer = await createCustomerDb(customerData);
      setNewlyCreatedCustomer(newCustomer);
      setShowReservationPrompt(true);
    } catch (error) {
      console.error('Failed to create customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create customer. Please try again.';
      alert(errorMessage);
    }
  };

  const updateCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    if (!editingCustomer) return;

    try {
      await updateCustomerDb(editingCustomer.id, customerData);
      setActiveTab('customers');
      setEditingCustomer(null);
    } catch (error) {
      console.error('Failed to update customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update customer. Please try again.';
      alert(errorMessage);
    }
  };

  const handleReservationPromptResponse = (makeReservation: boolean) => {
    if (makeReservation && newlyCreatedCustomer) {
      setSelectedCustomerForReservation(newlyCreatedCustomer.id);
      setActiveTab('new-reservation');
    } else {
      setActiveTab('customers');
    }
    setShowReservationPrompt(false);
    setNewlyCreatedCustomer(null);
  };

  const createReservation = async (reservationData: Omit<Reservation, 'id' | 'createdAt' | 'reminderSent'>) => {
    try {
      const newReservation: Omit<Reservation, 'createdAt'> = {
        ...reservationData,
        id: generateReservationId(),
        reminderSent: false,
      };
      
      await createReservationDb(newReservation);
      setActiveTab('reservations');
      setSelectedCustomerForReservation(null);
    } catch (error) {
      console.error('Failed to create reservation:', error);
      alert('Failed to create reservation. Please try again.');
    }
  };

  const updateReservation = async (reservationData: Omit<Reservation, 'id' | 'createdAt' | 'reminderSent'>) => {
    if (!editingReservation) return;
    
    try {
      await updateReservationDb(editingReservation.id, {
        ...reservationData,
        reminderSent: editingReservation.reminderSent,
        reminderDate: editingReservation.reminderDate,
      });
      setActiveTab('reservations');
      setEditingReservation(null);
    } catch (error) {
      console.error('Failed to update reservation:', error);
      alert('Failed to update reservation. Please try again.');
    }
  };

  const handleCreateReservationAttempt = (reservationData: Omit<Reservation, 'id' | 'createdAt' | 'reminderSent'>) => {
    // First check room availability
    const overbookedDates = checkRoomAvailability(reservationData);
    if (overbookedDates.length > 0) {
      setOverbookedDates(overbookedDates);
      setShowOverbookingWarning(true);
      return;
    }
    
    const customer = customers.find(c => c.id === reservationData.customerId);
    if (!customer) {
      createReservation(reservationData);
      return;
    }

    // Check for existing open reservations (confirmed or checked-in)
    const openReservations = reservations.filter(r => 
      r.customerId === reservationData.customerId && 
      (r.status === 'confirmed' || r.status === 'checked-in')
    );

    if (openReservations.length > 0) {
      // Show warning modal
      setCustomerForWarning(customer);
      setOpenReservationsForWarning(openReservations);
      setPendingReservationData(reservationData);
      setShowExistingReservationWarning(true);
    } else {
      // No open reservations, proceed normally
      createReservation(reservationData);
    }
  };

  const confirmReservationCreation = () => {
    if (pendingReservationData) {
      createReservation(pendingReservationData);
    }
    setShowExistingReservationWarning(false);
    setCustomerForWarning(null);
    setOpenReservationsForWarning([]);
    setPendingReservationData(null);
  };

  const cancelReservationCreation = () => {
    setShowExistingReservationWarning(false);
    setCustomerForWarning(null);
    setOpenReservationsForWarning([]);
    setPendingReservationData(null);
    setShowOverbookingWarning(false);
    setOverbookedDates([]);
  };

  const deleteCustomer = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      console.warn('Customer not found for deletion');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${customer.firstName} ${customer.lastName} and all their reservations?`)) {
      try {
        await deleteCustomerDb(customerId);
        
        if (editingCustomer?.id === customerId) {
          setEditingCustomer(null);
        }
        
        alert(`Customer ${customer.firstName} ${customer.lastName} has been successfully deleted.`);
      } catch (error) {
        console.error('Failed to delete customer:', error);
        alert('Failed to delete customer. Please try again.');
      }
    }
  };

  const sendReminder = async (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    const customer = customers.find(c => c.id === reservation?.customerId);
    
    if (reservation && customer) {
      try {
        // Generate email template
        const emailTemplate = generateReminderEmail(reservation, customer);

        // Send email via Supabase Edge Function
        const result = await sendEmail(customer.email, emailTemplate, notificationSettings.fromEmail);
        
        if (result.success) {
          // Update reservation status
          await updateReservationDb(reservationId, {
            reminderSent: true,
            reminderDate: new Date(),
          });
          
          alert(`Email successfully sent to ${customer.firstName} ${customer.lastName} (${customer.email})`);
        } else {
          alert(`Failed to send email: ${result.error}`);
        }
      } catch (error) {
        console.error('Error sending reminder email:', error);
        alert('Failed to send email. Please check your internet connection and try again.');
      }
    }
  };

  const sendPriceChangeNotification = (roomType: RoomType, oldPrice: number, newPrice: number) => {
    if (notificationSettings.priceChangeNotifications.enabled && notificationSettings.priceChangeNotifications.emailAddresses.length > 0) {
      // In a real application, this would send actual emails
      const emailList = notificationSettings.priceChangeNotifications.emailAddresses.join(', ');
      const message = `Room price change notification sent to: ${emailList}\n\nRoom Type: ${roomType.name}\nOld Price: $${oldPrice.toFixed(2)}\nNew Price: $${newPrice.toFixed(2)}`;
      alert(message);
    }
  };

  const handleFilterClick = (filterKey: string) => {
    setActiveTab('reservations');
    
    // Handle specific reservation ID clicks
    if (filterKey.startsWith('reservationId:')) {
      const reservationId = filterKey.replace('reservationId:', '');
      setReservationSearchTerm(reservationId);
      setCurrentReservationFilter(null);
      return;
    }
    
    // Clear text search when using card filters
    setReservationSearchTerm('');
    
    // Set filter based on card clicked
    switch (filterKey) {
      case 'upcoming':
        setCurrentReservationFilter({ dateType: 'upcoming' });
        break;
      case 'checked-in':
        setCurrentReservationFilter({ status: 'checked-in' });
        break;
      case 'overdue':
        setCurrentReservationFilter({ dateType: 'overdue' });
        break;
      case 'pending-reminders':
        setCurrentReservationFilter({ dateType: 'pending-reminders' });
        break;
      case 'no-show-risk':
        setCurrentReservationFilter({ dateType: 'no-show-risk' });
        break;
      case 'email-reminders':
        setActiveTab('email');
        return; // Don't set reservation filter, just switch tabs
      default:
        setCurrentReservationFilter(null);
    }
  };

  const getCustomersWithReservations = (): CustomerWithReservations[] => {
    return customers.map(customer => ({
      ...customer,
      reservations: reservations.filter(r => r.customerId === customer.id),
    }));
  };

  const filteredCustomers = getCustomersWithReservations().filter(customer =>
    `${customer.firstName} ${customer.lastName} ${customer.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const filteredReservations = reservations.filter(reservation => {
    // Apply card-based filter first if no text search
    if (!reservationSearchTerm.trim() && currentReservationFilter) {
      const now = new Date();
      
      if (currentReservationFilter.status) {
        if (reservation.status !== currentReservationFilter.status) {
          return false;
        }
      }
      
      if (currentReservationFilter.dateType) {
        switch (currentReservationFilter.dateType) {
          case 'upcoming':
            if (!(new Date(reservation.checkInDate) >= todayUTC && reservation.status === 'confirmed')) {
              return false;
            }
            break;
          case 'overdue':
            const checkOutDate = new Date(reservation.checkOutDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const checkOutDateUTC = new Date(Date.UTC(checkOutDate.getUTCFullYear(), checkOutDate.getUTCMonth(), checkOutDate.getUTCDate()));
            
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const [checkOutHour, checkOutMinute] = hotelSettings.checkOutTime.split(':').map(Number);
            const checkOutTimeInMinutes = checkOutHour * 60 + checkOutMinute;
            
            const isOverdue = reservation.status === 'checked-in' && (
              checkOutDateUTC < todayUTC || 
              (checkOutDateUTC.getTime() === todayUTC.getTime() && currentTime > checkOutTimeInMinutes)
            );
            
            if (!isOverdue) {
              return false;
            }
            break;
          case 'pending-reminders':
            const checkInDate = new Date(reservation.checkInDate);
            const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - todayUTC.getTime()) / (1000 * 60 * 60 * 24));
            
            if (!(daysUntilCheckIn <= 3 && 
                  daysUntilCheckIn >= 0 &&
                  !reservation.reminderSent && 
                  reservation.status === 'confirmed')) {
              return false;
            }
            break;
          case 'no-show-risk':
            const noShowCheckInDate = new Date(reservation.checkInDate);
            const checkInDateUTC = new Date(Date.UTC(noShowCheckInDate.getUTCFullYear(), noShowCheckInDate.getUTCMonth(), noShowCheckInDate.getUTCDate()));
            
            // Calculate the day after check-in date
            const dayAfterCheckIn = new Date(checkInDateUTC.getTime() + 24 * 60 * 60 * 1000);
            
            // Get current time in minutes (for 1:00 AM check)
            const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
            const oneAMInMinutes = 1 * 60; // 1:00 AM = 60 minutes
            
            const isNoShowRisk = dayAfterCheckIn.getTime() === todayUTC.getTime() && 
                               reservation.status === 'confirmed' &&
                               currentTimeInMinutes >= oneAMInMinutes;
            
            if (!isNoShowRisk) {
              return false;
            }
            break;
        }
      }
      
      return true;
    }
    
    // Apply text search filter
    const customer = customers.find(c => c.id === reservation.customerId);
    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : '';
    const searchableText = `${reservation.id} ${reservation.roomType} ${customerName} ${customer?.email || ''} ${reservation.specialRequests || ''}`;
    
    const trimmedSearchTerm = reservationSearchTerm.trim();
    
    // If search term is empty, show all reservations
    if (trimmedSearchTerm === '') {
      return true;
    }
    
    return searchableText.toLowerCase().includes(trimmedSearchTerm.toLowerCase());
  });

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reservations', label: 'Reservations', icon: Calendar },
    { id: 'email', label: 'Email Reminders', icon: Mail },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Show auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <Auth />;
  }

  // Show loading state
  if (customersLoading || reservationsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hotel data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (customersError || reservationsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Database Connection Error</h2>
          <p className="text-gray-600 mb-4">
            {customersError || reservationsError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ConnectionStatus />
      
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center min-w-0 flex-1">
              <Hotel className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
              <h1 className="text-base sm:text-2xl font-bold text-gray-800 truncate">{hotelSettings.hotelName}</h1>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
              <button
                onClick={() => setActiveTab('new-customer')}
                className="flex items-center px-2 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-xs sm:text-base"
                title="New Customer"
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">New Customer</span>
              </button>

              <button
                onClick={() => setActiveTab('new-reservation')}
                className="flex items-center px-2 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-xs sm:text-base"
                title="New Reservation"
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">New Reservation</span>
              </button>

              <button
                onClick={signOut}
                className="flex items-center px-2 py-2 sm:px-4 sm:py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                title="Sign Out"
              >
                <LogOutIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              <tab.icon className={`w-5 h-5 mb-1 ${
                activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <span className="text-xs font-medium">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 mb-16 md:mb-0">
        {activeTab === 'dashboard' && (
          <Dashboard 
            customers={customers} 
            reservations={reservations} 
            overdueCheckOuts={overdueCheckOuts}
            hotelSettings={hotelSettings}
            onFilterClick={handleFilterClick}
          />
        )}

        {activeTab === 'customers' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-600" />
                  Customer Profiles ({customers.length})
                </h2>

                <div className="relative w-full sm:w-auto">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-2.5 sm:top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 sm:pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64 text-sm sm:text-base"
                  />
                </div>
              </div>
              
              <div className="grid gap-6">
                {filteredCustomers.map(customer => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    onDelete={deleteCustomer}
                    onEdit={setEditingCustomer}
                    onCreateReservation={(customerId) => {
                      setSelectedCustomerForReservation(customerId);
                      setActiveTab('new-reservation');
                    }}
                  />
                ))}
                
                {filteredCustomers.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">No customers found</p>
                    <p>Start by creating your first customer profile</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-600" />
                  All Reservations ({reservations.length})
                </h2>

                <div className="relative w-full sm:w-auto">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-2.5 sm:top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reservations..."
                    value={reservationSearchTerm}
                    onChange={(e) => {
                      setReservationSearchTerm(e.target.value);
                      if (e.target.value.trim()) {
                        setCurrentReservationFilter(null);
                      }
                    }}
                    className="pl-9 sm:pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64 text-sm sm:text-base"
                  />
                </div>
              </div>
              
              {/* Show active filter indicator */}
              {currentReservationFilter && !reservationSearchTerm.trim() && (
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm text-gray-600">Filtered by:</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {currentReservationFilter.status && `Status: ${currentReservationFilter.status.replace('-', ' ')}`}
                    {currentReservationFilter.dateType && {
                      'upcoming': 'Upcoming Reservations',
                      'overdue': 'Overdue Check-outs',
                      'pending-reminders': 'Pending Reminders',
                      'no-show-risk': 'No-Show Risk'
                    }[currentReservationFilter.dateType]}
                  </span>
                  <button
                    onClick={() => setCurrentReservationFilter(null)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear filter
                  </button>
                </div>
              )}
            </div>
            
            <ReservationList
              key={JSON.stringify({ searchTerm: reservationSearchTerm, filter: currentReservationFilter })}
              reservations={filteredReservations}
              customers={customers}
              roomTypes={roomTypes}
              rooms={hotelSettings.rooms}
              onUpdateStatus={updateReservationStatus}
              onEdit={setEditingReservation}
              onSendReminder={sendReminder}
            />
          </div>
        )}

        {activeTab === 'email' && (
          <EmailService
            reservations={reservations}
            customers={customers}
            onSendReminder={sendReminder}
          />
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setSettingsTab('hotel')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      settingsTab === 'hotel'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Hotel className="w-4 h-4 inline mr-2" />
                    Hotel & Rooms
                  </button>
                  
                  <button
                    onClick={() => setSettingsTab('pricing')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      settingsTab === 'pricing'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Room Pricing
                  </button>
                  
                  <button
                    onClick={() => setSettingsTab('notifications')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      settingsTab === 'notifications'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Notifications
                  </button>
                </nav>
              </div>
            </div>
            
            {settingsTab === 'hotel' && (
              <HotelSettings
                settings={hotelSettings}
                roomTypes={roomTypes}
                onUpdateSettings={setHotelSettings}
                onUpdateRoomTypes={setRawRoomTypes}
              />
            )}
            
            {settingsTab === 'pricing' && (
              <RoomPricingSettings
                roomTypes={roomTypes}
                onUpdateRoomTypes={setRawRoomTypes}
                notificationSettings={notificationSettings}
                onSendPriceChangeNotification={sendPriceChangeNotification}
              />
            )}
            
            {settingsTab === 'notifications' && (
              <EmailNotificationSettings
                settings={notificationSettings}
                onUpdateSettings={setNotificationSettings}
              />
            )}
          </div>
        )}

        {activeTab === 'new-customer' && (
          <CustomerForm
            onSubmit={createCustomer}
            onCancel={() => setActiveTab('customers')}
          />
        )}

        {editingCustomer && (
          <Modal
            isOpen={!!editingCustomer}
            onClose={() => {
              setEditingCustomer(null);
              setActiveTab('customers');
            }}
          >
            <CustomerForm
              onSubmit={updateCustomer}
              initialData={editingCustomer}
              onCancel={() => {
                setEditingCustomer(null);
                setActiveTab('customers');
              }}
            />
          </Modal>
        )}

        {editingReservation && (
          <Modal
            isOpen={!!editingReservation}
            onClose={() => {
              setEditingReservation(null);
              setActiveTab('reservations');
            }}
          >
            <ReservationForm
              customers={customers}
              roomTypes={roomTypes}
              rooms={hotelSettings.rooms}
              existingReservations={reservations}
              hotelSettings={hotelSettings}
              onSubmit={updateReservation}
              initialData={editingReservation}
              onCancel={() => {
                setEditingReservation(null);
                setActiveTab('reservations');
              }}
            />
          </Modal>
        )}

        {activeTab === 'new-reservation' && (
          <div className="space-y-6">
            {selectedCustomerForReservation && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-blue-800">
                  Creating reservation for: {
                    customers.find(c => c.id === selectedCustomerForReservation)
                      ? `${customers.find(c => c.id === selectedCustomerForReservation)!.firstName} ${customers.find(c => c.id === selectedCustomerForReservation)!.lastName}`
                      : 'Selected Customer'
                  }
                </p>
              </div>
            )}
            
            <ReservationForm
              customers={customers.filter(c => !selectedCustomerForReservation || c.id === selectedCustomerForReservation)}
              roomTypes={roomTypes}
              rooms={hotelSettings.rooms}
              hotelSettings={hotelSettings}
              existingReservations={reservations}
              selectedCustomerId={selectedCustomerForReservation || undefined}
              onSubmit={(reservationData) => {
                handleCreateReservationAttempt({
                  ...reservationData,
                  customerId: selectedCustomerForReservation || reservationData.customerId,
                });
              }}
              onCancel={() => {
                setActiveTab('reservations');
                setSelectedCustomerForReservation(null);
              }}
            />
          </div>
        )}
      </main>
      
      {/* Reservation Prompt Modal */}
      <Modal
        isOpen={showReservationPrompt}
        onClose={() => handleReservationPromptResponse(false)}
        title="Create Reservation"
      >
        {newlyCreatedCustomer && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Customer Created Successfully!
              </h3>
              <p className="text-gray-600">
                {newlyCreatedCustomer.firstName} {newlyCreatedCustomer.lastName} has been added to your customer database.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">
                <p><strong>Name:</strong> {newlyCreatedCustomer.firstName} {newlyCreatedCustomer.lastName}</p>
                <p><strong>Email:</strong> {newlyCreatedCustomer.email}</p>
                <p><strong>Phone:</strong> {newlyCreatedCustomer.phone}</p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-gray-700 mb-4">
                Would you like to create a reservation for this customer now?
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => handleReservationPromptResponse(true)}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Yes, Create Reservation
              </button>
              <button
                onClick={() => handleReservationPromptResponse(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                No, Go to Customers
              </button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Existing Reservation Warning Modal */}
      <Modal
        isOpen={showExistingReservationWarning}
        onClose={cancelReservationCreation}
        title="Existing Reservation Warning"
      >
        {customerForWarning && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Customer Has Existing Reservations
              </h3>
              <p className="text-gray-600">
                {customerForWarning.firstName} {customerForWarning.lastName} already has {openReservationsForWarning.length} open reservation{openReservationsForWarning.length > 1 ? 's' : ''}.
              </p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Existing Open Reservations:
              </h4>
              <div className="space-y-2">
                {openReservationsForWarning.map(reservation => (
                  <div key={reservation.id} className="bg-white p-3 rounded border border-yellow-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">#{reservation.id}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">
                          {reservation.roomType} • {reservation.numberOfGuests} guests
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        reservation.status === 'confirmed' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {reservation.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> Creating multiple reservations for the same customer may cause confusion. 
                Please verify this is intentional before proceeding.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={confirmReservationCreation}
                className="flex-1 bg-yellow-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-yellow-700 transition-colors flex items-center justify-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Proceed Anyway
              </button>
              <button
                onClick={cancelReservationCreation}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel New Reservation
              </button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Overbooking Warning Modal */}
      <Modal
        isOpen={showOverbookingWarning}
        onClose={() => {
          setShowOverbookingWarning(false);
          setOverbookedDates([]);
        }}
        title="Hotel Fully Booked"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              The hotel is fully booked for the selected dates. We only have {TOTAL_ROOMS} rooms available.
            </h3>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="font-semibold text-red-800 mb-3 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Fully Booked Dates:
            </h4>
            <div className="space-y-1">
              {overbookedDates.map((date, index) => (
                <div key={index} className="text-sm text-red-700">
                  • {formatDate(date)}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Suggestions:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Try different dates when rooms are available</li>
              <li>• Check if any existing reservations can be modified</li>
              <li>• Consider placing the customer on a waiting list</li>
            </ul>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={() => {
                setShowOverbookingWarning(false);
                setOverbookedDates([]);
              }}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default App;