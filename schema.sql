-- Users Table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL, -- Stored as plain text as per requirements (manual auth)
    role TEXT CHECK (role IN ('admin', 'sales')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads Table
CREATE TABLE leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    product_interest TEXT CHECK (product_interest IN ('Bra', 'Panty', 'Lingerie', 'Bedsheet')) NOT NULL,
    quantity INTEGER,
    expected_price NUMERIC,
    lead_source TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    status TEXT CHECK (status IN ('New', 'Contacted', 'Follow-up', 'Negotiation', 'Converted', 'Lost')) DEFAULT 'New',
    notes TEXT,
    assigned_to UUID REFERENCES users(id)
);

-- Follow Ups Table
CREATE TABLE follow_ups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    follow_up_date DATE NOT NULL,
    notes TEXT,
    status TEXT CHECK (status IN ('Pending', 'Completed')) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers Table (Converted Leads)
CREATE TABLE customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id),
    company_name TEXT NOT NULL,
    total_orders INTEGER DEFAULT 0,
    total_order_value NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Admin User
INSERT INTO users (name, email, password, role) 
VALUES ('Admin User', 'admin@miestilo.com', 'admin123', 'admin');
