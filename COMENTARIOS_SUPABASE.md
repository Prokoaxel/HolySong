# 📝 Configuración de Comentarios en Supabase

## Tabla `song_comments`

Para habilitar el sistema de comentarios, necesitas crear la siguiente tabla en tu base de datos de Supabase:

### SQL para crear la tabla:

```sql
-- Crear tabla de comentarios
CREATE TABLE song_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  version_id UUID REFERENCES song_versions(id) ON DELETE CASCADE,  -- NULL para versión 'base'
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  text_selection TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  position_start INTEGER NOT NULL DEFAULT 0,
  position_end INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX idx_song_comments_song_id ON song_comments(song_id);
CREATE INDEX idx_song_comments_version_id ON song_comments(version_id);
CREATE INDEX idx_song_comments_user_id ON song_comments(user_id);
CREATE INDEX idx_song_comments_created_at ON song_comments(created_at DESC);
CREATE INDEX idx_song_comments_song_version ON song_comments(song_id, version_id);  -- Para filtrado eficiente

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_song_comments_updated_at
BEFORE UPDATE ON song_comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Row Level Security (RLS):

```sql
-- Habilitar RLS
ALTER TABLE song_comments ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver comentarios de canciones
CREATE POLICY "Los comentarios son visibles para todos los usuarios autenticados"
ON song_comments
FOR SELECT
TO authenticated
USING (true);

-- Política: Solo usuarios autenticados pueden crear comentarios
CREATE POLICY "Los usuarios autenticados pueden crear comentarios"
ON song_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política: Solo el autor puede eliminar sus comentarios
CREATE POLICY "Los usuarios pueden eliminar sus propios comentarios"
ON song_comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Política: Solo el autor puede editar sus comentarios (opcional)
CREATE POLICY "Los usuarios pueden editar sus propios comentarios"
ON song_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

## Pasos para implementar:

1. **Abre el SQL Editor en Supabase**
   - Ve a tu proyecto en https://supabase.com
   - Navega a "SQL Editor" en el menú lateral

2. **Ejecuta el script de creación de tabla**
   - Copia y pega el SQL de creación de tabla
   - Haz click en "Run" para ejecutar

3. **Configura las políticas RLS**
   - Copia y pega el SQL de RLS
   - Ejecuta cada política

4. **Verifica la tabla**
   - Ve a "Table Editor"
   - Busca `song_comments`
   - Verifica que todas las columnas estén presentes

## Estructura de la tabla:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único del comentario |
| `song_id` | UUID | ID de la canción comentada (FK a `songs`) |
| `version_id` | UUID (NULL) | ID de la versión específica (FK a `song_versions`), NULL para versión principal |
| `user_id` | UUID | ID del usuario que creó el comentario (FK a `auth.users`) |
| `user_email` | TEXT | Email del usuario (para mostrar en UI) |
| `text_selection` | TEXT | Fragmento de texto seleccionado |
| `comment_text` | TEXT | El comentario en sí |
| `position_start` | INTEGER | Posición inicial de la selección |
| `position_end` | INTEGER | Posición final de la selección |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Fecha de última actualización |

## Funcionalidad implementada:

✅ **Agregar comentarios**: Modo selección activado con botón en panel izquierdo
✅ **Ver comentarios**: Ícono 📬 flotante sobre el texto comentado
✅ **Expandir**: Burbuja de diálogo debajo y a la izquierda del ícono
✅ **Eliminar**: Solo el autor puede borrar sus comentarios
✅ **Metadata**: Usuario, email, fecha y hora automáticos
✅ **Overlay visual**: El recuadro se aclara cuando activas modo comentario
✅ **Versiones independientes**: Cada versión tiene sus propios comentarios
✅ **Animaciones**: Fade-in suave y transiciones elegantes

## Flujo de uso:

1. Usuario hace click en "💬 Agregar comentario"
2. El recuadro de la letra se aclara con overlay + ring teal
3. Aparece mensaje: "✨ Seleccioná cualquier parte de la letra..."
4. Usuario selecciona texto → se abre modal
5. Escribe comentario y guarda
6. Aparece ícono 📬 flotante arriba y a la derecha del texto
7. Click en 📬 → se expande burbuja debajo con comentario completo
8. Solo el autor ve botón "Eliminar"
9. Al cambiar de versión → se muestran solo los comentarios de esa versión
