-- Compartir carpeta por link (sin email)

ALTER TABLE folders
ADD COLUMN IF NOT EXISTS is_link_shared BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_folders_is_link_shared
ON folders(is_link_shared)
WHERE is_link_shared = TRUE;

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_songs ENABLE ROW LEVEL SECURITY;

-- Permite abrir carpeta si está compartida por link
DROP POLICY IF EXISTS folders_select_link_shared ON folders;
CREATE POLICY folders_select_link_shared
ON folders
FOR SELECT
USING (is_link_shared = TRUE);

-- Permite leer canciones de carpetas compartidas por link
DROP POLICY IF EXISTS folder_songs_select_link_shared ON folder_songs;
CREATE POLICY folder_songs_select_link_shared
ON folder_songs
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM folders f
    WHERE f.id = folder_songs.folder_id
      AND f.is_link_shared = TRUE
  )
);
