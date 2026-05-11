/**
 * DEV-ONLY review store — JSON file on disk.
 * Follows the same pattern as lib/products.dev.ts and lib/users.dev.ts.
 * Replace with a real database before production.
 */

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export type ReviewStatus = 'pending' | 'approved' | 'hidden';

export interface Review {
  id: string;
  productId: string;
  productSlug: string;
  userId: string;
  userName: string;
  userEmail: string; // admin-only — never expose in public API responses
  rating: number; // 1–5
  title?: string;
  comment?: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

/** Public-safe view of a review — userEmail stripped. */
export type PublicReview = Omit<Review, 'userEmail'>;

/** When true, new reviews are auto-approved. Set false to require manual moderation. */
export const AUTO_APPROVE_REVIEWS = true;

const DB_PATH = path.join(process.cwd(), '.dev-reviews.json');

function readStore(): Review[] {
  try {
    if (!fs.existsSync(DB_PATH)) return [];
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Review[]) : [];
  } catch {
    return [];
  }
}

function writeStore(reviews: Review[]): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(reviews, null, 2), 'utf-8');
}

export function getReviews(): Review[] {
  return readStore();
}

export function getApprovedReviewsForProduct(productId: string): Review[] {
  return readStore().filter((r) => r.productId === productId && r.status === 'approved');
}

export function getAllReviewsForProduct(productId: string): Review[] {
  return readStore().filter((r) => r.productId === productId);
}

export function getUserReviewForProduct(userId: string, productId: string): Review | null {
  return readStore().find((r) => r.userId === userId && r.productId === productId) ?? null;
}

export function getReviewById(id: string): Review | null {
  return readStore().find((r) => r.id === id) ?? null;
}

export function createReview(
  data: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>
): Review {
  const reviews = readStore();
  if (reviews.some((r) => r.userId === data.userId && r.productId === data.productId)) {
    throw new Error('You have already reviewed this product');
  }
  const now = new Date().toISOString();
  const review: Review = {
    ...data,
    id: `rev-${randomUUID().slice(0, 8)}`,
    createdAt: now,
    updatedAt: now,
  };
  writeStore([...reviews, review]);
  return review;
}

export function updateReview(
  id: string,
  data: Partial<Pick<Review, 'rating' | 'title' | 'comment' | 'status'>>
): Review | null {
  const reviews = readStore();
  const idx = reviews.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  reviews[idx] = { ...reviews[idx], ...data, updatedAt: new Date().toISOString() };
  writeStore(reviews);
  return reviews[idx];
}

export function deleteReview(id: string): boolean {
  const reviews = readStore();
  const filtered = reviews.filter((r) => r.id !== id);
  if (filtered.length === reviews.length) return false;
  writeStore(filtered);
  return true;
}

export function countApprovedReviews(): number {
  return readStore().filter((r) => r.status === 'approved').length;
}
