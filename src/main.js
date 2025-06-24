// Elementos HTML para la pantalla de inicio y efectos
const startButton = document.getElementById("start-button");
const startScreen = document.getElementById("start-screen");
const mapScreen = document.getElementById("map-screen");
const staticEffect = document.getElementById("static-effect");

// Referencias al canvas del mapa y  contexto de dibujo
const gameMapCanvas = document.getElementById("game-map-canvas");
const ctx = gameMapCanvas.getContext("2d");

// --- Configuración del Canvas y el Mapa ---
const TILE_SIZE = 16;
let MAP_WIDTH_TILES;
let MAP_HEIGHT_TILES;

// --- Definición del Mapa ---
// Mapa representado como una matriz 2D
// Cada número es un tipo de tile:
// 0: Césped
// 1: Agua
// 2: Camino
// 3: Punto de interés
let gameMap; // Se inicializa más adelante

// Colores para cada tipo de tile
const TILE_COLORS = {
  0: "#336633", // Verde oscuro = césped
  1: "#003366", // Azul oscuro = agua
  2: "#666666", // Gris = camino
  3: "#cc0000", // Rojo = punto de interés (provisorio)
};

// Datos del jugador
const player = {
  x: 0, // Posición X (en tiles), se ajusta luego
  y: 0, // Posición Y (en tiles), se ajusta luego
  color: "#ffff00", // Color amarillo del personaje
  size: TILE_SIZE / 1.5, // Tamaño un poco menor al tile
};

// --- Funciones para Dibujar ---
function drawTile(tileX, tileY, type) {
  ctx.fillStyle = TILE_COLORS[type];
  ctx.fillRect(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  // El personaje se dibuja centrado en su tile
  ctx.fillRect(
    player.x * TILE_SIZE + (TILE_SIZE - player.size) / 2,
    player.y * TILE_SIZE + (TILE_SIZE - player.size) / 2,
    player.size,
    player.size
  );
}

function drawMap() {
  ctx.clearRect(0, 0, gameMapCanvas.width, gameMapCanvas.height); // Limpia todo el canvas

  // Recorre la matriz del mapa y dibuja cada tile
  for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
    for (let x = 0; x < MAP_WIDTH_TILES; x++) {
      drawTile(x, y, gameMap[y][x]);
    }
  }
  // console.log("Mapa dibujado."); // Dejo esto comentado para que no llene la consola
}

// --- Loop Principal del Juego ---
function gameLoop() {
  drawMap();
  drawPlayer();

  // Vuelve a ejecutar el loop en el siguiente frame
  requestAnimationFrame(gameLoop);
}

// --- Redimensión Dinámica del Canvas e Inicialización del Mapa ---
function resizeGame() {
  // Tamaño real del contenedor del mapa
  const mapContainerWidth = mapScreen.clientWidth;
  const mapContainerHeight = mapScreen.clientHeight;

  // Calcula cuántos tiles entran
  MAP_WIDTH_TILES = Math.floor(mapContainerWidth / TILE_SIZE);
  MAP_HEIGHT_TILES = Math.floor(mapContainerHeight / TILE_SIZE);

  // Ajusta el tamaño del canvas según la cantidad de tiles
  gameMapCanvas.width = MAP_WIDTH_TILES * TILE_SIZE;
  gameMapCanvas.height = MAP_HEIGHT_TILES * TILE_SIZE;

  // Reinicia el mapa con el nuevo tamaño
  gameMap = Array(MAP_HEIGHT_TILES)
    .fill(0)
    .map(() => Array(MAP_WIDTH_TILES).fill(0));

  // Pone al jugador en el centro del mapa
  player.x = Math.floor(MAP_WIDTH_TILES / 2);
  player.y = Math.floor(MAP_HEIGHT_TILES / 2);

  console.log(
    `Mapa redimensionado a ${MAP_WIDTH_TILES}x${MAP_HEIGHT_TILES} tiles.`
  );

  // Dibuja el mapa y al jugador inmediatamente
  drawMap();
  drawPlayer();
}

let startSound; // Variable para el sonido al iniciar

// Carga y configura los sonidos usando Tone.js
async function loadSounds() {
  startSound = new Tone.Synth().toDestination();
  console.log("Sonidos cargados, Tone.js listo.");
}

// Lo que pasa cuando se hace clic en el botón START
function handleStartClick() {
  console.log("Botón START presionado!");
  if (startSound) {
    startSound.triggerAttackRelease("C4", "8n");
  }

  // Oculta la pantalla de inicio
  startScreen.classList.add("hidden");
  // Muestra el mapa
  mapScreen.classList.remove("hidden");

  // Redimensiona y arranca el juego
  resizeGame();
  requestAnimationFrame(gameLoop);

  // Aplica una transición suave al efecto estático
  staticEffect.style.transition = "opacity 2s ease-out";
  staticEffect.style.opacity = "0.02"; // Lo deja casi invisible
  staticEffect.style.animation = "none"; // Lo deja fijo
  console.log("Transición a la pantalla del mapa completada.");
}

// --- Movimiento con Teclado ---
document.addEventListener("keydown", (event) => {
  let newPlayerX = player.x;
  let newPlayerY = player.y;

  switch (event.key) {
    case "ArrowUp":
      newPlayerY--;
      break;
    case "ArrowDown":
      newPlayerY++;
      break;
    case "ArrowLeft":
      newPlayerX--;
      break;
    case "ArrowRight":
      newPlayerX++;
      break;
  }

  // Verifica que no se salga del mapa
  if (
    newPlayerX >= 0 &&
    newPlayerX < MAP_WIDTH_TILES &&
    newPlayerY >= 0 &&
    newPlayerY < MAP_HEIGHT_TILES
  ) {
    player.x = newPlayerX;
    player.y = newPlayerY;
  }
});

// Carga los sonidos y luego activa el botón
loadSounds()
  .then(() => {
    startButton.addEventListener("click", handleStartClick);
  })
  .catch((error) => {
    console.error("Error al cargar sonidos:", error);
  });

// Si cambia el tamaño de la ventana, ajusta el canvas
window.addEventListener("resize", resizeGame);

console.log("Motor retro listo para jugar.");
