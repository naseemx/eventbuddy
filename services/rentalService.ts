import { supabase } from '../lib/supabase';
import { Rental } from '../types';

// Table name in Supabase
const TABLE_NAME = 'rentals';

// Get all active rentals
export const getActiveRentals = async (): Promise<Rental[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('status', 'active')
      .order('return_date', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching active rentals:', error);
    return [];
  }
};

// Get rental by ID
export const getRentalById = async (id: string): Promise<Rental | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error fetching rental with ID ${id}:`, error);
    return null;
  }
};

// Create a new rental
export const createRental = async (rental: Omit<Rental, 'id' | 'created_at'>): Promise<Rental | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([rental])
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error creating rental:', error);
    return null;
  }
};

// Update a rental
export const updateRental = async (id: string, updates: Partial<Rental>): Promise<Rental | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error updating rental with ID ${id}:`, error);
    return null;
  }
};

// Delete a rental
export const deleteRental = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error deleting rental with ID ${id}:`, error);
    return false;
  }
};

