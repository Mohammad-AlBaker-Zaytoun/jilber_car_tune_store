BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(64) NOT NULL,
    [email] NVARCHAR(320) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000),
    [passwordHash] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [users_role_df] DEFAULT 'user',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[categories] (
    [id] NVARCHAR(64) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(191) NOT NULL,
    [description] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [categories_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [categories_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [categories_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[products] (
    [id] NVARCHAR(64) NOT NULL,
    [slug] NVARCHAR(191) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL,
    [shortDescription] NVARCHAR(max) NOT NULL,
    [description] NVARCHAR(max) NOT NULL,
    [price] DECIMAL(10,2) NOT NULL,
    [oldPrice] DECIMAL(10,2),
    [currency] NVARCHAR(1000) NOT NULL CONSTRAINT [products_currency_df] DEFAULT 'USD',
    [badge] NVARCHAR(1000),
    [rating] FLOAT(53) NOT NULL CONSTRAINT [products_rating_df] DEFAULT 0,
    [reviewCount] INT NOT NULL CONSTRAINT [products_reviewCount_df] DEFAULT 0,
    [inStock] BIT NOT NULL CONSTRAINT [products_inStock_df] DEFAULT 1,
    [featured] BIT NOT NULL CONSTRAINT [products_featured_df] DEFAULT 0,
    [visualColor] NVARCHAR(1000) NOT NULL,
    [visualColor2] NVARCHAR(1000) NOT NULL,
    [specs] NVARCHAR(max) NOT NULL CONSTRAINT [products_specs_df] DEFAULT '[]',
    [compatibility] NVARCHAR(max) NOT NULL CONSTRAINT [products_compatibility_df] DEFAULT '[]',
    [includedItems] NVARCHAR(max) NOT NULL CONSTRAINT [products_includedItems_df] DEFAULT '[]',
    [images] NVARCHAR(max) NOT NULL CONSTRAINT [products_images_df] DEFAULT '[]',
    CONSTRAINT [products_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [products_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[orders] (
    [id] NVARCHAR(64) NOT NULL,
    [ref] NVARCHAR(64) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [orders_status_df] DEFAULT 'pending',
    [paymentStatus] NVARCHAR(1000) NOT NULL CONSTRAINT [orders_paymentStatus_df] DEFAULT 'unpaid',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [orders_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL CONSTRAINT [orders_updatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [completedAt] DATETIME2,
    [cancelledAt] DATETIME2,
    [userId] NVARCHAR(64),
    [customerFullName] NVARCHAR(1000) NOT NULL,
    [customerEmail] NVARCHAR(1000) NOT NULL,
    [customerPhone] NVARCHAR(1000) NOT NULL,
    [customerAddress] NVARCHAR(max) NOT NULL,
    [vehicleMake] NVARCHAR(1000) NOT NULL,
    [vehicleModel] NVARCHAR(1000) NOT NULL,
    [vehicleYear] NVARCHAR(1000) NOT NULL,
    [vehicleEngine] NVARCHAR(1000) NOT NULL,
    [vehicleCurrentMods] NVARCHAR(max) NOT NULL,
    [vehicleServiceDate] NVARCHAR(1000) NOT NULL,
    [payment] NVARCHAR(1000) NOT NULL,
    [subtotal] DECIMAL(10,2) NOT NULL,
    [tax] DECIMAL(10,2) NOT NULL,
    [total] DECIMAL(10,2) NOT NULL,
    [currency] NVARCHAR(1000) NOT NULL CONSTRAINT [orders_currency_df] DEFAULT 'USD',
    [adminNotes] NVARCHAR(max),
    [customerNotes] NVARCHAR(max),
    CONSTRAINT [orders_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [orders_ref_key] UNIQUE NONCLUSTERED ([ref])
);

-- CreateTable
CREATE TABLE [dbo].[order_items] (
    [id] NVARCHAR(64) NOT NULL,
    [orderId] NVARCHAR(64) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL,
    [price] DECIMAL(10,2) NOT NULL,
    [currency] NVARCHAR(1000) NOT NULL,
    [quantity] INT NOT NULL,
    [visualColor] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [order_items_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[order_status_history] (
    [id] NVARCHAR(64) NOT NULL,
    [orderId] NVARCHAR(64) NOT NULL,
    [fromStatus] NVARCHAR(1000),
    [toStatus] NVARCHAR(1000) NOT NULL,
    [changedByUserId] NVARCHAR(1000) NOT NULL,
    [changedByName] NVARCHAR(1000) NOT NULL,
    [note] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [order_status_history_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [order_status_history_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[quotes] (
    [id] NVARCHAR(64) NOT NULL,
    [quoteNumber] NVARCHAR(64) NOT NULL,
    [userId] NVARCHAR(64),
    [customerName] NVARCHAR(1000) NOT NULL,
    [customerEmail] NVARCHAR(1000) NOT NULL,
    [customerPhone] NVARCHAR(1000) NOT NULL,
    [preferredContactMethod] NVARCHAR(1000) NOT NULL,
    [vehicleMake] NVARCHAR(1000) NOT NULL,
    [vehicleModel] NVARCHAR(1000) NOT NULL,
    [vehicleYear] NVARCHAR(1000) NOT NULL,
    [vehicleEngine] NVARCHAR(1000) NOT NULL,
    [transmission] NVARCHAR(1000),
    [mileage] NVARCHAR(1000),
    [currentModifications] NVARCHAR(max),
    [serviceCategory] NVARCHAR(1000) NOT NULL,
    [performanceGoal] NVARCHAR(max),
    [budgetRange] NVARCHAR(1000),
    [desiredTimeline] NVARCHAR(1000),
    [message] NVARCHAR(max) NOT NULL,
    [relatedProductId] NVARCHAR(1000),
    [relatedProductSlug] NVARCHAR(1000),
    [relatedProductName] NVARCHAR(1000),
    [attachments] NVARCHAR(max) NOT NULL CONSTRAINT [quotes_attachments_df] DEFAULT '[]',
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [quotes_status_df] DEFAULT 'new',
    [priority] NVARCHAR(1000) NOT NULL CONSTRAINT [quotes_priority_df] DEFAULT 'normal',
    [adminNotes] NVARCHAR(max),
    [customerReply] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [quotes_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL CONSTRAINT [quotes_updatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [contactedAt] DATETIME2,
    [quotedAt] DATETIME2,
    [convertedToOrderId] NVARCHAR(1000),
    CONSTRAINT [quotes_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [quotes_quoteNumber_key] UNIQUE NONCLUSTERED ([quoteNumber])
);

-- CreateTable
CREATE TABLE [dbo].[reviews] (
    [id] NVARCHAR(64) NOT NULL,
    [productId] NVARCHAR(64) NOT NULL,
    [productSlug] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(64) NOT NULL,
    [userName] NVARCHAR(1000) NOT NULL,
    [userEmail] NVARCHAR(1000) NOT NULL,
    [rating] INT NOT NULL,
    [title] NVARCHAR(1000),
    [comment] NVARCHAR(max),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [reviews_status_df] DEFAULT 'pending',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [reviews_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL CONSTRAINT [reviews_updatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [reviews_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [reviews_userId_productId_key] UNIQUE NONCLUSTERED ([userId],[productId])
);

-- CreateTable
CREATE TABLE [dbo].[settings] (
    [id] INT NOT NULL CONSTRAINT [settings_id_df] DEFAULT 1,
    [shopName] NVARCHAR(1000) NOT NULL,
    [contactEmail] NVARCHAR(1000) NOT NULL,
    [contactPhone] NVARCHAR(1000) NOT NULL,
    [address] NVARCHAR(max) NOT NULL,
    [currency] NVARCHAR(1000) NOT NULL,
    [taxRate] FLOAT(53) NOT NULL,
    [bookingMessage] NVARCHAR(max) NOT NULL,
    [whatsappNumber] NVARCHAR(1000) NOT NULL,
    [googleMapsUrl] NVARCHAR(max) NOT NULL,
    [workingHours] NVARCHAR(1000) NOT NULL,
    [enableFloatingWhatsApp] BIT NOT NULL,
    [enableFloatingCall] BIT NOT NULL,
    [defaultWhatsAppMessage] NVARCHAR(max) NOT NULL,
    [quoteWhatsAppMessage] NVARCHAR(max) NOT NULL,
    [productWhatsAppMessage] NVARCHAR(max) NOT NULL,
    CONSTRAINT [settings_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [orders_userId_idx] ON [dbo].[orders]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [order_items_orderId_idx] ON [dbo].[order_items]([orderId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [order_status_history_orderId_idx] ON [dbo].[order_status_history]([orderId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [quotes_userId_idx] ON [dbo].[quotes]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [reviews_productId_idx] ON [dbo].[reviews]([productId]);

-- AddForeignKey
ALTER TABLE [dbo].[order_items] ADD CONSTRAINT [order_items_orderId_fkey] FOREIGN KEY ([orderId]) REFERENCES [dbo].[orders]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[order_status_history] ADD CONSTRAINT [order_status_history_orderId_fkey] FOREIGN KEY ([orderId]) REFERENCES [dbo].[orders]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
