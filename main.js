const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises'); // Importado para operaciones de disco asíncronas
const { execFile } = require('child_process');

const DATA_PATH = path.join(app.getPath('userData'), 'library.json');

// Claves de API configuradas
const STEAMGRIDDB_API_KEY = "dcb47332466a77aabb8bd44b20f1fb8e"; 
const RAWG_API_KEY = "07777091fd954f26ae17d648feb26d52"; 

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 1100,
        minHeight: 720,
        backgroundColor: '#070709',
        autoHideMenuBar: true,
        show: false, // Optimización: Oculta hasta que el DOM esté renderizado
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');

    // Optimización: Mostrar solo cuando el motor gráfico ha pintado la interfaz
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// Base de datos de reserva local
const FALLBACK_DB = {
    "witcher": {
        title: "The Witcher 3: Wild Hunt",
        metacritic: 93,
        released: "2015",
        genres: "Action RPG, Open World",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg",
        coverFallback: "https://images.igdb.com/igdb/image/upload/t_1080p/sc6r6r.jpg",
        background: "https://images.igdb.com/igdb/image/upload/t_1080p/sc6r6r.jpg",
        summary: "Eres Geralt de Rivia, cazador de monstruos. En un continente devastado por la guerra e infestado de criaturas, tu misión es encontrar a Ciri, la niña de la profecía."
    },
    "cyberpunk": {
        title: "Cyberpunk 2077",
        metacritic: 86,
        released: "2020",
        genres: "Sci-Fi RPG, FPS",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co7497.jpg",
        coverFallback: "https://images.igdb.com/igdb/image/upload/t_1080p/sc8d2m.jpg",
        background: "https://images.igdb.com/igdb/image/upload/t_1080p/sc8d2m.jpg",
        summary: "Cyberpunk 2077 es una historia de acción y aventura en mundo abierto ambientada en Night City, una megalópolis obsesionada con el poder, el glamur y la modificación corporal."
    },
    "elden": {
        title: "Elden Ring",
        metacritic: 96,
        released: "2022",
        genres: "Souls-like, Action RPG",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg",
        coverFallback: "https://images.igdb.com/igdb/image/upload/t_1080p/scAG4d.jpg",
        background: "https://images.igdb.com/igdb/image/upload/t_1080p/scAG4d.jpg",
        summary: "Álzate, Sinluz, y que la gracia te guíe para abrazar el poder del Círculo de Elden y convertirte en un Señor de Elden en las Tierras Intermedias."
    },
    "rdr2": {
        title: "Red Dead Redemption 2",
        metacritic: 97,
        released: "2018",
        genres: "Action, Western, Open World",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.jpg",
        coverFallback: "https://images.igdb.com/igdb/image/upload/t_1080p/Uf7a2s.jpg",
        background: "https://images.igdb.com/igdb/image/upload/t_1080p/Uf7a2s.jpg",
        summary: "América, 1899. Arthur Morgan y la banda de Van der Linde son forajidos en busca y captura."
    },
    "metal gear": {
        title: "Metal Gear Solid 4: Guns of the Patriots",
        metacritic: 94,
        released: "2008",
        genres: "Stealth, Tactical Action",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2044.jpg",
        coverFallback: "https://images.igdb.com/igdb/image/upload/t_1080p/sc810z.jpg",
        background: "https://images.igdb.com/igdb/image/upload/t_1080p/sc810z.jpg",
        summary: "La última misión de Solid Snake en un teatro de guerra moderno dominado por contratistas militares privados."
    }
};

// Optimización: Lectura de archivos asíncrona para no bloquear el inicio
async function readLibrary() {
    try {
        await fsp.access(DATA_PATH);
        const data = await fsp.readFile(DATA_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return null;
    }
}

// Optimización: Escritura asíncrona en segundo plano
async function writeLibrary(data) {
    try {
        await fsp.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error guardando library.json:", err);
    }
}

function cleanExeName(fullPath) {
    const fileName = path.basename(fullPath, path.extname(fullPath));
    const parentFolder = path.basename(path.dirname(fullPath));
    const grandParentFolder = path.basename(path.dirname(path.dirname(fullPath)));

    let raw = fileName;
    if (fileName.length <= 4 || /^(game|launcher|shipping|start|play|app|bin|client)$/i.test(fileName)) {
        raw = (parentFolder.length > 4 && !/^(bin|win64|x64|retail|binaries)$/i.test(parentFolder)) 
            ? parentFolder 
            : grandParentFolder;
    }

    return raw
        .replace(/\.exe$/i, '')
        .replace(/[-_.]/g, ' ')
        .replace(/\b(x64|x86|win64|dx12|dx11|shipping|launcher|game|bin|collection|master|vol\s*\d*)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

async function fetchJSON(url, customHeaders = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(url, {
            headers: { 
                'User-Agent': 'ShowcaseGameLauncher/1.2',
                ...customHeaders 
            },
            signal: controller.signal
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } finally {
        clearTimeout(timeout);
    }
}

async function fetchFromSteamGridDB(query) {
    if (!STEAMGRIDDB_API_KEY) return null;

    try {
        const headers = { 
            'Authorization': `Bearer ${STEAMGRIDDB_API_KEY}`
        };

        const searchUrl = `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(query)}`;
        const searchData = await fetchJSON(searchUrl, headers);

        if (!searchData.success || !searchData.data || searchData.data.length === 0) {
            return null;
        }

        const gameId = searchData.data[0].id;
        const verifiedTitle = searchData.data[0].name;

        const [gridsData, heroesData] = await Promise.all([
            fetchJSON(`https://www.steamgriddb.com/api/v2/grids/game/${gameId}?dimensions=600x900`, headers).catch(() => null),
            fetchJSON(`https://www.steamgriddb.com/api/v2/heroes/game/${gameId}`, headers).catch(() => null)
        ]);

        const cover = gridsData?.data?.[0]?.url || null;
        const background = heroesData?.data?.[0]?.url || cover;

        return {
            title: verifiedTitle,
            cover,
            background
        };
    } catch (err) {
        console.error("Fallo consulta SteamGridDB:", err.message);
        return null;
    }
}

async function fetchGameMetadata(inputPath, customSearch = null) {
    const query = (customSearch || cleanExeName(inputPath)).toLowerCase();
    const sgdbResult = await fetchFromSteamGridDB(query);

    // 2. Consulta de metadatos completos y sinopsis real en RAWG
    let rawgMeta = null;
    if (RAWG_API_KEY) {
        try {
            const searchUrl = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=1`;
            const searchData = await fetchJSON(searchUrl);

            if (searchData.results && searchData.results.length > 0) {
                const gameResult = searchData.results[0];

                // Consulta al detalle del juego para traer la sinopsis completa
                let detailedSummary = "Sin descripción disponible.";
                try {
                    const detailUrl = `https://api.rawg.io/api/games/${gameResult.id}?key=${RAWG_API_KEY}`;
                    const detailData = await fetchJSON(detailUrl);
                    if (detailData.description_raw) {
                        detailedSummary = detailData.description_raw;
                    } else if (detailData.description) {
                        detailedSummary = detailData.description.replace(/<[^>]*>?/gm, ''); // Quita etiquetas HTML
                    }
                } catch (detailErr) {
                    console.error("No se pudo obtener la descripción detallada:", detailErr.message);
                }

                rawgMeta = {
                    title: gameResult.name,
                    metacritic: gameResult.metacritic ?? null,
                    released: gameResult.released ? gameResult.released.split('-')[0] : "PC",
                    genres: gameResult.genres && gameResult.genres.length > 0 
                        ? gameResult.genres.map(x => x.name).join(', ') 
                        : "Acción",
                    cover: gameResult.background_image,
                    background: gameResult.short_screenshots?.[1]?.image || gameResult.background_image,
                    summary: detailedSummary
                };
            }
        } catch (err) {
            console.error("Fallo consulta RAWG:", err.message);
        }
    }
    
    for (const key in FALLBACK_DB) {
        if (query.includes(key)) {
            const local = FALLBACK_DB[key];
            return {
                ...local,
                title: sgdbResult?.title || rawgMeta?.title || local.title,
                cover: sgdbResult?.cover || rawgMeta?.cover || local.cover,
                coverFallback: local.coverFallback,
                background: sgdbResult?.background || rawgMeta?.background || local.background,
                metacritic: rawgMeta?.metacritic !== undefined ? rawgMeta.metacritic : local.metacritic
            };
        }
    }

    const finalTitle = sgdbResult?.title || rawgMeta?.title || cleanExeName(inputPath) || "Juego Local";
    const finalCover = sgdbResult?.cover || rawgMeta?.cover || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80";
    const finalBg = sgdbResult?.background || rawgMeta?.background || finalCover;

    return {
        title: finalTitle,
        metacritic: rawgMeta?.metacritic ?? null,
        released: rawgMeta?.released || "PC",
        genres: rawgMeta?.genres || "Juego Local",
        cover: finalCover,
        coverFallback: finalCover,
        background: finalBg,
        summary: rawgMeta?.summary || "Juego añadido a tu biblioteca personalizada."
    };
}

// === IPC HANDLERS ===

ipcMain.handle('load-library', async () => {
    const existing = await readLibrary();
    if (existing) return existing;

    const initialGames = [
        { id: '1', exePath: 'C:/Games/EldenRing/eldenring.exe', favorite: true, playTime: 145, lastPlayed: null, ...FALLBACK_DB['elden'] },
        { id: '2', exePath: 'C:/Games/Witcher3/witcher3.exe', favorite: false, playTime: 60, lastPlayed: null, ...FALLBACK_DB['witcher'] },
        { id: '3', exePath: 'C:/Games/Cyberpunk2077/Cyberpunk2077.exe', favorite: false, playTime: 0, lastPlayed: null, ...FALLBACK_DB['cyberpunk'] }
    ];
    await writeLibrary(initialGames);
    return initialGames;
});

async function registerGameByPath(exePath, customName = null) {
    const metadata = await fetchGameMetadata(exePath, customName);
    const newGame = {
        id: Date.now().toString(),
        exePath,
        favorite: false,
        playTime: 0,
        lastPlayed: null,
        ...metadata
    };

    const library = (await readLibrary()) || [];
    library.unshift(newGame);
    await writeLibrary(library);
    return library;
}

ipcMain.handle('add-game-exe', async (event, customName) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Selecciona el ejecutable (.exe) del videojuego',
        filters: [{ name: 'Ejecutables', extensions: ['exe'] }],
        properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) return null;
    return await registerGameByPath(result.filePaths[0], customName);
});

ipcMain.handle('add-dropped-exe', async (event, exePath) => {
    if (!exePath || !exePath.toLowerCase().endsWith('.exe')) return null;
    return await registerGameByPath(exePath);
});

ipcMain.handle('refresh-metadata', async (event, { id, searchName }) => {
    const library = (await readLibrary()) || [];
    const idx = library.findIndex(g => g.id === id);
    if (idx !== -1) {
        const meta = await fetchGameMetadata(searchName, searchName);
        library[idx] = { ...library[idx], ...meta };
        await writeLibrary(library);
    }
    return library;
});

ipcMain.handle('toggle-favorite', async (event, id) => {
    const library = (await readLibrary()) || [];
    const idx = library.findIndex(g => g.id === id);
    if (idx !== -1) {
        library[idx].favorite = !library[idx].favorite;
        await writeLibrary(library);
    }
    return library;
});

ipcMain.handle('delete-game', async (event, id) => {
    let library = (await readLibrary()) || [];
    library = library.filter(g => g.id !== id);
    await writeLibrary(library);
    return library;
});

ipcMain.handle('open-folder', async (event, exePath) => {
    if (!fs.existsSync(exePath)) {
        return { success: false, message: 'La ruta especificada no existe en este equipo.' };
    }
    shell.showItemInFolder(path.normalize(exePath));
    return { success: true };
});

ipcMain.handle('launch-game', async (event, { id, exePath }) => {
    if (!fs.existsSync(exePath)) {
        return { success: false, message: `No se encontró el ejecutable en:\n${exePath}` };
    }

    const startTime = Date.now();
    
    try {
        const child = execFile(exePath, { cwd: path.dirname(exePath) }, (err) => {
            if (err) console.error("Error al ejecutar:", err);
        });

        child.on('close', async () => {
            const elapsedSeconds = (Date.now() - startTime) / 1000;
            const addedMinutes = elapsedSeconds > 10 ? Math.max(1, Math.round(elapsedSeconds / 60)) : 0;

            const library = (await readLibrary()) || [];
            const idx = library.findIndex(g => g.id === id);
            if (idx !== -1) {
                library[idx].playTime = (library[idx].playTime || 0) + addedMinutes;
                library[idx].lastPlayed = new Date().toISOString();
                await writeLibrary(library);
            }

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('game-closed', { id, library });
            }
        });

        return { success: true };
    } catch (e) {
        return { success: false, message: `No se pudo iniciar el proceso: ${e.message}` };
    }
});