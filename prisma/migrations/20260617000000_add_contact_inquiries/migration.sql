BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[contact_inquiries] (
    [id] NVARCHAR(64) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(320) NOT NULL,
    [phone] NVARCHAR(50),
    [vehicle] NVARCHAR(500),
    [service] NVARCHAR(200),
    [message] NVARCHAR(MAX),
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [contact_inquiries_status_df] DEFAULT 'new',
    [adminNotes] NVARCHAR(MAX),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [contact_inquiries_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL CONSTRAINT [contact_inquiries_updatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [contact_inquiries_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [contact_inquiries_status_idx] ON [dbo].[contact_inquiries]([status]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
