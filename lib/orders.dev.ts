/**
 * DEV-ONLY order store — JSON file on disk.
 * Replace with a real database before production.
 */

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { Order, OrderStatus } from '@/types/admin';

export type { Order, OrderStatus };

const DB_PATH = path.join(process.cwd(), '.dev-orders.json');

function readStore(): Order[] {
  try {
    if (!fs.existsSync(DB_PATH)) return [];
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as Order[];
  } catch {
    return [];
  }
}

function writeStore(orders: Order[]): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(orders, null, 2), 'utf-8');
}

export function getOrders(): Order[] {
  return readStore().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getOrderById(id: string): Order | null {
  return readStore().find((o) => o.id === id) ?? null;
}

export function getOrderByRef(ref: string): Order | null {
  return readStore().find((o) => o.ref === ref) ?? null;
}

export function countOrders(): { total: number; pending: number } {
  const all = readStore();
  return {
    total: all.length,
    pending: all.filter((o) => o.status === 'pending').length,
  };
}

export function estimatedRevenue(): number {
  return readStore()
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);
}

export function createOrder(data: Omit<Order, 'id' | 'createdAt' | 'status'>): Order {
  const orders = readStore();
  const order: Order = {
    ...data,
    id: randomUUID(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  writeStore([...orders, order]);
  return order;
}

export function updateOrderStatus(id: string, status: OrderStatus): Order | null {
  const orders = readStore();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], status };
  writeStore(orders);
  return orders[idx];
}

export function updateOrderNotes(id: string, notes: string): Order | null {
  const orders = readStore();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], notes };
  writeStore(orders);
  return orders[idx];
}
