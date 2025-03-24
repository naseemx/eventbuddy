CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zipCode TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access" ON public.customers
  FOR SELECT USING (true);
  
CREATE POLICY "Allow anonymous insert access" ON public.customers
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Allow anonymous update access" ON public.customers
  FOR UPDATE USING (true) WITH CHECK (true);
  
CREATE POLICY "Allow anonymous delete access" ON public.customers
  FOR DELETE USING (true); 