import React from 'react';
import { Customer, Reservation } from '../types';
import { formatCurrency } from '../utils/reservationUtils';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  User,
  AlertTriangle,
  LogOut
} from 'lucide-react';

interface DashboardProps {
  customers: Customer[];
  reservations: Reservation[];
  overdueCheckOuts: Reservation[];
  hotelSettings: any; // Add hotelSettings prop
  onFilterClick: (filterKey: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ customers, reservations, overdueCheckOuts, hotelSettings, onFilterClick }) => {
  // Create consistent UTC date for today at midnight
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const upcomingReservations = reservations.filter(r => 
    new Date(r.checkInDate) >= todayUTC && r.status === 'confirmed'
  );

  const currentlyCheckedIn = reservations.filter(r => r.status === 'checked-in');

  const monthlyRevenue = reservations
    .filter(r => {
      const reservationDate = new Date(r.createdAt);
      return reservationDate.getMonth() === currentMonth && 
             reservationDate.getFullYear() === currentYear &&
             r.status !== 'cancelled';
    })
    .reduce((sum, r) => sum + r.totalAmount, 0);

  const pendingReminders = reservations.filter(r => {
    if (r.status !== 'confirmed' || r.reminderSent) {
      return false;
    }
    
    const checkInDate = new Date(r.checkInDate);
    const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - todayUTC.getTime()) / (1000 * 60 * 60 * 24));
    
    // Include reservations needing reminders (within 3 days, including today)
    return daysUntilCheckIn <= 3 && daysUntilCheckIn >= 0;
  }).length;

  const noShowRisk = reservations.filter(r => {
    const checkInDate = new Date(r.checkInDate);
    const checkInDateUTC = new Date(Date.UTC(checkInDate.getUTCFullYear(), checkInDate.getUTCMonth(), checkInDate.getUTCDate()));
    
    // Calculate the day after check-in date
    const dayAfterCheckIn = new Date(checkInDateUTC.getTime() + 24 * 60 * 60 * 1000);
    
    // Get current time in minutes and check-in time in minutes
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    const oneAMInMinutes = 1 * 60; // 1:00 AM = 60 minutes
    
    return dayAfterCheckIn.getTime() === todayUTC.getTime() && 
           r.status === 'confirmed' &&
           currentTimeInMinutes >= oneAMInMinutes;
  }).length;

  const stats = [
    {
      title: 'Upcoming Reservations',
      value: upcomingReservations.length,
      icon: Calendar,
      color: 'green',
      filterKey: 'upcoming',
      clickable: true,
    },
    {
      title: 'Currently Checked In',
      value: currentlyCheckedIn.length,
      icon: CheckCircle,
      color: 'teal',
      filterKey: 'checked-in',
      clickable: true,
    },
    {
      title: 'Overdue Check-outs',
      value: overdueCheckOuts.length,
      icon: LogOut,
      color: 'orange',
      filterKey: 'overdue',
      clickable: true,
    },
    {
      title: 'Pending Reminders',
      value: pendingReminders,
      icon: Clock,
      color: 'yellow',
      filterKey: 'email-reminders',
      clickable: true,
    },
    {
      title: 'No-Show Risk',
      value: noShowRisk,
      icon: AlertTriangle,
      color: 'red',
      filterKey: 'no-show-risk',
      clickable: true,
    },
    {
      title: 'Total Reservations',
      value: reservations.length,
      icon: TrendingUp,
      color: 'cyan',
      clickable: false,
    },
    {
      title: 'Total Customers',
      value: customers.length,
      icon: Users,
      color: 'blue',
      clickable: false,
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(monthlyRevenue),
      icon: DollarSign,
      color: 'emerald',
      clickable: false,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500 text-blue-100',
      green: 'bg-green-500 text-green-100',
      teal: 'bg-teal-500 text-teal-100',
      emerald: 'bg-emerald-500 text-emerald-100',
      yellow: 'bg-yellow-500 text-yellow-100',
      cyan: 'bg-cyan-500 text-cyan-100',
      red: 'bg-red-500 text-red-100',
      orange: 'bg-orange-500 text-orange-100',
    };
    return colors[color as keyof typeof colors] || 'bg-gray-500 text-gray-100';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Dashboard Overview</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br from-white to-gray-50 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-gray-100 transition-all ${
                stat.clickable
                  ? 'hover:shadow-lg active:scale-95 sm:hover:scale-105 cursor-pointer transform'
                  : 'hover:shadow-md'
              }`}
              onClick={stat.clickable ? () => onFilterClick(stat.filterKey!) : undefined}
              role={stat.clickable ? 'button' : undefined}
              tabIndex={stat.clickable ? 0 : undefined}
              onKeyDown={stat.clickable ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onFilterClick(stat.filterKey!);
                }
              } : undefined}
              aria-label={stat.clickable ? `View ${stat.title.toLowerCase()}` : undefined}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    {stat.title}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 sm:mt-2 truncate">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2 ${getColorClasses(stat.color)}`}>
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {upcomingReservations.length > 0 && (
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
            <span className="text-sm sm:text-xl">Upcoming Check-ins (Next 7 Days)</span>
          </h3>

          <div className="space-y-2 sm:space-y-3">
            {upcomingReservations
              .filter(r => {
                const daysUntilCheckIn = Math.ceil(
                  (new Date(r.checkInDate).getTime() - todayUTC.getTime()) / (1000 * 60 * 60 * 24)
                );
                return daysUntilCheckIn <= 7;
              })
              .slice(0, 5)
              .map(reservation => {
                const customer = customers.find(c => c.id === reservation.customerId);
                const daysUntilCheckIn = Math.ceil(
                  (new Date(reservation.checkInDate).getTime() - todayUTC.getTime()) / (1000 * 60 * 60 * 24)
                );
                
                return (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    onClick={() => onFilterClick(`reservationId:${reservation.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onFilterClick(`reservationId:${reservation.id}`);
                      }
                    }}
                    aria-label={`View reservation ${reservation.id} for ${customer?.firstName} ${customer?.lastName}`}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                          {customer?.firstName} {customer?.lastName}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">#{reservation.id}</p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">
                        {daysUntilCheckIn === 0 ? 'Today' : `${daysUntilCheckIn} days`}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 capitalize">
                        {reservation.roomType} - {reservation.numberOfGuests}g
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};