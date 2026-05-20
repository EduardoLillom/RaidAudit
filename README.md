# RaiderView - Azeroth Core Engine v4.0

Una aplicación de escritorio construida con **Electron + React + Vite + Tailwind CSS** para gestionar raids de World of Warcraft. Utiliza SQLite nativo (`node:sqlite`) para almacenamiento local de datos.

## 🎮 Características

- **Analizador de Raids**: Importa rosters de raids en formato JSON
- **Control de Tiempo**: Registra hora de inicio y finalización de cada raid
- **Matriz Relacional 5x5**: Visualiza a todos los participantes en una cuadrícula interactiva
- **Sistema de Auditoría**: Rastrea infracciones (LOW, MEDIUM, HIGH severity)
- **Expedientes de Jugadores**: Perfil detallado de jugadores con histórico de asistencia
- **Archivo de Guilds**: Gestión de hermandades, historial de sesiones y duración de raids
- **Colores de Clases WoW**: Tema oscuro con paleta de colores de clases WotLK

## 📋 Requisitos Previos

- **Node.js v22+** (requerido para `node:sqlite`)
- npm o yarn

## 🚀 Instalación

```bash
# Clonar o descargar el repositorio
cd RaiderView

# Instalar dependencias
npm install

# Crear archivo .env si no existe
cp .env.example .env
```

## 🛠️ Desarrollo

```bash
# Ejecutar la aplicación en modo desarrollo
# Esto lanza Vite dev server + Electron simultáneamente
npm run electron-dev
```

La aplicación abrirá automáticamente en `http://127.0.0.1:5173` y te permitirá trabajar con Hot Module Replacement (HMR) para cambios en tiempo real.

## 📦 Compilación

```bash
# Compilar la aplicación para distribución
npm run electron-build

# El ejecutable estará en la carpeta 'release/'
```

## 📁 Estructura del Proyecto

```
RaiderView/
├── src/
│   ├── main/
│   │   ├── index.js          # Proceso principal de Electron
│   │   └── database.js       # Módulo SQLite
│   ├── preload/
│   │   └── preload.js        # IPC Bridge (aislamiento de contexto)
│   └── renderer/
│       ├── main.jsx          # Punto de entrada React
│       ├── App.jsx           # Componente raíz
│       ├── index.css         # Estilos Tailwind
│       └── components/
│           ├── Header.jsx
│           ├── MatrizTab.jsx
│           ├── RaiderGrid.jsx
│           ├── RaiderCard.jsx
│           ├── JugadoresTab.jsx
│           └── GuildsTab.jsx
├── public/                   # Recursos estáticos
├── index.html               # HTML principal
├── vite.config.js          # Configuración de Vite
├── tailwind.config.js      # Configuración de Tailwind
└── package.json
```

## 🗄️ Base de Datos

La aplicación utiliza **SQLite nativo** (`node:sqlite` de Node.js v22+) para almacenar:

- **Guilds**: Hermandades/facciones
- **Players**: Jugadores maestros (cuentas)
- **Raiders**: Personajes individuales con clase
- **Sessions**: Sesiones/raids registradas con horas de inicio/fin y duración
- **Session_Raiders**: Asignaciones de personajes a sesiones
- **Raider_Notes**: Notas/faltas de jugadores con severidad

La base de datos se crea automáticamente en `%APPDATA%/RaiderView/azeroth_data_local.db`

### Campos de Tiempo

Cada sesión de raid registra:
- `start_time`: Hora de inicio (formato HH:MM)
- `end_time`: Hora de finalización (formato HH:MM)
- La duración se calcula automáticamente en la interfaz

## 🎨 Tema y Personalización

El tema oscuro está completamente personalizado con la paleta de WoW:

- **Colores de fondo**: Tonos grises oscuros (`#1a1b26`, `#24283b`)
- **Acentos**: Cyan (`#41a6b5`), púrpura (`#bb9af7`), verde (`#9ece6a`)
- **Colores de clases**: Basados en la paleta oficial de WotLK

Modifica `src/renderer/index.css` o `tailwind.config.js` para cambiar estilos.

## 🔌 Flujo de IPC (Inter-Process Communication)

```
Renderer (React) → IPC Request → Main (Node.js) → Database (SQLite) → Response
```

Las funciones de BD se exponen a través de `window.apiDB`:
- `getAllGuilds()`
- `getGuildHistory(guildId)`
- `getPlayerProfile(playerId)`
- `getRaiderStatus(name)`
- `insertRaidSession(data)`

## 📝 Uso

### 1. Analizador de Raids
- Selecciona una guild
- Ingresa un nombre para la sesión (ej: "ICC 25 Core Principal")
- **Especifica la hora de inicio y finalización** (campos opcionales)
- Pega el JSON del roster con formato:
```json
[
  { "name": "Mograine", "class": "PALADIN", "subgroup": 1 },
  { "name": "Thrall", "class": "SHAMAN", "subgroup": 1 }
]
```
- Haz clic en `ANALYZE_JSON_ROSTER()` para verificar
- Haz clic en `EXEC_COMMIT_SQLITE()` para guardar

### 2. Expedientes de Jugadores
- Ve a la pestaña [02] Expedientes
- Selecciona un jugador de la izquierda
- Visualiza sus personajes y historial de asistencia

### 3. Archivo de Guilds
- Ve a la pestaña [03] Archivo Guilds
- Selecciona una guild del dropdown
- Visualiza todas las sesiones registradas con:
  - **Hora de Inicio**: Cuándo comenzó la raid
  - **Hora de Finalización**: Cuándo terminó la raid
  - **Duración**: Tiempo total de la raid (calculado automáticamente)

## 🐛 Troubleshooting

**Error: "node:sqlite not available"**
- Asegúrate de tener Node.js v22 o superior
- Verifica con: `node --version`

**La BD no se crea**
- Revisa que la carpeta `userData` tenga permisos de escritura
- En Windows, verifica: `%APPDATA%/RaiderView/`

**HMR no funciona en desarrollo**
- Asegúrate de que el puerto 5173 esté libre
- Revisa la consola de Electron para más detalles

## 📄 Licencia

Este proyecto es privado. Todos los derechos reservados.

## 🤝 Contribuciones

Para contribuciones, contacta al desarrollador principal.

---

**Desarrollado con ❤️ para la comunidad de WoW**
