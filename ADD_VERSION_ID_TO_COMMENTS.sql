-- Agregar columna version_id a la tabla song_comments
ALTER TABLE song_comments ADD COLUMN IF NOT EXISTS version_id UUID REFERENCES song_versions(id) ON DELETE CASCADE;

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_song_comments_version_id ON song_comments(version_id);
CREATE INDEX IF NOT EXISTS idx_song_comments_song_version ON song_comments(song_id, version_id);

-- Comentario explicativo
COMMENT ON COLUMN song_comments.version_id IS 'ID de la versión específica de la canción. NULL indica que el comentario es para la versión base/principal.';
