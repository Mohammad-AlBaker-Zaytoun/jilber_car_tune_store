export type UserRole = 'user' | 'admin';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'awaiting_vehicle'
  | 'in_progress'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled';

export type PaymentStatus =
  | 'unpaid'
  | 'deposit_pending'
  | 'deposit_paid'
  | 'paid'
  | 'refunded'
  | 'not_required';

export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedByUserId: string;
  changedByName: string;
  note?: string;
  createdAt: string;
}

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
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
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
  currency: string;
  adminNotes?: string;
  customerNotes?: string;
  /** Whish payment external id (card payments), once initiated. */
  whishExternalId?: number;
  /** Whish transaction id, recorded once payment is confirmed. */
  whishTransactionId?: string;
  statusHistory: OrderStatusHistoryEntry[];
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
  // Contact & Conversion
  whatsappNumber: string;
  googleMapsUrl: string;
  workingHours: string;
  enableFloatingWhatsApp: boolean;
  enableFloatingCall: boolean;
  defaultWhatsAppMessage: string;
  quoteWhatsAppMessage: string;
  productWhatsAppMessage: string;
}

export interface AdminStats {
  totalProducts: number;
  activeProducts: number;
  totalUsers: number;
  totalOrders: number;
  pendingOrders: number;
  estimatedRevenue: number;
  newInquiries: number;
}

export type InquiryStatus = 'new' | 'read' | 'replied';

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  vehicle?: string;
  service?: string;
  message?: string;
  status: InquiryStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}
