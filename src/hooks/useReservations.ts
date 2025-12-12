import { useState, useEffect } from 'react';
import { supabase, DatabaseReservation } from '../lib/supabase';
import { Reservation } from '../types';

// Transform database reservation to app reservation
const transformReservation = (dbReservation: DatabaseReservation): Reservation => ({
  id: dbReservation.id,
  customerId: dbReservation.customer_id,
  checkInDate: new Date(dbReservation.check_in_date + 'T00:00:00.000Z'),
  checkOutDate: new Date(dbReservation.check_out_date + 'T00:00:00.000Z'),
  roomType: dbReservation.room_type,
  specificRoomId: dbReservation.specific_room_id,
  numberOfGuests: dbReservation.number_of_guests,
  totalAmount: dbReservation.total_amount,
  status: dbReservation.status,
  specialRequests: dbReservation.special_requests,
  reminderSent: dbReservation.reminder_sent,
  reminderDate: dbReservation.reminder_date ? new Date(dbReservation.reminder_date) : undefined,
  confirmationSent: dbReservation.confirmation_sent,
  confirmationDate: dbReservation.confirmation_date ? new Date(dbReservation.confirmation_date) : undefined,
  cancellationComment: dbReservation.cancellation_comment,
  createdAt: new Date(dbReservation.created_at),
});

// Transform app reservation to database reservation
const transformToDbReservation = (reservation: Omit<Reservation, 'createdAt'>): Omit<DatabaseReservation, 'created_at'> => ({
  id: reservation.id,
  customer_id: reservation.customerId,
  check_in_date: reservation.checkInDate.toISOString().split('T')[0],
  check_out_date: reservation.checkOutDate.toISOString().split('T')[0],
  room_type: reservation.roomType,
  specific_room_id: reservation.specificRoomId,
  number_of_guests: reservation.numberOfGuests,
  total_amount: reservation.totalAmount,
  status: reservation.status,
  special_requests: reservation.specialRequests,
  reminder_sent: reservation.reminderSent,
  reminder_date: reservation.reminderDate?.toISOString(),
  confirmation_sent: reservation.confirmationSent,
  confirmation_date: reservation.confirmationDate?.toISOString(),
  cancellation_comment: reservation.cancellationComment,
});

export const useReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all reservations
  const fetchReservations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedReservations = data.map(transformReservation);
      setReservations(transformedReservations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  };

  // Create a new reservation
  const createReservation = async (reservationData: Omit<Reservation, 'createdAt'>): Promise<Reservation> => {
    try {
      const dbReservation = transformToDbReservation(reservationData);
      const { data, error } = await supabase
        .from('reservations')
        .insert([dbReservation])
        .select()
        .single();

      if (error) throw error;

      const newReservation = transformReservation(data);
      setReservations(prev => [newReservation, ...prev]);
      return newReservation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create reservation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Update an existing reservation
  const updateReservation = async (id: string, reservationData: Partial<Omit<Reservation, 'id' | 'createdAt'>>): Promise<Reservation> => {
    try {
      const updateData: Partial<Omit<DatabaseReservation, 'id' | 'created_at'>> = {};
      
      if (reservationData.customerId) updateData.customer_id = reservationData.customerId;
      if (reservationData.checkInDate) updateData.check_in_date = reservationData.checkInDate.toISOString().split('T')[0];
      if (reservationData.checkOutDate) updateData.check_out_date = reservationData.checkOutDate.toISOString().split('T')[0];
      if (reservationData.roomType) updateData.room_type = reservationData.roomType;
      if (reservationData.specificRoomId !== undefined) updateData.specific_room_id = reservationData.specificRoomId;
      if (reservationData.numberOfGuests) updateData.number_of_guests = reservationData.numberOfGuests;
      if (reservationData.totalAmount !== undefined) updateData.total_amount = reservationData.totalAmount;
      if (reservationData.status) updateData.status = reservationData.status;
      if (reservationData.specialRequests !== undefined) updateData.special_requests = reservationData.specialRequests;
      if (reservationData.reminderSent !== undefined) updateData.reminder_sent = reservationData.reminderSent;
      if (reservationData.reminderDate !== undefined) updateData.reminder_date = reservationData.reminderDate?.toISOString();
      if (reservationData.confirmationSent !== undefined) updateData.confirmation_sent = reservationData.confirmationSent;
      if (reservationData.confirmationDate !== undefined) updateData.confirmation_date = reservationData.confirmationDate?.toISOString();
      if (reservationData.cancellationComment !== undefined) updateData.cancellation_comment = reservationData.cancellationComment;

      const { data, error } = await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedReservation = transformReservation(data);
      setReservations(prev => prev.map(r => r.id === id ? updatedReservation : r));
      return updatedReservation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update reservation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Delete a reservation
  const deleteReservation = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReservations(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete reservation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Update reservation status
  const updateReservationStatus = async (id: string, status: Reservation['status'], comment?: string): Promise<void> => {
    try {
      const updateData: Partial<Omit<DatabaseReservation, 'id' | 'created_at'>> = {
        status,
      };
      
      if (status === 'cancelled' && comment) {
        updateData.cancellation_comment = comment;
      }

      const { data, error } = await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedReservation = transformReservation(data);
      setReservations(prev => prev.map(r => r.id === id ? updatedReservation : r));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update reservation status';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  return {
    reservations,
    loading,
    error,
    createReservation,
    updateReservation,
    deleteReservation,
    updateReservationStatus,
    refetch: fetchReservations,
  };
};