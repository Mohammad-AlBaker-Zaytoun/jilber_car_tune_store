BEGIN TRY

BEGIN TRAN;

-- AlterTable
-- NOTE: the unique index on [whishExternalId] lives in the next migration —
-- SQL Server binds a whole batch before executing, so a CREATE INDEX in the
-- same batch as the ADD column fails with "Invalid column name".
ALTER TABLE [dbo].[orders] ADD [whishExternalId] BIGINT,
[whishTransactionId] NVARCHAR(1000);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
