import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getCompanyProfile, updateCompanyProfile, CompanyFormData } from './companyService';

// Context interface
interface CompanyContextType {
  companyData: CompanyFormData | null;
  loading: boolean;
  error: string | null;
  refreshCompanyData: () => Promise<void>;
  updateCompany: (data: CompanyFormData) => Promise<CompanyFormData | null>;
}

// Create the context with a default value
const CompanyContext = createContext<CompanyContextType>({
  companyData: null,
  loading: false,
  error: null,
  refreshCompanyData: async () => {},
  updateCompany: async () => null,
});

// Provider component
export const CompanyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companyData, setCompanyData] = useState<CompanyFormData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  // Load company data
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('CompanyContext: Loading company data...');
        setLoading(true);
        setError(null);
        
        const data = await getCompanyProfile();
        setCompanyData(data);
        console.log('CompanyContext: Company data loaded successfully');
      } catch (err) {
        console.error('CompanyContext: Error loading company data', err);
        setError('Failed to load company data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [refreshCounter]);

  // Function to refresh company data
  const refreshCompanyData = async () => {
    console.log('CompanyContext: Manually refreshing company data');
    setRefreshCounter(prev => prev + 1);
  };

  // Function to update company data
  const updateCompany = async (data: CompanyFormData): Promise<CompanyFormData | null> => {
    try {
      console.log('CompanyContext: Updating company data');
      setLoading(true);
      setError(null);
      
      const updatedData = await updateCompanyProfile(data);
      
      if (updatedData) {
        setCompanyData(updatedData);
        console.log('CompanyContext: Company data updated successfully');
      }
      
      return updatedData;
    } catch (err) {
      console.error('CompanyContext: Error updating company data', err);
      setError('Failed to update company data. Please try again later.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        companyData,
        loading,
        error,
        refreshCompanyData,
        updateCompany
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

// Custom hook to use the company context
export const useCompany = () => useContext(CompanyContext);

export default CompanyContext; 