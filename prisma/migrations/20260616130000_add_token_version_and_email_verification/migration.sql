BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[users] ADD [tokenVersion] INT NOT NULL CONSTRAINT [users_tokenVersion_df] DEFAULT 0,
[emailVerifiedAt] DATETIME2;

-- CreateTable
CREATE TABLE [dbo].[email_verification_tokens] (
    [id] NVARCHAR(64) NOT NULL,
    [userId] NVARCHAR(64) NOT NULL,
    [tokenHash] NVARCHAR(191) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [usedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [email_verification_tokens_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [email_verification_tokens_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [email_verification_tokens_tokenHash_key] UNIQUE NONCLUSTERED ([tokenHash])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [email_verification_tokens_userId_idx] ON [dbo].[email_verification_tokens]([userId]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
