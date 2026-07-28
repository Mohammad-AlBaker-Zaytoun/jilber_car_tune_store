/**
 * Review repository — MSSQL via Prisma.
 * Public function names/signatures unchanged from the old JSON store.
 * The one-review-per-user-per-product rule is enforced by a DB unique index.
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import type { Review as ReviewRow, Prisma } from '@prisma/client';

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

function rowToReview(row: ReviewRow): Review {
  return {
    id: row.id,
    productId: row.productId,
    productSlug: row.productSlug,
    userId: row.userId,
    userName: row.userName,
    userEmail: row.userEmail,
    rating: row.rating,
    title: row.title ?? undefined,
    comment: row.comment ?? undefined,
    status: row.status as ReviewStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getReviews(): Promise<Review[]> {
  const rows = await prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(rowToReview);
}

/**
 * Approved reviews for many products in ONE query.
 *
 * The store listing used to call getReviews() — the entire table, including
 * every reviewer's email — and filter to approved in JavaScript, bypassing the
 * reviews_status_idx added specifically for this.
 */
export async function getApprovedReviews(): Promise<Review[]> {
  const rows = await prisma.review.findMany({
    where: { status: 'approved' },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(rowToReview);
}

export interface ReviewPage {
  reviews: Review[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statusCounts: Record<string, number>;
}

export const REVIEWS_PAGE_SIZE = 25;

/**
 * Paginated review list for the admin moderation table.
 *
 * All three filters run in SQL. Filtering client-side would only ever search the
 * rows on the current page, which silently hides matches on other pages.
 */
export async function getReviewsPage(
  query: {
    page?: number;
    pageSize?: number;
    status?: string;
    rating?: number;
    search?: string;
  } = {}
): Promise<ReviewPage> {
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const pageSize = Math.min(
    Math.max(1, Math.floor(query.pageSize ?? REVIEWS_PAGE_SIZE)),
    100
  );

  const search = query.search?.trim();
  const where: Prisma.ReviewWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.rating ? { rating: query.rating } : {}),
    ...(search
      ? {
          OR: [
            { userName: { contains: search } },
            { userEmail: { contains: search } },
            { productSlug: { contains: search } },
            { title: { contains: search } },
            { comment: { contains: search } },
          ],
        }
      : {}),
  };

  const [total, rows, grouped] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.review.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const statusCounts: Record<string, number> = {};
  let all = 0;
  for (const g of grouped) {
    statusCounts[g.status] = g._count._all;
    all += g._count._all;
  }
  statusCounts.all = all;

  return {
    reviews: rows.map(rowToReview),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    statusCounts,
  };
}

export async function getApprovedReviewsForProduct(productId: string): Promise<Review[]> {
  const rows = await prisma.review.findMany({
    where: { productId, status: 'approved' },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(rowToReview);
}

export async function getAllReviewsForProduct(productId: string): Promise<Review[]> {
  const rows = await prisma.review.findMany({ where: { productId } });
  return rows.map(rowToReview);
}

export async function getUserReviewForProduct(
  userId: string,
  productId: string
): Promise<Review | null> {
  const row = await prisma.review.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  return row ? rowToReview(row) : null;
}

export async function getReviewById(id: string): Promise<Review | null> {
  const row = await prisma.review.findUnique({ where: { id } });
  return row ? rowToReview(row) : null;
}

export async function createReview(
  data: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Review> {
  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId: data.userId, productId: data.productId } },
  });
  if (existing) throw new Error('You have already reviewed this product');

  const row = await prisma.review.create({
    data: {
      id: `rev-${randomUUID().slice(0, 8)}`,
      productId: data.productId,
      productSlug: data.productSlug,
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      status: data.status,
    },
  });
  return rowToReview(row);
}

export async function updateReview(
  id: string,
  data: Partial<Pick<Review, 'rating' | 'title' | 'comment' | 'status'>>
): Promise<Review | null> {
  const current = await prisma.review.findUnique({ where: { id } });
  if (!current) return null;

  const row = await prisma.review.update({
    where: { id },
    data: {
      ...(data.rating !== undefined ? { rating: data.rating } : {}),
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.comment !== undefined ? { comment: data.comment } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      updatedAt: new Date(),
    },
  });
  return rowToReview(row);
}

export async function deleteReview(id: string): Promise<boolean> {
  try {
    await prisma.review.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function countApprovedReviews(): Promise<number> {
  return prisma.review.count({ where: { status: 'approved' } });
}
