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

const map = L.map("visualizacion-mapa").setView(
  mapas[indexMap].coordenadas,
  mapas[indexMap].nivelZoom
);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// ===============================
//  MOSTRAR DATOS EN PANEL
// ===============================
function obtenerDatosEstacion({
  Nombre,
  CalidadAgua,
  color,
  EstadoOperativo,
  datosSensor,
} = {}) {
  const nombreEstacion = document.getElementById("nombre-estacion");
  const ultimaLectura = document.getElementById("ultima-lectura");
  const datoPh = document.getElementById("dato-ph");
  const datoTurbidez = document.getElementById("dato-turbidez");
  const datoOxigeno = document.getElementById("dato-oxigeno");
  const datoConductividad = document.getElementById("dato-conductividad");
  const datoTemperatura = document.getElementById("dato-temperatura");

  nombreEstacion.textContent = Nombre ?? "No disponible";

  // ⇨ Mostrar "No activo" si está desactivado
  const textoCalidad =
    EstadoOperativo === false ? "No activo" : CalidadAgua ?? "Sin datos";

  ultimaLectura.textContent = textoCalidad;
  ultimaLectura.style.color = EstadoOperativo === false ? "#495057" : color;

  // Extraer parámetros
  const ph = datosSensor.find((d) => d.ParametroID === 1);
  const turbidez = datosSensor.find((d) => d.ParametroID === 2);
  const oxigenoDisuelto = datosSensor.find((d) => d.ParametroID === 3);
  const conductividad = datosSensor.find((d) => d.ParametroID === 4);
  const temperatura = datosSensor.find((d) => d.ParametroID === 5);

  // Si está desactivado → mostrar “--”
  if (EstadoOperativo === false) {
    datoPh.textContent =
      datoTurbidez.textContent =
      datoOxigeno.textContent =
      datoConductividad.textContent =
      datoTemperatura.textContent =
        "--";
    return;
  }

  // Si está activo → mostrar valores
  datoPh.textContent = ph?.Valor_procesado ?? "--";
  datoTurbidez.textContent = turbidez?.Valor_procesado ?? "--";
  datoOxigeno.textContent = oxigenoDisuelto?.Valor_procesado ?? "--";
  datoConductividad.textContent = conductividad?.Valor_procesado ?? "--";
  datoTemperatura.textContent = temperatura?.Valor_procesado ?? "--";
}

// ===============================
//  CARGAR SENSORES
// ===============================
async function cargarSensores() {
  try {
    const res = await fetch("/api/sensores/visualizacion", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Error al obtener sensores");

    const data = await res.json();
    const { sensoresConCalidadAgua: sensores } = data;

    if (!Array.isArray(sensores) || sensores.length === 0) {
      alert("No se encontraron sensores registrados.");
      return;
    }

    sensores.forEach((s) => {
      const {
        Nombre,
        Latitud,
        Longitud,
        CalidadAgua,
        EstadoOperativo,
        Datos: datosSensor,
      } = s;

      // ===============================
      //  DEFINIR COLOR DEL MARCADOR
      // ===============================
      let color;

      if (EstadoOperativo === false) {
        // Sensor desactivado → gris oscuro
        color = "#495057";
      } else if (CalidadAgua === null) {
        // Sensor sin datos → gris claro
        color = "#6c757d";
      } else if (CalidadAgua === "Buena") {
        color = "green";
      } else if (CalidadAgua === "Regular") {
        color = "orange";
      } else {
        color = "red";
      }

      // Texto para popup según estado
      const textoCalidad =
        EstadoOperativo === false ? "No activo" : CalidadAgua ?? "Sin datos";

      const marker = L.circleMarker([Latitud, Longitud], {
        color,
        radius: 10,
        fillOpacity: 0.8,
      }).addTo(map);

      marker.bindPopup(`
          <span>${Nombre}</span><br>
          Calidad del agua: <b style="color:${color}">
            ${textoCalidad}
          </b>
      `);

      marker.on("click", function () {
        obtenerDatosEstacion({
          ...s,
          color,
          EstadoOperativo,
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
  cargarSensores();
})();
