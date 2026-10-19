# 🎮 Showcase - Game Launcher

A sleek, console-inspired desktop game launcher built with **Electron**, designed to transform your local game library into an immersive showcase. 

Showcase automatically enriches your executables with high-definition vertical box art, panoramic backgrounds, authentic synopses, Metacritic scores, and active playtime tracking.

---

## ✨ Key Features

- **High-Definition Art via SteamGridDB**: Fetches 600×900 vertical posters and panoramic hero backdrops for clean visuals across both official and non-Steam games.
- **Dynamic Backdrop & 3D Cover Tilt**: Interactive hero section featuring dynamic blurred backdrops, depth layers, and an interactive 3D perspective tilt reacting to mouse position.
- **Rich Metadata via RAWG API**: Retrieves official synopses, release years, genres, and real Metascores without placeholder scores.
- **Playtime Tracking**: Tracks active gameplay time across sessions and records the date and time of the last played session.
- **Real-Time Filtering & Sorting**: Instant title/genre search, sorting options (Metascore, Playtime, Alphabetical, Date Added), and a toggleable Favorites system.
- **Drag & Drop Integration**: Add any game executable by dragging its `.exe` directly into the launcher window.
- **Custom Glassmorphism UI**: Built without browser-blocking dialogs (`prompt`/`alert`), using built-in modals and non-intrusive toast notifications.
- **Folder Navigation**: Dedicated button to reveal the game's executable and installation folder directly in Windows Explorer.

---

## 🛠️ Built With

- **[Electron](https://www.electronjs.org/)** (v28+) - Desktop runtime environment
- **[Node.js](https://nodejs.org/)** - Subprocess execution, asynchronous file system management, and native shell integration
- **[SteamGridDB API](https://www.steamgriddb.com/api/v2)** - High-resolution box art and wallpapers
- **[RAWG Video Games Database API](https://rawg.io/apidocs)** - Game summaries, release metadata, and Metacritic scores

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or higher recommended)
- `npm` (bundled with Node.js)
- A Windows environment for `.exe` launching and testing

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/usieldibiase/Showcase.git
   cd Showcase
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API Keys (Optional but recommended):**
   Open `main.js` and verify or set your API keys at the top of the file:
   ```javascript
   const STEAMGRIDDB_API_KEY = "your_steamgriddb_key_here";
   const RAWG_API_KEY = "your_rawg_key_here";
   ```
   - Get a free SteamGridDB Key: [steamgriddb.com/profile/preferences/api](https://www.steamgriddb.com/profile/preferences/api)
   - Get a free RAWG Key: [rawg.io/apidocs](https://rawg.io/apidocs)

---

## 💻 Usage

### Run in Development Mode
Launch the application directly with Electron:
```bash
npm start
```

### Build the Windows Installer
Package the application as an optimized NSIS installer executable:
```bash
npm run build
```
The compiled installer will be generated inside the `dist/` folder.

---

## ⌨️ Controls & Shortcuts

| Action | Control |
| :--- | :--- |
| **Previous Game** | `Left Arrow (◀)` or Carousel Click |
| **Next Game** | `Right Arrow (▶)` or Carousel Click |
| **Launch Game** | `Enter` or Click **▶ JUGAR AHORA** |
| **Add Game** | Click **+ Vincular Juego (.EXE)** or Drag & Drop `.exe` |
| **Cancel Modal** | `Escape` key |

---

## 📂 Project Architecture

```text
Showcase/
├── index.html        # Single-file UI: layout, styling, glassmorphism modals & carousel
├── main.js           # Electron main process, IPC handlers, API integrations & process monitor
├── package.json      # Dependencies and electron-builder build configurations
├── .gitignore        # Ignores /node_modules, /dist, and log files
└── README.md         # Documentation
```

---

## 📝 License

This project is licensed under the MIT License - feel free to modify and expand it for your personal game collection.