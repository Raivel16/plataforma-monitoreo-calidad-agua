import { filtrarDatos, init } from "./tablaGenerica.js";
import { inicializar } from "../util/js/inicializar.js";

await inicializar();

const apiUrl = "http://localhost:3000/api/parametros/";

init({
  apiUrl: apiUrl,
  selectorTbody: "#tablaSensores tbody",
  mapearFilaFn: (lectura) => `
              <tr>
                <td>${lectura.ParametroID ?? "-"}</td>
                <td >${lectura.NombreParametro ?? "-"}</td>
                <td> ${lectura.UnidadMedida ?? "-"}</td>
              </tr>
            `,
});

document.getElementById("btn-buscar").addEventListener("click", async () => {
  const filtro = document.getElementById("input-busqueda").value.trim();
  await filtrarDatos(filtro, apiUrl);
});
