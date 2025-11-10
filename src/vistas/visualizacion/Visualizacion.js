import { inicializar } from "../util/js/inicializar.js";

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
  await inicializar();

  // 🔸 Cargar sensores al iniciar la página
  cargarSensores();
})();
