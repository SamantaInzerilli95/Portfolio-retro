// Obtengo los elementos HTML que voy a usar para controlar las pantallas y efectos
const startButton = document.getElementById("start-button");
const startScreen = document.getElementById("start-screen");
const mapScreen = document.getElementById("map-screen");
const staticEffect = document.getElementById("static-effect");

let startSound; // Variable para guardar el sonido que se va a reproducir al iniciar

// Función que carga y prepara los sonidos usando Tone.js
async function loadSounds() {
  startSound = new Tone.Synth().toDestination(); // Creo un sintetizador simple
  console.log("Sonidos cargados y Tone.js listo."); // Confirmo que los sonidos están listos
}

// Función que se ejecuta cuando se clickea el botón de inicio
function handleStartClick() {
  console.log("Botón START clickeado!");
  if (startSound) {
    // Si el sonido ya está cargado, lo reproduzco
    startSound.triggerAttackRelease("C4", "8n");
  }
  // Oculto la pantalla de inicio
  startScreen.classList.add("hidden");
  // Muestro la pantalla del mapa
  mapScreen.classList.remove("hidden");
  // Aplico una transición suave al efecto estático para que desaparezca lentamente
  staticEffect.style.transition = "opacity 2s ease-out";
  staticEffect.style.opacity = "0.02"; // Lo dejo casi transparente
  staticEffect.style.animation = "none"; // Quito la animación para que se mantenga fijo
  console.log("Transición a la pantalla del mapa completada.");
}

// Cargo los sonidos y luego activo el listener para el botón
loadSounds()
  .then(() => {
    startButton.addEventListener("click", handleStartClick);
  })
  .catch((error) => {
    // En caso de error, lo muestro en consola
    console.error("Error al cargar los sonidos:", error);
  });

console.log("El motor del juego retro está listo para interactuar.");
