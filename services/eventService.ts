import { supabase } from '../lib/supabase';
import { Event } from '../types';

// Table name in Supabase
const TABLE_NAME = 'events';

// Get all events
export const getEvents = async (): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('date', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

// Get upcoming events
export const getUpcomingEvents = async (): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('status', 'upcoming')
      .order('date', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
};

// Get event by ID
export const getEventById = async (id: string): Promise<Event | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error fetching event with ID ${id}:`, error);
    return null;
  }
};

// Create a new event
export const createEvent = async (event: Omit<Event, 'id' | 'created_at'>): Promise<Event | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([event])
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error creating event:', error);
    return null;
  }
};

// Update an event
export const updateEvent = async (id: string, updates: Partial<Event>): Promise<Event | null> => {
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
    console.error(`Error updating event with ID ${id}:`, error);
    return null;
  }
};

// Delete an event
export const deleteEvent = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error deleting event with ID ${id}:`, error);
    return false;
  }
};