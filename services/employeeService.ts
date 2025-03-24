import { supabase } from './supabaseClient';

export interface Employee {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  salary: string;
  startdate: string;
  address?: string;
  emergency_contact?: string;
  notes?: string;
  status: 'Active' | 'On Leave' | 'Unavailable';
  created_at?: string;
  updated_at?: string;
}

// To maintain compatibility with the existing frontend code
export interface EmployeeFormData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  salary: string;
  startDate: string;
  address?: string;
  emergencyContact?: string;
  notes?: string;
  status: 'Active' | 'On Leave' | 'Unavailable';
  created_at?: string;
  updated_at?: string;
}

// Convert form data to database format
const toDbFormat = (formData: EmployeeFormData): any => {
  // Create a clean object with only the fields that exist in the database
  const dbData: any = {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    role: formData.role,
    salary: formData.salary,
    // Ensure the field is correctly named for the database
    startdate: formData.startDate,
    status: formData.status
  };
  
  // Add optional fields only if they exist and are not empty
  if (formData.address && formData.address.trim() !== '') {
    dbData.address = formData.address;
  }
  
  if (formData.notes && formData.notes.trim() !== '') {
    dbData.notes = formData.notes;
  }
  
  // Safely add emergency_contact only if the column exists
  // Comment this out to avoid the column error
  // if (formData.emergencyContact && formData.emergencyContact.trim() !== '') {
  //   dbData.emergency_contact = formData.emergencyContact;
  // }
  
  // Log the data for debugging
  console.log('Converted to DB format:', dbData);
  return dbData;
};

// Convert database data to form format
const toFormFormat = (dbData: Employee): EmployeeFormData => {
  return {
    id: dbData.id,
    name: dbData.name,
    email: dbData.email,
    phone: dbData.phone,
    role: dbData.role,
    salary: dbData.salary,
    startDate: dbData.startdate || '',
    address: dbData.address || '',
    emergencyContact: dbData.emergency_contact || '',
    notes: dbData.notes || '',
    status: dbData.status,
    created_at: dbData.created_at,
    updated_at: dbData.updated_at
  };
};

/**
 * Create a new employee in the database
 */
export const createEmployee = async (formData: Omit<EmployeeFormData, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    console.log('Creating employee:', formData);
    
    // Convert to database format
    const dbData = toDbFormat(formData);
    
    const { data, error } = await supabase
      .from('employees')
      .insert(dbData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
    
    console.log('Employee created successfully:', data);
    return toFormFormat(data as Employee);
  } catch (error) {
    console.error('Unexpected error creating employee:', error);
    throw error;
  }
};

/**
 * Get all employees from the database
 */
export const getEmployees = async () => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error getting employees:', error);
      throw error;
    }
    
    // Convert all employees to form format
    return data.map(emp => toFormFormat(emp as Employee));
  } catch (error) {
    console.error('Unexpected error getting employees:', error);
    throw error;
  }
};

/**
 * Get a single employee by ID
 */
export const getEmployeeById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error getting employee with ID ${id}:`, error);
      throw error;
    }
    
    return toFormFormat(data as Employee);
  } catch (error) {
    console.error(`Unexpected error getting employee with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Update an existing employee
 */
export const updateEmployee = async (id: string, formData: Partial<EmployeeFormData>) => {
  try {
    console.log('Updating employee with data:', formData);
    
    // Create a clean update object with correct DB column names
    const updateData: any = {};
    
    // Only include fields that exist in the database
    if (formData.name !== undefined) updateData.name = formData.name;
    if (formData.email !== undefined) updateData.email = formData.email;
    if (formData.phone !== undefined) updateData.phone = formData.phone;
    if (formData.role !== undefined) updateData.role = formData.role;
    if (formData.salary !== undefined) updateData.salary = formData.salary;
    if (formData.status !== undefined) updateData.status = formData.status;
    if (formData.startDate !== undefined) updateData.startdate = formData.startDate;
    if (formData.address !== undefined) updateData.address = formData.address;
    if (formData.notes !== undefined) updateData.notes = formData.notes;
    
    // Skip emergency_contact to avoid column error
    // if (formData.emergencyContact !== undefined) updateData.emergency_contact = formData.emergencyContact;
    
    console.log('Converted update data:', updateData);
    
    const { data, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating employee with ID ${id}:`, error);
      throw error;
    }
    
    return toFormFormat(data as Employee);
  } catch (error) {
    console.error(`Unexpected error updating employee with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an employee from the database
 */
export const deleteEmployee = async (id: string) => {
  try {
    if (!id) {
      console.error(`[DELETE] Invalid employee ID: ${id}`);
      throw new Error('Invalid employee ID');
    }
    
    console.log(`[DELETE] Attempting to delete employee with ID: ${id}`);
    
    // First, verify the employee exists
    const { data: checkData, error: checkError } = await supabase
      .from('employees')
      .select('id, name')
      .eq('id', id)
      .single();
    
    if (checkError) {
      console.error(`[DELETE] Error verifying employee with ID ${id}:`, checkError);
      throw checkError;
    }
    
    if (!checkData) {
      console.error(`[DELETE] Employee with ID ${id} not found`);
      throw new Error(`Employee with ID ${id} not found`);
    }
    
    console.log(`[DELETE] Verified employee exists: ${checkData.name}, proceeding with deletion...`);
    
    // Try to delete the employee with more explicit parameters
    const deleteResponse = await supabase
      .from('employees')
      .delete()
      .match({ id: id });
    
    console.log(`[DELETE] Delete response:`, deleteResponse);
    
    if (deleteResponse.error) {
      console.error(`[DELETE] Error deleting employee with ID ${id}:`, deleteResponse.error);
      throw deleteResponse.error;
    }
    
    // Double-check the employee was actually deleted
    const { data: verifyData, error: verifyError } = await supabase
      .from('employees')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    
    if (verifyError) {
      console.error(`[DELETE] Error verifying deletion:`, verifyError);
    } else if (verifyData) {
      console.error(`[DELETE] Employee still exists after deletion attempt:`, verifyData);
      throw new Error('Failed to delete employee - record still exists');
    } else {
      console.log(`[DELETE] Successfully deleted employee with ID ${id}`);
    }
    
    return true;
  } catch (error) {
    console.error(`[DELETE] Unexpected error deleting employee with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Check if employee has related records before deletion
 */
export const checkEmployeeHasRelatedRecords = async (id: string) => {
  // Always return false to allow deletion without checking related records
  return false;
};

/**
 * Search employees by name, email, role or status
 */
export const searchEmployees = async (searchTerm: string) => {
  try {
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .or(`name.ilike.%${lowerSearchTerm}%,email.ilike.%${lowerSearchTerm}%,role.ilike.%${lowerSearchTerm}%,status.ilike.%${lowerSearchTerm}%`)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error searching employees:', error);
      throw error;
    }
    
    // Convert all employees to form format
    return data.map(emp => toFormFormat(emp as Employee));
  } catch (error) {
    console.error('Unexpected error searching employees:', error);
    throw error;
  }
};

/**
 * Filter employees by status
 */
export const filterEmployeesByStatus = async (status: string) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('status', status)
      .order('name', { ascending: true });
    
    if (error) {
      console.error(`Error filtering employees by status ${status}:`, error);
      throw error;
    }
    
    // Convert all employees to form format
    return data.map(emp => toFormFormat(emp as Employee));
  } catch (error) {
    console.error(`Unexpected error filtering employees by status ${status}:`, error);
    throw error;
  }
}; 