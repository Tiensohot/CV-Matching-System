docker exec -it cv_matching_db psql -U postgres -d cv_matching

## 2. Xem nhanh số lượng từng bảng
SELECT 
  (SELECT COUNT(*) FROM job_descriptions) AS jd_count,
  (SELECT COUNT(*) FROM cvs)              AS cv_count,
  (SELECT COUNT(*) FROM applications)     AS app_count,
  (SELECT COUNT(*) FROM employers)        AS employer_count;

## 3. Xem JD (có embedding chưa)
  SELECT id, title, 
       CASE WHEN embedding IS NULL THEN 'NULL' ELSE 'OK' END AS emb_status,
       created_at
FROM job_descriptions
ORDER BY created_at DESC
LIMIT 17;
## 4. Xem CV đã upload
SELECT id, filename, 
       LENGTH(raw_text) AS text_len,
       CASE WHEN embedding IS NULL THEN 'NULL' ELSE 'OK' END AS emb_status,
       uploaded_at
FROM cvs
ORDER BY uploaded_at DESC;
## 5. Xem applications theo trạng thái
SELECT status, COUNT(*) 
FROM applications 
GROUP BY status;