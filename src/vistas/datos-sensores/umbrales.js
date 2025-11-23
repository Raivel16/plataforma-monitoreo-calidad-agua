import { filtrarDatos, init } from "../util/js/tablaGenerica.js";
import {
  inicializar,
  ocultarSubSeccionesDatosSensores,
} from "../util/js/inicializar.js";

await inicializar();

const apiUrl = "http://localhost:3000/api/umbrales/";

init({
  apiUrl,
  selectorTbody: "#tablaSensores tbody",
  mapearFilaFn: (umbral) => `
              <tr>
                <td>${umbral.UmbralID ?? "-"}</td>
                <td>${umbral.NombreParametro ?? "-"}</td>
                <td>${umbral.UnidadMedida ?? "-"}</td>
                <td>${umbral.ValorCritico ?? "-"}</td>
                <td>${umbral.TipoUmbral ?? "-"}</td>
                <td>${umbral.MensajeAlerta ?? "-"}</td>
              </tr>
            `,
});

document.getElementById("btn-buscar").addEventListener("click", async () => {
  const filtro = document.getElementById("input-busqueda").value.trim();
  await filtrarDatos(filtro, apiUrl);
});

ocultarSubSeccionesDatosSensores();
