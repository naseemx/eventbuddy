import { supabase } from '../lib/supabase';
import { uploadImageFromUri, uploadBase64Image, generateUniqueFileName } from '../lib/storage';

// Storage bucket for company logos
export const COMPANY_LOGOS_BUCKET = 'company-logos';

// Company profile type
export interface CompanyProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  website: string | null;
  logo_url: string | null;
  tax_id: string | null;
  founded_year: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  twitter: string | null;
  created_at?: string;
  updated_at?: string;
}

// Company form data type
export interface CompanyFormData {
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  website: string | null;
  logo: string | null;
  taxId: string | null;
  foundedYear: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  twitter: string | null;
}

// Create a company logos bucket if it doesn't exist
export const createCompanyLogosBucket = async () => {
  try {
    // First check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === COMPANY_LOGOS_BUCKET);
    
    if (bucketExists) {
      console.log('Company logos bucket already exists, skipping creation');
      return true;
    }
    
    // Try to create bucket
    const { data, error } = await supabase.storage.createBucket(COMPANY_LOGOS_BUCKET, {
      public: true, // Make the bucket public
      fileSizeLimit: 2 * 1024 * 1024, // 2MB limit
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'],
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('Company logos bucket already exists');
        return true;
      }
      
      console.error('Error creating company logos bucket:', error);
      return true; // Return true to allow app to continue
    }

    console.log('Company logos bucket created successfully:', data);
    return true;
  } catch (error) {
    console.error('Error creating company logos bucket:', error);
    return true; // Return true to allow app to continue
  }
};

// Upload company logo
export const uploadCompanyLogo = async (imageUri: string): Promise<string | null> => {
  try {
    console.log('Uploading company logo from URI:', imageUri);
    
    // Generate a unique filename
    const fileName = generateUniqueFileName();
    
    let imageUrl;
    if (imageUri.startsWith('data:')) {
      // Base64 image
      console.log('Uploading company logo as base64');
      imageUrl = await uploadBase64Image(imageUri, 'logos', fileName);
    } else {
      // Local URI
      console.log('Uploading company logo as local URI');
      imageUrl = await uploadImageFromUri(imageUri, 'logos', fileName);
    }
    
    return imageUrl;
  } catch (error) {
    console.error('Error uploading company logo:', error);
    return null;
  }
};

// Convert DB format to form format
const toFormFormat = (company: CompanyProfile): CompanyFormData => {
  return {
    name: company.name,
    email: company.email,
    phone: company.phone,
    whatsapp: company.whatsapp,
    address: company.address,
    website: company.website,
    logo: company.logo_url,
    taxId: company.tax_id,
    foundedYear: company.founded_year,
    instagram: company.instagram,
    facebook: company.facebook,
    youtube: company.youtube,
    twitter: company.twitter,
  };
};

// Convert form format to DB format
const toDbFormat = (formData: CompanyFormData): Partial<CompanyProfile> => {
  return {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    whatsapp: formData.whatsapp,
    address: formData.address,
    website: formData.website,
    logo_url: formData.logo,
    tax_id: formData.taxId,
    founded_year: formData.foundedYear,
    instagram: formData.instagram,
    facebook: formData.facebook,
    youtube: formData.youtube,
    twitter: formData.twitter,
  };
};

// Get company profile
export const getCompanyProfile = async (): Promise<CompanyFormData | null> => {
  try {
    console.log('Fetching company profile');
    
    const { data, error } = await supabase
      .from('company_profile')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      console.error('Error fetching company profile:', error);
      return null;
    }
    
    if (!data) {
      console.log('No company profile found');
      return null;
    }
    
    console.log('Company profile fetched successfully');
    return toFormFormat(data as CompanyProfile);
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return null;
  }
};

// Update company profile
export const updateCompanyProfile = async (formData: CompanyFormData): Promise<CompanyFormData | null> => {
  try {
    console.log('Starting company profile update with data:', JSON.stringify(formData, null, 2));
    
    // Convert form data to DB format
    const updateData = toDbFormat(formData);
    console.log('Converted to DB format:', JSON.stringify(updateData, null, 2));
    
    // Get the current profile to check if it exists
    const { data: currentProfile, error: fetchError } = await supabase
      .from('company_profile')
      .select('id')
      .limit(1)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching current company profile:', fetchError);
      return null;
    }
    
    console.log('Current profile check result:', currentProfile ? `Found profile with ID ${currentProfile.id}` : 'No profile found, will create new');
    
    let result;
    if (currentProfile) {
      // Update existing profile
      console.log(`Updating existing profile with ID ${currentProfile.id}`);
      const { data, error } = await supabase
        .from('company_profile')
        .update(updateData)
        .eq('id', currentProfile.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating company profile:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return null;
      }
      
      result = data;
      console.log('Update successful:', result ? 'Data returned' : 'No data returned');
    } else {
      // Insert new profile
      console.log('Creating new company profile');
      const { data, error } = await supabase
        .from('company_profile')
        .insert(updateData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating company profile:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return null;
      }
      
      result = data;
      console.log('Insert successful:', result ? 'Data returned' : 'No data returned');
    }
    
    if (!result) {
      console.error('No result data returned from update/insert operation');
      return null;
    }
    
    const formattedResult = toFormFormat(result as CompanyProfile);
    console.log('Company profile updated successfully, returning formatted data');
    return formattedResult;
  } catch (error) {
    console.error('Unexpected error updating company profile:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return null;
  }
}; 