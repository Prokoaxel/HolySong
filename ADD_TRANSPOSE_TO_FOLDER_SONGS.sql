-- Agregar columna de transposición personalizada a folder_songs
ALTER TABLE folder_songs 
ADD COLUMN custom_transpose INTEGER DEFAULT 0;

-- Agregar comentario para documentar
COMMENT ON COLUMN folder_songs.custom_transpose IS 'Transposición personalizada para esta canción en esta carpeta (semitonos)';
