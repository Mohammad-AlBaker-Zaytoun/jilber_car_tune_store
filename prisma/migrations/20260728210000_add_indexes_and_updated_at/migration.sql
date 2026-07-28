/*
  Adds the indexes behind the hot read paths, and hands `updatedAt` maintenance
  to Prisma.

  Indexes
    - products.category  — getRelatedProducts() and the storefront category
                           filter were full scans.
    - products.featured  — getFeaturedProducts() (home page) was a full scan.
    - orders.createdAt   — every order list sorts by it.
    - orders.paymentStatus — drives estimatedRevenue() and the reconciliation
                           query in scripts/reconcile-payments.ts.

  updatedAt
    These columns were `@default(now())`, i.e. set once on INSERT and then only
    if a writer remembered to pass a new value. attachWhishExternalId() did not,
    so an order redirected to payment kept a stale updatedAt. Switching to
    Prisma's `@updatedAt` means the client always sets it on UPDATE, so the DB
    DEFAULT constraints are dropped. Existing row values are left untouched.

  Guarded with IF NOT EXISTS / IF EXISTS so the migration is safe to re-run and
  tolerant of environments where some objects were created by hand.
*/

BEGIN TRY

BEGIN TRAN;

-- CreateIndex
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'products_category_idx' AND object_id = OBJECT_ID('dbo.products'))
    CREATE NONCLUSTERED INDEX [products_category_idx] ON [dbo].[products]([category]);

-- CreateIndex
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'products_featured_idx' AND object_id = OBJECT_ID('dbo.products'))
    CREATE NONCLUSTERED INDEX [products_featured_idx] ON [dbo].[products]([featured]);

-- CreateIndex
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'orders_createdAt_idx' AND object_id = OBJECT_ID('dbo.orders'))
    CREATE NONCLUSTERED INDEX [orders_createdAt_idx] ON [dbo].[orders]([createdAt]);

-- CreateIndex
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'orders_paymentStatus_idx' AND object_id = OBJECT_ID('dbo.orders'))
    CREATE NONCLUSTERED INDEX [orders_paymentStatus_idx] ON [dbo].[orders]([paymentStatus]);

-- DropDefault (updatedAt is now maintained by Prisma via @updatedAt)
IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'orders_updatedAt_df')
    ALTER TABLE [dbo].[orders] DROP CONSTRAINT [orders_updatedAt_df];

IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'quotes_updatedAt_df')
    ALTER TABLE [dbo].[quotes] DROP CONSTRAINT [quotes_updatedAt_df];

IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'reviews_updatedAt_df')
    ALTER TABLE [dbo].[reviews] DROP CONSTRAINT [reviews_updatedAt_df];

IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'contact_inquiries_updatedAt_df')
    ALTER TABLE [dbo].[contact_inquiries] DROP CONSTRAINT [contact_inquiries_updatedAt_df];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
