# 🔧 Configuración de Supabase Realtime para Sesiones en Vivo

## 📋 Paso 1: Habilitar Realtime en la tabla `live_sessions`

### Opción A: Desde el Dashboard de Supabase (Recomendado)

1. **Ir a tu proyecto en Supabase**
   - Abre https://supabase.com/dashboard
   - Selecciona tu proyecto HolySong

2. **Navegar a Database > Replication**
   - En el menú lateral, ve a `Database` → `Replication`
   - O directamente: `https://supabase.com/dashboard/project/TU_PROJECT_ID/database/replication`

3. **Habilitar la tabla `live_sessions`**
   - Busca la tabla `live_sessions` en la lista
   - Activa el toggle/switch junto a la tabla
   - La columna "Source" debe mostrar: `0 tables`
   - Después de activar debe mostrar: `1 tables`

4. **Verificar**
   - Debería aparecer un check verde ✅ o el texto "Enabled"
   - La replicación puede tardar unos segundos en activarse

### Opción B: Desde SQL Editor

Si prefieres usar SQL, puedes ejecutar estos comandos:

```sql
-- Habilitar Realtime para la tabla live_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE live_sessions;

-- Verificar que se habilitó correctamente
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

## 🔐 Paso 2: Configurar Row Level Security (RLS)

Para que los oyentes puedan escuchar cambios, necesitas políticas RLS adecuadas:

```sql
-- Permitir a todos leer las sesiones en vivo
CREATE POLICY "Cualquiera puede leer sesiones activas"
ON live_sessions
FOR SELECT
USING (true);

-- Solo el dueño puede actualizar su sesión
CREATE POLICY "Solo el dueño puede actualizar su sesión"
ON live_sessions
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Solo usuarios autenticados pueden crear sesiones
CREATE POLICY "Usuarios autenticados pueden crear sesiones"
ON live_sessions
FOR INSERT
WITH CHECK (auth.uid() = owner_id);
```

## 🔍 Paso 3: Verificar la configuración

### En el Dashboard:
1. Ve a `Database` → `Tables` → `live_sessions`
2. En la pestaña "Policies", verifica que las políticas existan
3. En "Realtime", debe aparecer como habilitada

### En tu aplicación:
1. Abre la consola del navegador (F12)
2. Como oyente, deberías ver:
   ```
   🔗 Creando suscripción para sesión: [id]
   🔌 Estado de suscripción: SUBSCRIBED
   ✅ Suscripción exitosa - escuchando cambios en tiempo real
   ```
3. Cuando el admin haga cambios:
   ```
   📡 Actualización en tiempo real recibida: [datos]
   ```

## ⚡ Paso 4: Optimizaciones opcionales

### Índices para mejor rendimiento:
```sql
-- Índice en el campo code para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_live_sessions_code 
ON live_sessions(code);

-- Índice en owner_id
CREATE INDEX IF NOT EXISTS idx_live_sessions_owner 
ON live_sessions(owner_id);
```

### Limpiar sesiones antiguas automáticamente:
```sql
-- Función para limpiar sesiones inactivas después de 24 horas
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM live_sessions 
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Opcional: Crear una extensión para ejecutar esto periódicamente
-- (requiere pg_cron o configurar un cron job externo)
```

## 🐛 Solución de problemas

### El oyente no recibe actualizaciones:

1. **Verificar que Realtime esté habilitado**
   ```sql
   SELECT * FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime' 
   AND schemaname = 'public' 
   AND tablename = 'live_sessions';
   ```
   Debe retornar una fila.

2. **Verificar políticas RLS**
   - Asegúrate de que la política SELECT permita leer sin autenticación o con el usuario actual
   - Las políticas demasiado restrictivas bloquean Realtime

3. **Verificar en consola**
   - ¿Aparece "SUBSCRIBED" en los logs?
   - ¿Hay errores de WebSocket?

4. **Fallback con Polling**
   - Si Realtime no funciona, el sistema usa polling cada 2 segundos como respaldo
   - Verás en consola: `🔄 Polling detectó cambios`

### El estado de suscripción es "CHANNEL_ERROR":

1. Verifica que tu proyecto de Supabase tenga Realtime habilitado (plan gratuito lo incluye)
2. Revisa las políticas RLS - deben permitir SELECT
3. Intenta refrescar las claves API en Supabase Dashboard

### Límites del plan gratuito:

- **Concurrent connections**: 200 conexiones simultáneas
- **Messages per second**: 500 mensajes/segundo
- Si llegas al límite, considera:
  - Aumentar el intervalo de polling
  - Implementar debouncing en los cambios
  - Upgrade a plan Pro

## ✅ Checklist final

- [ ] Tabla `live_sessions` existe en la base de datos
- [ ] Realtime habilitado para `live_sessions` (Database > Replication)
- [ ] Políticas RLS configuradas (especialmente SELECT para todos)
- [ ] En consola aparece "SUBSCRIBED" al unirse como oyente
- [ ] Al hacer cambios como admin, el oyente los ve en tiempo real
- [ ] El botón de copiar código funciona (muestra ✅ al hacer clic)

## 📚 Referencias

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Realtime RLS Policies](https://supabase.com/docs/guides/realtime/postgres-changes#row-level-security)
- [Troubleshooting Realtime](https://supabase.com/docs/guides/realtime/troubleshooting)

---

**Notas adicionales:**

- El sistema tiene **polling de respaldo** que funciona automáticamente si Realtime no está disponible
- Los logs en consola te ayudarán a diagnosticar cualquier problema
- El código se copia al portapapeles al hacer clic en el badge teal
