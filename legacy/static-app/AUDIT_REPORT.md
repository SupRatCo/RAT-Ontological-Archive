# RAT Ontological Archive - Audit Report

Fecha de auditoria: 2026-05-14

## Alcance Revisado

- Frontend estatico en la raiz del repositorio.
- Backend Node/Express en `server/`.
- Base de datos SQLite local en `server/data/database.sqlite`.
- Autenticacion JWT.
- Usuarios, perfil, proyectos, archivos/Docs, secciones, etiquetas, galeria, foro, comentarios, likes, permisos y configuracion.
- Conexion GitHub Pages -> backend externo mediante `js/config.js` y `js/api.js`.

## Estado General

La app funciona localmente con servidor Express + SQLite en:

```txt
http://localhost:3000
```

El endpoint de salud responde:

```json
{"ok":true,"mode":"express-sqlite","name":"RAT Ontological Archive"}
```

El frontend carga en navegador sin errores criticos de consola en la pantalla inicial.

## Errores Encontrados y Corregidos

### Seguridad / permisos

- `GET /api/files/:fileId` permitia leer un archivo si se conocia el ID, sin comprobar rol del proyecto.
  - Corregido: ahora exige rol en el proyecto y bloquea archivos `private` para lectores.
- `GET /api/files/project/:projectId` devolvia archivos privados a lectores.
  - Corregido: ahora filtra archivos `private` para `reader`.
- `GET /api/sections/project/:projectId` devolvia secciones privadas a lectores.
  - Corregido: ahora filtra secciones `private` para `reader`.
- `GET /api/forum/posts/:postId`, comentarios, likes y guardados de posts no comprobaban bien la visibilidad si se conocia el ID.
  - Corregido: posts privados solo son visibles para autor o usuarios con acceso al proyecto vinculado.
- CORS no incluia `PUT`, aunque el foro ya tenia endpoint `PUT /api/forum/posts/:id`.
  - Corregido.

### Validaciones

- Registro de usuario de servidor aceptaba passwords vacias.
  - Corregido: username minimo 3 caracteres, password minimo 4.
- Subida de avatar o multimedia sin archivo podia terminar en error interno.
  - Corregido: ahora devuelve error 400 claro.
- Directorios de uploads dependian de existir previamente.
  - Corregido: se crean automaticamente.

### Errores API

- Las respuestas de error no eran consistentes.
  - Corregido parcialmente: el servidor ahora convierte errores `{ error }` en `{ ok:false, error }` para respuestas HTTP 4xx/5xx sin romper las respuestas exitosas existentes del frontend.
- El middleware global de errores ahora informa `ok:false`, mensaje claro y detalle tecnico fuera de produccion.
- Errores de archivo demasiado grande devuelven mensaje claro.

### Dependencias

- `bcrypt` esta en `^6.0.0`.
- `sqlite3` esta fijado en `5.1.7` para compatibilidad con Render/Node 20 en modo local SQLite.
- Se agrego `pg` para PostgreSQL de produccion.
- No usar `npm audit fix --force` a ciegas porque puede volver a cambiar dependencias nativas de SQLite y romper Render. La solucion de produccion recomendada es `DATABASE_URL` + PostgreSQL.

### Despliegue

- Habia dos workflows de GitHub Pages duplicados.
  - Corregido: eliminado `.github/workflows/RAT.yml`, queda `static.yml`.

## Funciones Verificadas

Pruebas realizadas contra servidor Express + SQLite:

- Salud del servidor.
- Registro de usuario.
- Login.
- `GET /auth/me`.
- Edicion de perfil por settings: bio/banner guardados.
- Creacion de proyecto.
- Creacion de seccion publica y privada.
- Creacion de documento.
- Guardado de documento.
- Recarga de documento y persistencia del contenido.
- Persistencia de campos dinamicos en archivo.
- Bloqueo de archivo privado para lector.
- Ocultamiento de archivo privado en listado para lector.
- Ocultamiento de seccion privada en listado para lector.
- Creacion de post publico de foro.
- Usuario B ve post de Usuario A.
- Usuario B comenta.
- Usuario A ve comentario.
- Usuario A responde comentario.
- Respuestas persisten.
- Like de Usuario B se suma.
- Segundo click quita like.
- Tercer click vuelve a sumar.
- Usuario A ve contador actualizado.
- Post privado bloqueado para otro usuario.
- Subida de avatar con `multipart/form-data`.
- Subida de imagen a galeria con `multipart/form-data`.
- Listado de media subida.
- CORS preflight desde `https://supratco.github.io` con `PUT`.
- Carga inicial en navegador sin errores de consola criticos.

## Base de Datos

Base local/desarrollo: SQLite.

Base produccion recomendada: PostgreSQL. El backend usa PostgreSQL automaticamente si `DATABASE_URL` esta configurada; si no, usa SQLite local.

Tablas presentes:

- `users`
- `projects`
- `project_members`
- `sections`
- `files`
- `file_fields`
- `tags`
- `file_tags`
- `media`
- `media_tags`
- `notifications`
- `access_requests`
- `forum_posts`
- `forum_comments`
- `forum_votes`
- `settings`

Indices agregados/verificados:

- posts por fecha, visibilidad y autor,
- comentarios por post,
- votos por target y usuario,
- proyectos por owner,
- miembros por proyecto/usuario,
- secciones, archivos, tags y media por proyecto,
- notificaciones por usuario,
- solicitudes por proyecto/usuario.

## Limitaciones Reales

### PostgreSQL en produccion

Se agrego adaptador PostgreSQL con `pg`.

Variables necesarias:

```txt
DATABASE_URL=postgresql://...
NODE_ENV=production
JWT_SECRET=secreto-estable
```

El schema PostgreSQL se crea al iniciar el backend y tambien queda documentado en:

```txt
server/db/schema.sql
```

No se pudo probar contra una instancia real de Supabase/PostgreSQL desde este entorno porque no se proporciono `DATABASE_URL`. Se verifico que el modo SQLite local sigue arrancando y que la capa de base mantiene el contrato `run/get/all`.

### SQLite en produccion

SQLite funciona para desarrollo, demo y hosting persistente con disco estable. No es ideal para produccion multiusuario grande.

Para produccion real en Render/Railway/Fly:

- usar disco persistente si mantienes SQLite,
- o configurar `DATABASE_URL` y usar PostgreSQL/Supabase/Neon.

### Uploads en hosting

En modo local, los archivos se guardan en:

```txt
server/uploads/
```

En servicios con filesystem efimero, los uploads pueden perderse al reiniciar/deployar.

Se agrego modulo de storage externo:

```txt
server/storage.js
```

Si estan configuradas estas variables, el backend usa Supabase Storage:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET
STORAGE_PROVIDER=supabase
```

Si faltan, el sistema cae a `server/uploads/` para desarrollo local.

Opciones recomendadas:

- Supabase Storage,
- Cloudinary,
- S3/R2,
- o volumen persistente del proveedor.

### Banner de perfil

El avatar y el banner ahora se suben como archivos mediante el backend. En produccion deben ir a Supabase Storage; en local caen a `server/uploads/avatars`.

### Respuesta estandar

Errores ya devuelven `ok:false`. Las respuestas exitosas conservan la forma anterior (`{ user }`, `{ project }`, `{ posts }`, etc.) para no romper el frontend. Si se quiere el formato estricto `{ ok:true, data:{} }`, hay que migrar frontend y backend juntos.

### Fallback JSON

El servidor fallback existe solo para desarrollo si no estan instaladas las dependencias. No debe usarse en produccion.

## Configuracion Necesaria de Hosting

Frontend GitHub Pages:

```txt
https://supratco.github.io/RAT-Ontological-Archive/
```

Backend externo:

- Render/Railway/Fly/VPS con Node.js.
- Ejecutar desde `server/`.
- Variables recomendadas:

```txt
JWT_SECRET=un-secreto-largo-y-real
CORS_ORIGINS=https://supratco.github.io,http://localhost:3000
DATABASE_URL=postgresql://...
NODE_ENV=production
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=roa-media
STORAGE_PROVIDER=supabase
```

`DATABASE_PATH=./data/database.sqlite` queda solo como opcion local/desarrollo si no se configura `DATABASE_URL`.

Frontend:

Editar `js/config.js`:

```js
(function () {
  const isLocalHost = ["localhost", "127.0.0.1", ""].includes(window.location.hostname) || window.location.protocol === "file:";
  const onlineBackend = "https://tu-backend.onrender.com";
  window.ROA_CONFIG = Object.assign({
    LOCAL_API_URL: "http://localhost:3000",
    PRODUCTION_API_URL: onlineBackend,
    API_URL: isLocalHost ? "http://localhost:3000" : onlineBackend
  }, window.ROA_CONFIG || {});
})();
```

Nota: para `https://supratco.github.io/RAT-Ontological-Archive/`, el origin CORS correcto es `https://supratco.github.io`; no se incluye la ruta `/RAT-Ontological-Archive/`.

En GitHub Pages, si `API_URL` queda vacio o el backend no responde, la app muestra una pantalla/alerta de servidor desconectado y bloquea el login local falso para evitar datos aislados por navegador.

## Recomendaciones Pendientes

- Migrar a PostgreSQL si se espera uso real multiusuario permanente.
- Migrar uploads a storage externo.
- Implementar endpoint dedicado para subir banner.
- Implementar refresh/revocacion de tokens si se requiere seguridad avanzada.
- Completar formato estricto `{ ok:true, data:{} }` en una migracion coordinada.
- Revisar UI completa con usuarios reales despues de desplegar backend online, porque CORS y latencia real dependen del hosting.
- Agregar tests automatizados formales en `server/tests/` para no depender solo de scripts manuales.
- Verificar despliegue online real cuando exista una URL publica del backend. No se puede afirmar que GitHub Pages funciona contra produccion sin probar una URL real y sus variables de hosting.

## Comandos Usados Para Verificacion

```bash
cd server
npm install
npm audit --omit=dev
npm start
```

Pruebas API ejecutadas con scripts Node contra:

```txt
http://localhost:3000/api
```

Resultado final local:

- Servidor funcional.
- Audit de npm sin vulnerabilidades.
- Persistencia verificada.
- Foro multiusuario verificado.
- Permisos privados corregidos y verificados.
