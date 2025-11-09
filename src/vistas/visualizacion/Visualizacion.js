import { logout as logoutFunc, getSesion } from "../util/sesion.js";

// 🔹 Obtiene los datos desde el backend
function obtenerDatosEstacion({
  Nombre,
  Latitud,
  Longitud,
  CalidadAgua,
  color,
  datosSensor,
} = {}) {
  const nombreEstacion = document.getElementById("nombre-estacion");
  const ultimaLectura = document.getElementById("ultima-lectura");
  const datoPh = document.getElementById("dato-ph");
  const datoTurbidez = document.getElementById("dato-turbidez");
  const datoOxigeno = document.getElementById("dato-oxigeno");
  const datoConductividad = document.getElementById("dato-conductividad");
  const datoTemperatura = document.getElementById("dato-temperatura");

  nombreEstacion.textContent = Nombre || "No disponible";

  ultimaLectura.textContent = CalidadAgua || "--/--/---- --:--";
  ultimaLectura.style.color = color;

  const ph = datosSensor.find((d) => d.ParametroID === 1);
  const turbidez = datosSensor.find((d) => d.ParametroID === 2);
  const oxigenoDisuelto = datosSensor.find((d) => d.ParametroID === 3);
  const conductividad = datosSensor.find((d) => d.ParametroID === 4);
  const temperatura = datosSensor.find((d) => d.ParametroID === 5);

  datoPh.textContent = ph?.Valor_procesado ?? "--";
  datoTurbidez.textContent = turbidez?.Valor_procesado ?? "--";
  datoOxigeno.textContent = oxigenoDisuelto?.Valor_procesado ?? "--";
  datoConductividad.textContent = conductividad?.Valor_procesado ?? "--";
  datoTemperatura.textContent = temperatura?.Valor_procesado ?? "--";
}

// 🔹 Control del menú desplegable del usuario
function inicializarMenuUsuario() {
  const userBtn = document.getElementById("userBtn");
  const dropdown = document.getElementById("userDropdown");
  const logout = document.getElementById("logout");
  //const changeAccount = document.getElementById("changeAccount");

  userBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Evita cierre inmediato
    userBtn.classList.toggle("active");
  });

  logout.addEventListener("click", logoutFunc);

  // changeAccount.addEventListener("click", () => {
  //   localStorage.removeItem("usuario");
  //   window.location.href = "../login.html";
  // });

  document.addEventListener("click", (e) => {
    if (!userBtn.contains(e.target) && !dropdown.contains(e.target)) {
      userBtn.classList.remove("active");
    }
  });
}

function inicializarSlider() {
  const slider = document.getElementById("slider");
  const toggleBtn = document.getElementById("toggle-btn");
  const homeBtn = document.getElementById("home-btn");

  // 🔹 Ocultar el slider
  homeBtn.addEventListener("click", () => {
    slider.classList.add("hidden");
  });

  // 🔹 Mostrar el slider
  toggleBtn.addEventListener("click", () => {
    slider.classList.remove("hidden");
  });

  const listaOpciones = document.getElementById("listaOpciones");

  listaOpciones.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;

    // Si es un botón con submenú (Reportes)
    if (li.classList.contains("has-submenu")) {
      e.preventDefault();
      e.stopPropagation();
      li.classList.toggle("active");
      return;
    }

    // Si tiene destino, redirige normalmente
    if (li.dataset.href) {
      window.location.href = li.dataset.href;
    }
  });
}

const mapas = [
  {
    nombre: "Huancayo",
    coordenadas: [-12.0651, -75.2049],
    nivelZoom: 13,
  },
  {
    nombre: "Junín",
    coordenadas: [-11.48, -74.98],
    nivelZoom: 10,
  },
];

const indexMap = 0;

// Crear mapa centrado en Junín
const map = L.map("visualizacion-mapa").setView(
  mapas[indexMap].coordenadas,
  mapas[indexMap].nivelZoom
);

// Capa base (OpenStreetMap)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// 🔹 Función para obtener sensores desde el backend
async function cargarSensores() {
  try {
    const res = await fetch("/api/sensores/");
    if (!res.ok) throw new Error("Error al obtener sensores");

    const data = await res.json();
    const { sensoresConCalidadAgua: sensores } = data;

    if (!Array.isArray(sensores) || sensores.length === 0) {
      alert("No se encontraron sensores registrados.");
      return;
    }

    sensores.forEach((s) => {
      // Ajusta los nombres de las propiedades según tu backend
      const { Nombre, Latitud, Longitud, CalidadAgua, Datos: datosSensor } = s;

      console.log(datosSensor);

      // Define color según la calidad
      const color =
        CalidadAgua === "Buena"
          ? "green"
          : CalidadAgua === "Regular"
          ? "orange"
          : "red";

      const marker = L.circleMarker([Latitud, Longitud], {
        color,
        radius: 10,
        fillOpacity: 0.8,
      }).addTo(map);

      marker.bindPopup(`
              <span>${Nombre}</span><br>
              Calidad del agua: <b style="color:${color}">${CalidadAgua}</b>
            `);

      marker.on("click", function () {
        obtenerDatosEstacion({
          ...s,
          color,
          datosSensor,
        });
      });
    });
  } catch (error) {
    console.error("❌ Error al cargar sensores:", error);
    alert("No se pudieron cargar los sensores. Revisa la consola.");
  }
}

(async () => {
  // mostrar sesión (rellena dropdown)
  const sesion = await getSesion();
  if (sesion.logeado) {
    document.getElementById("nombreUsuario").textContent = sesion.NombreUsuario;
  } else {
    document.getElementById("nombreUsuario").textContent = "Invitado";
  }

  inicializarMenuUsuario();
  inicializarSlider();

  // 🔸 Cargar sensores al iniciar la página
  cargarSensores();
})();
