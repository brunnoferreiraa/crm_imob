export type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  whatsapp: string | null;
  cpf: string | null;
  birth_date: string | null;
  client_type: string;
  lead_source: string | null;
  status: string;
  notes: string | null;
  next_contact_at: string | null;
  responsible: { id: string; full_name: string };
  interest: {
    id: string;
    budget_min: string | null;
    budget_max: string | null;
    property_type: string | null;
    cities: string[];
    neighborhoods: string[];
    bedrooms: number | null;
  };
  created_at: string;
  updated_at: string;
};

export type ClientPage = {
  items: Client[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};
