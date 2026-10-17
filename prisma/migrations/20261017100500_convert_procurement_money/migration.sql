ALTER TABLE "Procurement"
    ALTER COLUMN "unitPrice" TYPE DECIMAL(12,2) USING ROUND("unitPrice"::numeric, 2),
    ALTER COLUMN "totalPrice" TYPE DECIMAL(12,2) USING ROUND("totalPrice"::numeric, 2);
