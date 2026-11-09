-- Wedding invites can carry a whole song (up to 12 MB), uploaded straight from the browser through a one-time
-- signed URL. Photos, covers and voice notes keep their own smaller limits, enforced by the API before upload.
update storage.buckets
   set file_size_limit = 12582912,
       allowed_mime_types = array['image/jpeg','image/png','image/webp','audio/webm','audio/ogg','audio/mpeg','audio/mp3','audio/mp4','audio/x-m4a','audio/m4a','audio/wav','audio/x-wav','audio/aac']
 where id = 'gift-media';
