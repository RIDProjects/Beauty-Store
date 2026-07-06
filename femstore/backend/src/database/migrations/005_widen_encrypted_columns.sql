-- Widen columns that store AES-encrypted values at rest.
-- Ciphertext (CryptoJS AES, base64) is 44+ chars — VARCHAR(20) truncates and
-- INSERT fails with "value too long for type character varying(20)".

ALTER TABLE public.orders ALTER COLUMN customer_phone TYPE TEXT;
ALTER TABLE public.orders ALTER COLUMN customer_email TYPE TEXT;
ALTER TABLE public.users  ALTER COLUMN phone          TYPE TEXT;
ALTER TABLE public.users  ALTER COLUMN email          TYPE TEXT;
