const startButton = document.getElementById("start-button");
const startScreen = document.getElementById("start-screen");
const mapScreen = document.getElementById("map-screen");
const staticEffect = document.getElementById("static-effect");

// Referencias al canvas del mapa y contexto de dibujo
const gameMapCanvas = document.getElementById("game-map-canvas");
const ctx = gameMapCanvas.getContext("2d");

// Elementos de Interacción del HUD
const interactionPrompt = document.getElementById("interaction-prompt"); // Mensaje "Presiona [ESPACIO]"
const actionButton = document.getElementById("action-button"); // Botón de acción para móvil

// --- Elementos del Modal ---
const interactionModal = document.getElementById("interaction-modal"); // El div principal del modal (el overlay)
const modalCloseButton = document.getElementById("modal-close-button"); // El botón de cerrar ('X')
const modalTitle = document.getElementById("modal-title"); // El título dentro del modal
const modalBody = document.getElementById("modal-body"); // El cuerpo donde va el contenido del portfolio

// --- DEBUG---
console.log("DEBUG: interactionModal encontrado?", interactionModal);
console.log("DEBUG: modalCloseButton encontrado?", modalCloseButton);

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
  3: "#cc0000", // Rojo = punto de interés (provisorio para visualizarlo)
};

// Datos del jugador
const player = {
  x: 0, // Posición X (en tiles), se ajusta luego
  y: 0, // Posición Y (en tiles), se ajusta luego
  color: "#ffff00", // Color amarillo del personaje
  size: TILE_SIZE / 1.5,
};

// --- Puntos de Interés en el Mapa ---

const interactionPoints = [
  {
    x: 5,
    y: 5,
    type: "about",
    message: "Sobre mí",
    content:
      "<p>¡Hola! Soy Samanta, una desarrolladora web con pasión por crear experiencias digitales innovadoras y atractivas. Me encanta transformar ideas en código funcional y diseño interactivo. ¡Explora mi mundo para conocerme mejor!</p>",
  },
  {
    x: 15,
    y: 10,
    type: "skills",
    message: "Mis habilidades",
    content:
      '<h3 style="font-size:1.2em; margin-bottom:10px; color:#c0ff80;">Dominio Técnico:</h3><ul><li>JavaScript (ES6+)</li><li>HTML5 & CSS3</li><li>React.js</li><li>Node.js (Básico)</li><li>Git & GitHub</li><li>Diseño UX/UI (Figma)</li></ul><h3 style="font-size:1.2em; margin-top:20px; margin-bottom:10px; color:#80c0ff;">Herramientas:</h3><ul><li>Visual Studio Code</li><li>NPM/Yarn</li><li>Webpack/Vite (Básico)</li></ul>',
  },
  {
    x: 25,
    y: 15,
    type: "contact",
    message: "Contacto",
    content:
      '<p>¡Me encantaría conectar contigo!</p><p>Puedes enviarme un correo a: <a href="mailto:tuemail@example.com" style="color: #66ccff; text-decoration: none; font-weight: bold;">tuemail@example.com</a></p><p>O visita mi LinkedIn: <a href="https://www.linkedin.com/in/tuperfil" target="_blank" style="color: #66ccff; text-decoration: none; font-weight: bold;">linkedin.com/in/tuperfil</a></p>',
  },
];

// Variable para almacenar el punto de interacción actual si el jugador está cerca
let currentInteractionPoint = null;

// --- Funciones para Dibujar ---

/**
 * Dibuja una única baldosa en el canvas.
 * @param {number} tileX La coordenada X de la baldosa en la cuadrícula del mapa.
 * @param {number} tileY La coordenada Y de la baldosa en la cuadrícula del mapa.
 * @param {number} type El tipo de baldosa (0, 1, 2, 3...) que determina su color.
 */
function drawTile(tileX, tileY, type) {
  ctx.fillStyle = TILE_COLORS[type]; // Establece el color de relleno basado en el tipo de baldosa
  // Dibuja un rectángulo en la posición correcta (convirtiendo coordenadas de baldosa a píxeles)
  ctx.fillRect(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

/**
 * Dibuja el personaje del jugador en su posición actual.
 */
function drawPlayer() {
  ctx.fillStyle = player.color; // Establece el color de relleno al color del jugador
  // Dibuja un rectángulo para el personaje, centrándolo dentro de su baldosa actual
  ctx.fillRect(
    player.x * TILE_SIZE + (TILE_SIZE - player.size) / 2, // Coordenada X centrada en la baldosa
    player.y * TILE_SIZE + (TILE_SIZE - player.size) / 2, // Coordenada Y centrada en la baldosa
    player.size, // Ancho del personaje
    player.size // Alto del personaje
  );
}

/**
 * Dibuja los puntos de interés en el mapa para visualización temporal.
 * Estos son los cuadrados rojos que indican dónde interactuar.
 */
function drawInteractionPoints() {
  interactionPoints.forEach((point) => {
    ctx.fillStyle = TILE_COLORS[3];
    // Dibuja un cuadrado más pequeño para el punto de interés para distinguirlo
    ctx.fillRect(
      point.x * TILE_SIZE + TILE_SIZE / 4,
      point.y * TILE_SIZE + TILE_SIZE / 4,
      TILE_SIZE / 2,
      TILE_SIZE / 2
    );
  });
}

/**
 * Dibuja todo el mapa del juego, baldosa por baldosa, y los puntos de interacción.
 */
function drawMap() {
  ctx.clearRect(0, 0, gameMapCanvas.width, gameMapCanvas.height); // Limpia todo el canvas antes de redibujar

  // Recorre la matriz del mapa  y dibuja cada baldosa
  for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
    for (let x = 0; x < MAP_WIDTH_TILES; x++) {
      drawTile(x, y, gameMap[y][x]); // Llama a drawTile para cada posición (x, y) con su tipo de baldosa
    }
  }
  drawInteractionPoints(); // Dibuja los puntos de interacción encima del mapa
}

// --- Bucle Principal del Juego ---
/**
 * La función principal que se llama repetidamente para actualizar y dibujar el juego.
 */
function gameLoop() {
  drawMap();
  drawPlayer();
  checkInteraction(); // Comprueba si el jugador está cerca de un punto de interacción

  // Solicita al navegador que llame a 'gameLoop' de nuevo en el próximo fotograma de animación
  requestAnimationFrame(gameLoop);
}

// --- Redimensionamiento Dinámico del Canvas y Inicialización del Mapa ---
/**
 * Ajusta el tamaño del canvas del juego y el mapa en función del tamaño de la ventana
 * o el contenedor del mapa.
 */
function resizeGame() {
  // Obtiene el ancho y alto real del contenedor 'mapScreen' en el que se encuentra el canvas
  const mapContainerWidth = mapScreen.clientWidth;
  const mapContainerHeight = mapScreen.clientHeight;

  // Calcula cuántas baldosas caben en el ancho y alto disponibles, usando el TILE_SIZE
  MAP_WIDTH_TILES = Math.floor(mapContainerWidth / TILE_SIZE);
  MAP_HEIGHT_TILES = Math.floor(mapContainerHeight / TILE_SIZE);

  // Establece las dimensiones reales del canvas en píxeles
  gameMapCanvas.width = MAP_WIDTH_TILES * TILE_SIZE;
  gameMapCanvas.height = MAP_HEIGHT_TILES * TILE_SIZE;

  // Reinicializa la matriz del mapa con las nuevas dimensiones
  // Esto crea un nuevo mapa lleno de baldosas de tipo 0 (terreno)
  gameMap = Array(MAP_HEIGHT_TILES)
    .fill(0) // Rellena con filas que inicialmente son 0
    .map(() => Array(MAP_WIDTH_TILES).fill(0)); // Cada fila es un array lleno de 0s

  // Coloca al jugador en el centro del nuevo mapa redimensionado
  player.x = Math.floor(MAP_WIDTH_TILES / 2);
  player.y = Math.floor(MAP_HEIGHT_TILES / 2);

  console.log(
    `Mapa redimensionado a ${MAP_WIDTH_TILES}x${MAP_HEIGHT_TILES} tiles.`
  );
  // Vuelve a dibujar el mapa y al jugador inmediatamente después de redimensionar
  drawMap();
  drawPlayer();
  checkInteraction(); // Comprueba interacción después de redimensionar por si el jugador ya está cerca de un punto.
}

let startSound; // Variable para almacenar el objeto de sonido que se reproducirá al inicio

/**
 * Carga y prepara los sonidos utilizando la librería Tone.js.
 */
async function loadSounds() {
  // Crea un sintetizador simple y lo conecta a la salida de audio del dispositivo
  startSound = new Tone.Synth().toDestination();
  console.log("Sonidos cargados, Tone.js listo."); // Confirma que los sonidos están listos
}

/**
 * Función que se ejecuta cuando se hace clic en el botón "START".
 */
function handleStartClick() {
  console.log("¡Botón START presionado!");
  if (startSound) {
    startSound.triggerAttackRelease("C4", "8n");
  }
  // Oculta la pantalla de inicio
  startScreen.classList.add("hidden");
  // Muestra la pantalla del mapa
  mapScreen.classList.remove("hidden");

  // Realiza el redimensionamiento inicial del juego y luego inicia el bucle principal
  resizeGame(); // Asegura que el canvas tenga el tamaño correcto antes de empezar
  requestAnimationFrame(gameLoop); // Inicia el bucle de animación del juego

  // Aplica una transición suave al efecto de estática para que desaparezca lentamente
  staticEffect.style.transition = "opacity 2s ease-out";
  staticEffect.style.opacity = "0.02";
  staticEffect.style.animation = "none"; // Desactiva cualquier animación de parpadeo que pudiera tener
  console.log("Transición a la pantalla del mapa completada.");
}

// --- Lógica de Interacción ---
const INTERACTION_DISTANCE = 1; // Distancia en tiles para considerar que el jugador está "cerca"

/**
 * Comprueba si el jugador está cerca de un punto de interés
 * y muestra/oculta el mensaje y botón de acción.
 */
function checkInteraction() {
  let playerIsNearPoint = false; // Bandera para saber si el jugador está cerca de AL MENOS UN punto
  currentInteractionPoint = null; // Reinicia el punto de interacción actual en cada verificación

  // Itera sobre todos los puntos de interés definidos
  interactionPoints.forEach((point) => {
    // Calcula la distancia horizontal + vertical entre el jugador y el punto
    const distance =
      Math.abs(player.x - point.x) + Math.abs(player.y - point.y);

    // Si el jugador está dentro de la distancia de interacción
    if (distance <= INTERACTION_DISTANCE) {
      playerIsNearPoint = true; // Establece la bandera a true
      currentInteractionPoint = point; // Almacena una referencia al punto con el que el jugador puede interactuar
      // Actualiza el texto del mensaje de interacción en el HUD
      interactionPrompt.textContent = `Presiona [ESPACIO] para: ${point.message}`;
    }
  });

  // Muestra u oculta el mensaje y el botón de acción según si el jugador está cerca de un punto
  if (playerIsNearPoint) {
    // Solo muestra el prompt y el botón si el modal no está abierto
    if (interactionModal.classList.contains("hidden")) {
      // Verifica si el modal está oculto
      interactionPrompt.classList.remove("hidden"); // Muestra el mensaje
      actionButton.classList.remove("hidden"); // Muestra el botón de acción
    }
  } else {
    interactionPrompt.classList.add("hidden"); // Oculta el mensaje
    actionButton.classList.add("hidden"); // Oculta el botón de acción
  }
}

/**
 * Función que se ejecuta cuando el jugador intenta interactuar (presionando Espacio o el botón de acción táctil).
 * Abre el modal de interacción con el contenido relevante.
 */
function performInteraction() {
  if (currentInteractionPoint) {
    // Si hay un punto de interacción cercano
    console.log(`Interacción con el punto: ${currentInteractionPoint.type}`);

    // Rellena el título y el cuerpo del modal con la información del punto de interés
    modalTitle.textContent = currentInteractionPoint.message;
    modalBody.innerHTML = currentInteractionPoint.content; // Usa innerHTML para renderizar el HTML del contenido

    // Muestra el modal quitando la clase 'hidden'
    interactionModal.classList.remove("hidden");

    // Oculta el prompt de interacción y el botón de acción una vez que el modal está abierto
    interactionPrompt.classList.add("hidden");
    actionButton.classList.add("hidden");
  } else {
    console.log("No hay punto de interacción cercano."); // Mensaje si no hay nada cerca para interactuar
  }
}

/**
 * Cierra el modal de interacción.
 */
function closeModal() {
  console.log("DEBUG: closeModal() llamado."); //  Confirmar que la función se ejecuta
  interactionModal.classList.add("hidden");
  // Vuelve a comprobar la interacción por si el jugador sigue cerca del punto
  // Esto asegura que el prompt/botón reaparezca si el jugador no se ha movido.
  checkInteraction();
}

// --- Manejo de Movimiento y Entrada por Teclado ---
// Agrega un escuchador de eventos para detectar cuando se presiona una tecla
document.addEventListener("keydown", (event) => {
  // Si el modal está abierto, solo permite cerrar con la tecla 'Escape' y no permite mover al jugador.
  if (!interactionModal.classList.contains("hidden")) {
    if (event.key === "Escape") {
      // Si la tecla presionada es 'Escape'
      console.log("DEBUG: Tecla Escape presionada."); // DEBUG: Confirmar Escape detectado
      closeModal(); // Cierra el modal
    }
    return; // Sale de la función, impidiendo que el jugador se mueva mientras el modal está abierto.
  }

  let newPlayerX = player.x; // Variable temporal para la nueva posición X del jugador
  let newPlayerY = player.y; // Variable temporal para la nueva posición Y del jugador

  // Usa un 'switch' para determinar qué tecla de flecha se presionó para el movimiento
  switch (event.key) {
    case "ArrowUp": // Flecha arriba
      newPlayerY--; // Mueve el jugador una posición hacia arriba (disminuye Y)
      break;
    case "ArrowDown": // Flecha abajo
      newPlayerY++; // Mueve el jugador una posición hacia abajo (aumenta Y)
      break;
    case "ArrowLeft": // Flecha izquierda
      newPlayerX--; // Mueve el jugador una posición hacia la izquierda (disminuye X)
      break;
    case "ArrowRight": // Flecha derecha
      newPlayerX++; // Mueve el jugador una posición hacia la derecha (aumenta X)
      break;
    case " ": // Tecla Espacio para interactuar
      performInteraction(); // Llama a la función de interacción
      break;
  }

  // Verifica que la nueva posición no se salga de los límites del mapa
  if (
    newPlayerX >= 0 && // La nueva posición X debe ser mayor o igual a 0 (borde izquierdo)
    newPlayerX < MAP_WIDTH_TILES && // La nueva posición X debe ser menor que el ancho del mapa (borde derecho)
    newPlayerY >= 0 && // La nueva posición Y debe ser mayor o igual a 0 (borde superior)
    newPlayerY < MAP_HEIGHT_TILES // La nueva posición Y debe ser menor que el alto del mapa (borde inferior)
  ) {
    player.x = newPlayerX; // Si la nueva posición es válida, actualiza la posición X del jugador
    player.y = newPlayerY; // Si la nueva posición es válida, actualiza la posición Y del jugador
  }
});

// Agrega un escuchador de eventos para el botón de acción táctil en móviles
actionButton.addEventListener("click", performInteraction);

if (modalCloseButton) {
  modalCloseButton.addEventListener("click", () => {
    console.log("DEBUG: Clic en el botón de cerrar modal (X) detectado."); // DEBUG: Confirmar clic
    closeModal();
  });
} else {
  console.error(
    'ERROR: modalCloseButton no se encontró. El botón "X" no funcionará.'
  );
}

// --- Inicialización del Juego ---
// Carga los sonidos y, una vez que estén listos, activa el escuchador de clics del botón START
loadSounds()
  .then(() => {
    startButton.addEventListener("click", handleStartClick); // Asocia la función handleStartClick al evento 'click' del botón
  })
  .catch((error) => {
    // En caso de que ocurra un error al cargar los sonidos, lo registra en la consola
    console.error("Error al cargar sonidos:", error);
  });

// Agrega un escuchador de eventos para redimensionar el canvas cuando el tamaño de la ventana cambie
window.addEventListener("resize", resizeGame);

// Mensaje inicial en la consola del navegador
console.log("Motor retro listo para jugar.");
