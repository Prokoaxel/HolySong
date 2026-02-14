-- 1) Orden manual dentro de carpeta
ALTER TABLE folder_songs
ADD COLUMN IF NOT EXISTS order_index INTEGER;

-- Backfill inicial: orden estable por song_id dentro de cada carpeta
WITH ranked AS (
  SELECT
    folder_id,
    song_id,
    ROW_NUMBER() OVER (PARTITION BY folder_id ORDER BY song_id) - 1 AS rn
  FROM folder_songs
)
UPDATE folder_songs fs
SET order_index = ranked.rn
FROM ranked
WHERE fs.folder_id = ranked.folder_id
  AND fs.song_id = ranked.song_id
  AND fs.order_index IS NULL;

ALTER TABLE folder_songs
ALTER COLUMN order_index SET DEFAULT 0;

-- Trigger para asignar order_index al insertar si no se envía
CREATE OR REPLACE FUNCTION set_folder_song_order_index()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_index IS NULL THEN
    SELECT COALESCE(MAX(order_index), -1) + 1
    INTO NEW.order_index
    FROM folder_songs
    WHERE folder_id = NEW.folder_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_folder_song_order_index ON folder_songs;
CREATE TRIGGER trg_set_folder_song_order_index
BEFORE INSERT ON folder_songs
FOR EACH ROW
EXECUTE FUNCTION set_folder_song_order_index();

CREATE INDEX IF NOT EXISTS idx_folder_songs_folder_order
ON folder_songs(folder_id, order_index);

-- 2) Compartir carpeta por mail
CREATE TABLE IF NOT EXISTS folder_shares (
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (folder_id, shared_with_email)
);

CREATE INDEX IF NOT EXISTS idx_folder_shares_email
ON folder_shares(shared_with_email);

-- Normalización: guardar siempre en minúscula
CREATE OR REPLACE FUNCTION normalize_folder_share_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.shared_with_email := LOWER(TRIM(NEW.shared_with_email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_folder_share_email ON folder_shares;
CREATE TRIGGER trg_normalize_folder_share_email
BEFORE INSERT OR UPDATE ON folder_shares
FOR EACH ROW
EXECUTE FUNCTION normalize_folder_share_email();

-- 3) RLS
ALTER TABLE folder_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_songs ENABLE ROW LEVEL SECURITY;

-- folders: lectura para owner y usuarios compartidos
DROP POLICY IF EXISTS folders_select_owner_or_shared ON folders;
CREATE POLICY folders_select_owner_or_shared
ON folders
FOR SELECT
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM folder_shares fs
    WHERE fs.folder_id = folders.id
      AND fs.shared_with_email = LOWER(auth.email())
  )
);

-- folders: solo owner puede crear/editar/borrar
DROP POLICY IF EXISTS folders_insert_owner ON folders;
CREATE POLICY folders_insert_owner
ON folders
FOR INSERT
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS folders_update_owner ON folders;
CREATE POLICY folders_update_owner
ON folders
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS folders_delete_owner ON folders;
CREATE POLICY folders_delete_owner
ON folders
FOR DELETE
USING (owner_id = auth.uid());

-- folder_shares: owner administra; owner o usuario compartido puede leer su fila
DROP POLICY IF EXISTS folder_shares_select_owner_or_self ON folder_shares;
CREATE POLICY folder_shares_select_owner_or_self
ON folder_shares
FOR SELECT
USING (
  shared_with_email = LOWER(auth.email())
  OR EXISTS (
    SELECT 1
    FROM folders f
    WHERE f.id = folder_shares.folder_id
      AND f.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS folder_shares_insert_owner ON folder_shares;
CREATE POLICY folder_shares_insert_owner
ON folder_shares
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM folders f
    WHERE f.id = folder_shares.folder_id
      AND f.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS folder_shares_update_owner ON folder_shares;
CREATE POLICY folder_shares_update_owner
ON folder_shares
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM folders f
    WHERE f.id = folder_shares.folder_id
      AND f.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM folders f
    WHERE f.id = folder_shares.folder_id
      AND f.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS folder_shares_delete_owner ON folder_shares;
CREATE POLICY folder_shares_delete_owner
ON folder_shares
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM folders f
    WHERE f.id = folder_shares.folder_id
      AND f.owner_id = auth.uid()
  )
);

-- folder_songs: owner o compartido puede leer
DROP POLICY IF EXISTS folder_songs_select_owner_or_shared ON folder_songs;
CREATE POLICY folder_songs_select_owner_or_shared
ON folder_songs
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM folders f
    WHERE f.id = folder_songs.folder_id
      AND (
        f.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM folder_shares fs
          WHERE fs.folder_id = f.id
            AND fs.shared_with_email = LOWER(auth.email())
        )
      )
  )
);

-- folder_songs: owner o editor puede modificar
DROP POLICY IF EXISTS folder_songs_insert_owner_or_editor ON folder_songs;
CREATE POLICY folder_songs_insert_owner_or_editor
ON folder_songs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM folders f
    WHERE f.id = folder_songs.folder_id
      AND (
        f.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM folder_shares fs
          WHERE fs.folder_id = f.id
            AND fs.shared_with_email = LOWER(auth.email())
            AND fs.role = 'editor'
        )
      )
  )
);

DROP POLICY IF EXISTS folder_songs_update_owner_or_editor ON folder_songs;
CREATE POLICY folder_songs_update_owner_or_editor
ON folder_songs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM folders f
    WHERE f.id = folder_songs.folder_id
      AND (
        f.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM folder_shares fs
          WHERE fs.folder_id = f.id
            AND fs.shared_with_email = LOWER(auth.email())
            AND fs.role = 'editor'
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM folders f
    WHERE f.id = folder_songs.folder_id
      AND (
        f.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM folder_shares fs
          WHERE fs.folder_id = f.id
            AND fs.shared_with_email = LOWER(auth.email())
            AND fs.role = 'editor'
        )
      )
  )
);

DROP POLICY IF EXISTS folder_songs_delete_owner_or_editor ON folder_songs;
CREATE POLICY folder_songs_delete_owner_or_editor
ON folder_songs
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM folders f
    WHERE f.id = folder_songs.folder_id
      AND (
        f.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM folder_shares fs
          WHERE fs.folder_id = f.id
            AND fs.shared_with_email = LOWER(auth.email())
            AND fs.role = 'editor'
        )
      )
  )
);
