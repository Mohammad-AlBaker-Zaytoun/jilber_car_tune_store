import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import type { ContactInquiry, InquiryStatus } from '@/types/admin';

function rowToInquiry(row: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  vehicle: string | null;
  service: string | null;
  message: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ContactInquiry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    vehicle: row.vehicle ?? undefined,
    service: row.service ?? undefined,
    message: row.message ?? undefined,
    status: row.status as InquiryStatus,
    adminNotes: row.adminNotes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createInquiry(data: {
  name: string;
  email: string;
  phone?: string;
  vehicle?: string;
  service?: string;
  message?: string;
}): Promise<ContactInquiry> {
  const row = await prisma.contactInquiry.create({
    data: {
      id: randomUUID(),
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      vehicle: data.vehicle ?? null,
      service: data.service ?? null,
      message: data.message ?? null,
    },
  });
  return rowToInquiry(row);
}

export async function getInquiries(): Promise<ContactInquiry[]> {
  const rows = await prisma.contactInquiry.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(rowToInquiry);
}

export async function countNewInquiries(): Promise<number> {
  return prisma.contactInquiry.count({ where: { status: 'new' } });
}

export async function updateInquiry(
  id: string,
  data: { status?: InquiryStatus; adminNotes?: string }
): Promise<ContactInquiry | null> {
  try {
    const row = await prisma.contactInquiry.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
    return rowToInquiry(row);
  } catch {
    return null;
  }
}
