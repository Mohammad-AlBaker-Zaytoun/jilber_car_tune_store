export type QuoteStatus =
  | 'new'
  | 'reviewing'
  | 'contacted'
  | 'quoted'
  | 'accepted'
  | 'converted_to_order'
  | 'rejected'
  | 'closed';

export type QuotePriority = 'low' | 'normal' | 'high' | 'urgent';

export type ServiceCategory =
  | 'ECU Tuning'
  | 'Exhaust System'
  | 'Suspension Setup'
  | 'Wheels & Fitment'
  | 'Brake Upgrade'
  | 'Aero Kit'
  | 'Turbo / Supercharger'
  | 'Diagnostics'
  | 'Track Package'
  | 'Full Custom Build'
  | 'Other';

export type PreferredContactMethod = 'phone' | 'whatsapp' | 'email';

export interface QuoteRequest {
  id: string;
  quoteNumber: string;
  userId?: string;

  customerName: string;
  customerEmail: string;
  customerPhone: string;
  preferredContactMethod: PreferredContactMethod;

  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleEngine: string;
  transmission?: string;
  mileage?: string;
  currentModifications?: string;

  serviceCategory: ServiceCategory;
  performanceGoal?: string;
  budgetRange?: string;
  desiredTimeline?: string;
  message: string;

  relatedProductId?: string;
  relatedProductSlug?: string;
  relatedProductName?: string;

  attachments?: string[];

  status: QuoteStatus;
  priority: QuotePriority;
  adminNotes?: string;
  customerReply?: string;

  createdAt: string;
  updatedAt: string;
  contactedAt?: string;
  quotedAt?: string;
  convertedToOrderId?: string;
}

export const QUOTE_STATUSES: QuoteStatus[] = [
  'new',
  'reviewing',
  'contacted',
  'quoted',
  'accepted',
  'converted_to_order',
  'rejected',
  'closed',
];

export const QUOTE_PRIORITIES: QuotePriority[] = ['low', 'normal', 'high', 'urgent'];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  'ECU Tuning',
  'Exhaust System',
  'Suspension Setup',
  'Wheels & Fitment',
  'Brake Upgrade',
  'Aero Kit',
  'Turbo / Supercharger',
  'Diagnostics',
  'Track Package',
  'Full Custom Build',
  'Other',
];

export function formatQuoteStatus(status: QuoteStatus): string {
  const labels: Record<QuoteStatus, string> = {
    new: 'New',
    reviewing: 'Reviewing',
    contacted: 'Contacted',
    quoted: 'Quoted',
    accepted: 'Accepted',
    converted_to_order: 'Converted to Order',
    rejected: 'Rejected',
    closed: 'Closed',
  };
  return labels[status] ?? status;
}

export function formatQuotePriority(priority: QuotePriority): string {
  const labels: Record<QuotePriority, string> = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
  };
  return labels[priority] ?? priority;
}
