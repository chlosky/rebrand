-- Lower support-reports uploads to 5 MiB per object (screenshots).
UPDATE storage.buckets
SET file_size_limit = 5242880
WHERE id = 'support-reports';
