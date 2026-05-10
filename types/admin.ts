export type UserRole = 'user' | 'admin';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

export interface OrderItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  quantity: number;
  visualColor: string;
}

export interface Order {
  id: string;
  ref: string;
  status: OrderStatus;
  createdAt: string;
  userId?: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
  };
  vehicle: {
    make: string;
    model: string;
    year: string;
    engine: string;
    currentMods: string;
    serviceDate: string;
  };
  items: OrderItem[];
  payment: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}

export interface StoredCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
}

export interface AdminSettings {
  shopName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currency: string;
  taxRate: number;
  bookingMessage: string;
}

export interface AdminStats {
  totalProducts: number;
  activeProducts: number;
  totalUsers: number;
  totalOrders: number;
  pendingOrders: number;
  estimatedRevenue: number;
}
