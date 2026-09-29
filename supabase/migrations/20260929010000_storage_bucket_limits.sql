begin;

-- ============================================================
-- P2: STORAGE BUCKET LIMITS + MIME TYPES
-- ============================================================

-- Club documents: 10 MB
update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/csv',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
where id = 'club-documents';


-- Club photos: 10 MB, images only
update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
where id = 'club-photos';


-- Club chat: 10 MB, images + documents
update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
where id = 'club-chat';


-- Avatars: 2 MB, images only
update storage.buckets
set
  file_size_limit = 2097152,
  allowed_mime_types = array[
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
where id = 'avatars';

commit;