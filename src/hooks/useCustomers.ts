import { useState, useEffect } from 'react';
import { supabase, DatabaseCustomer } from '../lib/supabase';
import { Customer } from '../types';

// Transform database customer to app customer
const transformCustomer = (dbCustomer: DatabaseCustomer): Customer => ({
  id: dbCustomer.id,
  firstName: dbCustomer.first_name,
  lastName: dbCustomer.last_name,
  email: dbCustomer.email,
  phone: dbCustomer.phone,
  address: dbCustomer.address,
  numberOfKids: dbCustomer.number_of_kids,
  comments: dbCustomer.comments,
  createdAt: new Date(dbCustomer.created_at),
});

// Transform app customer to database customer
const transformToDbCustomer = (customer: Omit<Customer, 'id' | 'createdAt'>): Omit<DatabaseCustomer, 'id' | 'created_at'> => ({
  first_name: customer.firstName,
  last_name: customer.lastName,
  email: customer.email,
  phone: customer.phone,
  address: customer.address,
  number_of_kids: customer.numberOfKids,
  comments: customer.comments,
});

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedCustomers = data.map(transformCustomer);
      setCustomers(transformedCustomers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  // Create a new customer
  const createCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> => {
    try {
      const dbCustomer = transformToDbCustomer(customerData);
      const { data, error } = await supabase
        .from('customers')
        .insert([dbCustomer])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A customer with this email address already exists');
        }
        throw error;
      }

      const newCustomer = transformCustomer(data);
      setCustomers(prev => [newCustomer, ...prev]);
      return newCustomer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create customer';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Update an existing customer
  const updateCustomer = async (id: string, customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> => {
    try {
      const dbCustomer = transformToDbCustomer(customerData);
      const { data, error } = await supabase
        .from('customers')
        .update(dbCustomer)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A customer with this email address already exists');
        }
        throw error;
      }

      const updatedCustomer = transformCustomer(data);
      setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c));
      return updatedCustomer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update customer';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Delete a customer
  const deleteCustomer = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete customer';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return {
    customers,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: fetchCustomers,
  };
};