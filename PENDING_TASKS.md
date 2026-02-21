# Pendientes De La App

## Mobile Build/Release
- Configurar iconos y splash nativos (Android/iOS) para release.
- Configurar firma Android (keystore) y generar AAB de producción.
- Configurar firma iOS (certificados/perfiles) y TestFlight/App Store Connect.
- Revisar permisos/plist/manifest para publicación.

## Offline & Sync
- Persistir preferencias por usuario en Supabase (además de localStorage) para sincronizar entre dispositivos.
- Cachear detalle de canción + versiones + comentarios con estrategia de expiración.
- Mostrar indicador visual de modo offline y fecha de última sincronización.
- Implementar cola de cambios offline para operaciones de escritura críticas.

## Performance
- Separar bundles pesados con code splitting (chunk principal supera 500 kB).
- Evaluar lazy loading en vistas de SongViewer/LiveSession.
- Revisar peso de OCR y dependencias en cliente.

## QA
- Armar checklist E2E para Library/Folders/Song (online y offline).
- Probar flujo completo en Android real y iPhone real.
- Verificar navegación y layouts en breakpoints extremos.
