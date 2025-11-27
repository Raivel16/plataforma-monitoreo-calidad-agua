import { inicializar } from "../util/js/inicializar.js";

document.addEventListener("DOMContentLoaded", async () => {
  await inicializar();

  // Verificar sesión (inicializar ya lo hace, pero para obtener el usuario)
  // inicializar guarda la sesion en una variable local en inicializar.js, pero no la exporta directamente
  // Sin embargo, inicializar.js exporta getSesion en sesion.js.
  // Podemos importar getSesion aquí también.
  const { getSesion } = await import("../util/js/sesion.js");
  const user = await getSesion();

  if (!user.logeado) {
    // Si no está logueado, inicializar ya maneja la UI, pero aquí podríamos redirigir o mostrar mensaje
    // El usuario dijo "La página puedes visualizar su comportamiento accediendo... e ingresando con las credenciales".
    // Asumimos que inicializar maneja el estado de invitado.
  }

  // Mostrar botón de admin solo si es admin (RolID 1 o permisos altos)
  if (user.RolID === 1 || user.NivelPermiso >= 4) {
    const btnMedir = document.getElementById("btnMedirPrecision");
    if (btnMedir) btnMedir.style.display = "block";
  }

  const buscarInput = document.getElementById("buscarSensor");
  const listaPredicciones = document.getElementById("listaPredicciones");
  const detalleContainer = document.getElementById("detallePrediccion");
  const resultadoCalidad = document.getElementById("resultadoCalidad");
  const explicacionPrediccion = document.getElementById(
    "explicacionPrediccion"
  );
  const riesgoPrediccion = document.getElementById("riesgoPrediccion");
  const btnGenerar = document.getElementById("btnGenerarPrediccion");
  const btnMedirPrecision = document.getElementById("btnMedirPrecision");

  let sensorSeleccionado = null;

  // ===============================
  //  MAPA
  // ===============================
  const mapas = [
    {
      nombre: "Huancayo",
      coordenadas: [-12.0651, -75.2049],
      nivelZoom: 13,
    },
  ];
  const indexMap = 0;

  // Asegurarse que el contenedor del mapa existe y tiene tamaño
  const mapContainer = document.querySelector(".pred-mapa");
  if (mapContainer) {
    const map = L.map("pred-mapa").setView(
      mapas[indexMap].coordenadas,
      mapas[indexMap].nivelZoom
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    cargarSensoresEnMapa(map);
  }

  async function cargarSensoresEnMapa(map) {
    try {
      const res = await fetch("/api/predicciones/mapa");
      if (!res.ok) throw new Error("Error al cargar sensores");
      const sensores = await res.json();

      sensores.forEach((s) => {
        const { Latitud, Longitud, Nombre, Prediccion } = s;
        let color = "#6c757d"; // Gris por defecto
        let claseColor = "";

        if (Prediccion) {
          if (Prediccion.ValorPredicho === "Buena") {
            color = "green";
            claseColor = "popup-buena";
          } else if (Prediccion.ValorPredicho === "Regular") {
            color = "orange";
            claseColor = "popup-regular";
          } else {
            color = "red";
            claseColor = "popup-mala";
          }
        }

        const marker = L.circleMarker([Latitud, Longitud], {
          color,
          radius: 10,
          fillOpacity: 0.8,
        }).addTo(map);

        marker.bindPopup(
          ` <span>${Nombre}</span><br>
          Calidad del agua: <b style="color:${color}">
            ${Prediccion ? Prediccion.ValorPredicho : "Sin predicción"}
          </b> `        
        );

        marker.on("click", () => {
          seleccionarSensor(s);
        });
      });

      // Guardar para búsqueda
      window.todosLosSensores = sensores;

      // Mensaje inicial
      const listaPredicciones = document.getElementById("listaPredicciones");
      if (listaPredicciones) {
        listaPredicciones.innerHTML =
          '<p id="mensaje-vacio" class="mensaje-vacio">Seleccione un sensor</p>';
      }
    } catch (error) {
      console.error("Error cargando mapa:", error);
    }
  }

  // 1. Cargar Sensores para el buscador (Autocompletado simple o lista)
  buscarInput.addEventListener("input", async (e) => {
    // Implementación simple
  });

  // Implementación simple de búsqueda: al presionar Enter o perder foco, si coincide exacto
  buscarInput.addEventListener("change", () => {
    const termino = buscarInput.value.toLowerCase();
    const sensores = window.todosLosSensores || [];
    const sensor = sensores.find((s) =>
      s.Nombre.toLowerCase().includes(termino)
    );
    if (sensor) {
      seleccionarSensor(sensor);
    } else {
      alert("Sensor no encontrado");
    }
  });

  async function seleccionarSensor(sensor) {
    sensorSeleccionado = sensor;
    buscarInput.value = sensor.Nombre;
    cargarHistorialPredicciones(sensor.SensorID);
  }

  async function cargarHistorialPredicciones(sensorId) {
    listaPredicciones.innerHTML = "Cargando...";
    detalleContainer.style.display = "none";

    try {
      const res = await fetch(`/api/predicciones?sensorId=${sensorId}`);
      if (!res.ok) throw new Error("Error al cargar predicciones");

      const predicciones = await res.json();

      listaPredicciones.innerHTML = "";
      if (predicciones.length === 0) {
        listaPredicciones.innerHTML = "<p>No hay predicciones recientes.</p>";
        return;
      }

      predicciones.forEach((p) => {
        const btn = document.createElement("button");
        const fecha = new Date(p.FechaHoraPrediccion).toLocaleString();
        btn.textContent = `${fecha} - ${p.ValorPredicho}`;
        btn.onclick = () => mostrarDetalle(p);
        listaPredicciones.appendChild(btn);
      });

      // Mostrar la más reciente por defecto
      mostrarDetalle(predicciones[0]);
    } catch (error) {
      console.error(error);
      listaPredicciones.innerHTML = "Error al cargar historial.";
    }
  }

  function mostrarDetalle(prediccion) {
    detalleContainer.style.display = "block";
    resultadoCalidad.textContent = `Calidad Pronosticada: ${prediccion.ValorPredicho}`;

    // Clases para color
    resultadoCalidad.className = "pred-resultado";
    if (prediccion.ValorPredicho === "Buena")
      resultadoCalidad.classList.add("buena");
    else if (prediccion.ValorPredicho === "Regular")
      resultadoCalidad.classList.add("regular");
    else resultadoCalidad.classList.add("mala");

    explicacionPrediccion.textContent =
      prediccion.Explicacion || "Sin explicación disponible.";
    riesgoPrediccion.textContent = prediccion.ProbabilidadRiesgo;
  }

  btnGenerar.addEventListener("click", async () => {
    if (!sensorSeleccionado) {
      document.getElementById("mensaje-vacio").style.color = "red";
      return;
    }

    try {
      const res = await fetch("/api/predicciones/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ SensorID: sensorSeleccionado.SensorID }),
      });

      if (res.ok) {
        const nuevaPrediccion = await res.json();
        cargarHistorialPredicciones(sensorSeleccionado.SensorID);
      } else {
        alert("Error al generar predicción.");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión.");
    }
  });

  btnMedirPrecision.addEventListener("click", async () => {
    if (!sensorSeleccionado) {
      alert("Seleccione un sensor primero.");
      return;
    }

    try {
      const res = await fetch(
        `/api/predicciones/precision?sensorId=${sensorSeleccionado.SensorID}`
      );
      const data = await res.json();
      alert(`Precisión: ${data.Precision}%\n${data.Mensaje}`);
    } catch (error) {
      console.error(error);
      alert("Error al medir precisión.");
    }
  });
});
