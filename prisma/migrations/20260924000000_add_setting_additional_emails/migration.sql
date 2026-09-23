/*
  Adds settings.additionalEmails.

  The shop publishes several addresses (an owner address, sales, and a general
  contact) and the contact section could only show one. `contactEmail` keeps its
  meaning — the address the site itself writes to, and the one in the
  organisation JSON-LD — and this column holds the extras that are displayed
  beside it.

  JSON-encoded NVARCHAR(MAX) rather than a child table: it is a handful of
  strings on a singleton row, read together and written together, and
  lib/settings.ts already owns the encoding. Same convention as the array
  columns on `products`.

  NOT NULL with a DEFAULT of '[]', so the existing singleton row is filled in
  place and lib/settings.ts never has to distinguish NULL from "none". Guarded
  with IF NOT EXISTS so the migration is safe to re-run.
*/

IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID(N'[dbo].[settings]')
    AND name = N'additionalEmails'
)
BEGIN
  ALTER TABLE [dbo].[settings]
    ADD [additionalEmails] NVARCHAR(MAX) NOT NULL
      CONSTRAINT [settings_additionalEmails_df] DEFAULT N'[]';
END;
