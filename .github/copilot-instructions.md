# RaiderView - Instrucciones de Desarrollo

## Descripción General
RaiderView es una aplicación de escritorio construida con **Electron + React + Vite + Tailwind CSS** para gestionar raids de World of Warcraft. Utiliza SQLite nativo (`node:sqlite`) para almacenamiento local de datos con soporte para seguimiento de horas de inicio y finalización de raids.

## Estructura del Proyecto

### Procesos Principales
- **Main Process**: `src/main/index.js` - Controla la ventana y maneja IPC
- **Database Module**: `src/main/database.js` - Operaciones SQLite
- **Renderer Process**: `src/renderer/` - Aplicación React

### Configuración
- **Vite**: `vite.config.js` - Compilación y dev server
- **Tailwind**: `tailwind.config.js` - Estilos CSS
- **Electron**: `package.json` - Scripts y dependencias

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor Vite en puerto 5173 |
| `npm run electron-dev` | Inicia Vite + Electron simultáneamente |
| `npm run electron-build` | Compila para distribución |
| `npm run build` | Compila solo con Vite |
| `npm run preview` | Previsualiza la compilación |

## Requisitos Técnicos

- **Node.js**: v22+ (requerido para `node:sqlite`)
- **npm**: v10+
- **Sistema Operativo**: Windows, macOS, Linux

## Desarrollo

### Iniciar en Modo Desarrollo
```bash
npm install
npm run electron-dev
```

Esto abrirá automáticamente la aplicación con:
- DevTools de Electron
- Hot Module Replacement (HMR) en Vite
- Recarga automática de cambios

### Agregar Nuevos Componentes React

1. Crea el archivo en `src/renderer/components/`
2. Exporta como función React
3. Importa y usa en el componente padre

### Modificar la Base de Datos

1. Edita el esquema en `src/main/database.js` función `initDatabase()`
2. Agrega funciones CRUD según sea necesario
3. Expón funciones en IPC handlers en `src/main/index.js`
4. Agrega llamadas en `src/preload/preload.js`

### Comunicación IPC

Pattern de uso:
```javascript
// En React (renderer)
const result = await window.apiDB.miMetodo(params);

// En main/index.js
ipcMain.handle('db:miMetodo', (event, params) => {
    return dbmanager.miMetodo(params);
});

// En preload/preload.js
contextBridge.exposeInMainWorld('apiDB', {
    miMetodo: (params) => ipcRenderer.invoke('db:miMetodo', params),
});
```

## Compilación y Distribución

```bash
npm run electron-build
```

Genera ejecutables en `release/`:
- `.exe` (instalador NSIS)
- `.exe` (portable)

## Colores y Tema

El tema oscuro usa la paleta de WoW WotLK:
- **Backgrounds**: `#1a1b26`, `#24283b`, `#1f2335`
- **Borders**: `#414868`
- **Text primary**: `#a9b1d6`
- **Accents**: `#41a6b5` (cyan), `#bb9af7` (purple), `#9ece6a` (green)
- **Class colors**: Definidos en `classColors` (componentes)

## Convenciones de Código

- **Archivos**: camelCase (main.jsx, database.js)
- **Componentes React**: PascalCase (MatrizTab.jsx)
- **Variables**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Clases CSS**: Tailwind + custom en index.css

## Solución de Problemas

### "node:sqlite not available"
```bash
node --version  # Debe ser v22+
npm install     # Reinstala dependencias
```

### Puerto 5173 en uso
```bash
# Cambiar puerto en vite.config.js
server: {
    port: 5174,
    ...
}
```

### Errores de IPC
- Verifica que `window.apiDB` esté disponible
- Revisa DevTools → Console de Electron
- Confirma que handlers están registrados en `src/main/index.js`

## Notas Importantes

- La BD se crea en `%APPDATA%/RaiderView/azeroth_data_local.db` (Windows)
- SQLite nativo es síncrono; se usa `setTimeout(..., 0)` para evitar bloqueos
- El preload está configurado con `contextIsolation: true` por seguridad
- Tailwind se carga via CDN en desarrollo; en producción se compila

## Recursos Útiles

- [Documentación Electron](https://www.electronjs.org/docs)
- [Documentación Vite](https://vitejs.dev/)
- [Documentación React](https://react.dev)
- [Documentación Tailwind](https://tailwindcss.com)
- [Documentación SQLite Nativo](https://nodejs.org/api/sqlite.html)

---

**Última actualización**: 2026-05-18
