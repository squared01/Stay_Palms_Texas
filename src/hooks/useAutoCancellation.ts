import { useEffect } from 'react';
import { Reservation } from '../types';

interface UseAutoCancellationProps {
  reservations: Reservation[];
  onUpdateStatus: (reservationId: string, status: Reservation['status'], comment?: string) => void;
}

export const useAutoCancellation = ({ reservations, onUpdateStatus }: UseAutoCancellationProps) => {
  useEffect(() => {
    const checkForNoShows = () => {
      const now = new Date();

      // Create today's date at midnight in local time for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Create cutoff time (11:00 AM today) in local time
      const cutoffTime = new Date();
      cutoffTime.setHours(11, 0, 0, 0);

      const noShowReservations = reservations.filter(reservation => {
        // Only check confirmed reservations
        if (reservation.status !== 'confirmed') {
          return false;
        }

        // Get reservation dates
        const checkInDate = new Date(reservation.checkInDate);
        const checkOutDate = new Date(reservation.checkOutDate);

        // Normalize dates to midnight in local time for comparison
        const checkInDateOnly = new Date(checkInDate);
        checkInDateOnly.setHours(0, 0, 0, 0);

        const checkOutDateOnly = new Date(checkOutDate);
        checkOutDateOnly.setHours(0, 0, 0, 0);

        // Only auto-cancel if:
        // 1. Check-in date is today AND it's past 11:00 AM AND guest hasn't checked in
        // 2. Check-out date was yesterday or earlier (guest never showed up for entire stay)
        const isCheckInToday = checkInDateOnly.getTime() === today.getTime();
        const isCheckInOverdue = isCheckInToday && now >= cutoffTime;

        // Only consider it overdue if the checkout date is in the past (not today)
        const isStayOverdue = checkOutDateOnly.getTime() < today.getTime();

        return isCheckInOverdue || isStayOverdue;
      });

      // Auto-cancel no-show reservations
      noShowReservations.forEach(reservation => {
        const checkInDate = new Date(reservation.checkInDate);
        const checkOutDate = new Date(reservation.checkOutDate);

        const checkInDateOnly = new Date(checkInDate);
        checkInDateOnly.setHours(0, 0, 0, 0);

        const checkOutDateOnly = new Date(checkOutDate);
        checkOutDateOnly.setHours(0, 0, 0, 0);

        const isCheckInToday = checkInDateOnly.getTime() === today.getTime();
        const isStayOverdue = checkOutDateOnly.getTime() < today.getTime();

        let cancellationComment: string;
        if (isStayOverdue) {
          cancellationComment = `Automatically cancelled - Guest did not check in by departure date (${checkOutDate.toLocaleDateString()})`;
        } else {
          cancellationComment = `Automatically cancelled - Guest did not check in by 11:00 AM on ${checkInDate.toLocaleDateString()}`;
        }

        console.log(`Auto-cancelling no-show reservation: ${reservation.id}`);
        onUpdateStatus(
          reservation.id,
          'cancelled',
          cancellationComment
        );
      });

      if (noShowReservations.length > 0) {
        console.log(`Auto-cancelled ${noShowReservations.length} no-show reservation(s)`);
      }
    };

    // Check immediately when component mounts
    checkForNoShows();

    // Set up interval to check every 30 minutes (only in production, you may want to disable this during development)
    const interval = setInterval(checkForNoShows, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [reservations, onUpdateStatus]);
};