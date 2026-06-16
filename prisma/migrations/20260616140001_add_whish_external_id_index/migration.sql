BEGIN TRY

BEGIN TRAN;

-- CreateIndex
-- Filtered unique index: SQL Server treats NULLs as equal in a plain UNIQUE
-- index (allowing only one NULL row), so exclude NULLs to permit many orders
-- without a Whish id while keeping real external ids unique.
CREATE UNIQUE NONCLUSTERED INDEX [orders_whishExternalId_key] ON [dbo].[orders]([whishExternalId]) WHERE [whishExternalId] IS NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
