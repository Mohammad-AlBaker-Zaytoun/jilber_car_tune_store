BEGIN TRY

BEGIN TRAN;

-- CreateIndex
CREATE NONCLUSTERED INDEX [orders_status_idx] ON [dbo].[orders]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [quotes_status_idx] ON [dbo].[quotes]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [reviews_status_idx] ON [dbo].[reviews]([status]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
