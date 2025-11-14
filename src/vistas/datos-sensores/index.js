// import { init, conectarSocket } from "./datSensor.js";
// import { inicializar } from "../util/js/inicializar.js";

// init({ apiUrl: "http://localhost:3000/api/datos/ultimos" });

// await inicializar();
// conectarSocket();

import { init, conectarSocket } from "./tablaGenerica.js";
import { inicializar } from "../util/js/inicializar.js";

await inicializar();

init({
  apiUrl: "http://localhost:3000/api/datos/ultimos",
  selectorTbody: "#tablaSensores tbody",
  mapearFilaFn: (lectura) => `
              <tr>
                <td>${lectura.DatoID ?? "-"}</td>
                <td data-sensorId="${lectura.SensorID}">${
    lectura.Nombre ?? "-"
  }</td>
                <td> ${lectura.Descripcion ?? "-"}</td>
                <td data-parametroId="${lectura.ParametroID}">${
    lectura.NombreParametro ?? "-"
  }</td>
                <td>${lectura.UnidadMedida ?? "-"}</td>
                <td>${lectura.TimestampRegistro ?? "-"}</td>
                <td>${lectura.TimestampEnvio ?? "-"}</td>
                <td>${lectura.Valor_original.toFixed(4) ?? "-"}</td>
                <td>${lectura.Valor_procesado.toFixed(4) ?? "-"}</td>
                <td>${lectura.Valor_normalizado.toFixed(4) ?? "-"}</td>
              </tr>
            `,
});

conectarSocket();
