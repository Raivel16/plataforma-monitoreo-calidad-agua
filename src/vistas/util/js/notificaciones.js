/* global sessionStorage */
// notificacion.js
const ALERTAS_VISTAS_KEY = "alertasVistas";
const ANIMACIONES_MOSTRADAS_KEY = "animacionesMostradas";

export class SistemaNotificaciones {
  constructor() {
    this.alertasPendientes = [];
    // alertasVistas se mantiene como arreglo para persistir; internamente usamos un Set
    this.alertasVistas = this.cargarAlertasVistas();
    this.alertasVistasSet = new Set(this.alertasVistas.map((v) => Number(v)));
    this.indicador = null;
    this.panel = null;
    // Verificar si es la primera carga de la sesión
    this.esPrimeraVez = !sessionStorage.getItem(ANIMACIONES_MOSTRADAS_KEY);
  }

  cargarAlertasVistas() {
    try {
      const vistas = localStorage.getItem(ALERTAS_VISTAS_KEY);
      const arr = vistas ? JSON.parse(vistas) : [];
      // normalizar a números y eliminar duplicados
      const normal = Array.from(new Set(arr.map((v) => Number(v))));
      return normal;
    } catch {
      return [];
    }
  }

  guardarAlertasVistas() {
    // Guardamos desde el Set para asegurarnos que no haya duplicados y estén normalizados
    const arr = Array.from(this.alertasVistasSet).map((v) => Number(v));
    localStorage.setItem(ALERTAS_VISTAS_KEY, JSON.stringify(arr));
    // mantener sincronizada la copia en this.alertasVistas
    this.alertasVistas = arr;
  }

  // helper: añadir una alerta al set y persistir
  marcarVistaLocal(alertaID) {
    const id = Number(alertaID);
    if (!this.alertasVistasSet.has(id)) {
      this.alertasVistasSet.add(id);
      this.guardarAlertasVistas();
    }
  }

  async inicializar() {
    this.crearIndicador();
    await this.cargarAlertasPendientes();
    this.escucharNuevasAlertas();
  }

  crearIndicador() {
    const userMenu = document.querySelector(".notif-badge");

    this.indicador = document.createElement("div");
    this.indicador.className = "notif-badge";
    this.indicador.style.cssText = `
      position: absolute;
      top: 0px;
      right: 0px;
      background: #ff4444;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: none;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: bold;
      cursor: pointer;
      z-index: 100;
    `;

    if (userMenu) {
      userMenu.style.position = "relative";
      userMenu.appendChild(this.indicador);
    } else {
      // Si no existe .user-menu, lo añadimos al body como fallback
      document.body.appendChild(this.indicador);
    }

    this.panel = document.createElement("div");
    this.panel.className = "notif-panel";
    this.panel.style.cssText = `
      position: fixed;
      top: 120px;
      right: 40px;
      width: 400px;
      max-height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      display: none;
      flex-direction: column;
      z-index: 1000;
      overflow: hidden;
    `;

    document.body.appendChild(this.panel);

    this.indicador.addEventListener("click", (e) => {
      e.stopPropagation();
      this.togglePanel();
    });

    // Delegación de eventos dentro del panel (evita re-adjuntar listeners constantemente)
    this.panel.addEventListener("click", (e) => {
      // botón "marcar todas"
      const btn = e.target.closest && e.target.closest("#marcar-todas-leidas");
      if (btn) {
        e.stopPropagation();
        this.marcarTodasLeidas();
        return;
      }

      // click en alerta
      const item = e.target.closest && e.target.closest(".alerta-item");
      if (item) {
        e.stopPropagation();
        const id = item.dataset.id;
        this.marcarComoLeida(id);
      }
    });

    document.addEventListener("click", (e) => {
      if (
        this.panel &&
        !this.panel.contains(e.target) &&
        !this.indicador.contains(e.target)
      ) {
        this.panel.style.display = "none";
      }
    });
  }

  async cargarAlertasPendientes() {
    try {
      const res = await fetch("/api/alertas/pendientes", {
        credentials: "same-origin",
      });

      if (!res.ok) {
        console.warn("Respuesta no OK al pedir pendientes:", res.status);
        return;
      }

      const alertas = await res.json();

      // Usar el Set para decidir cuáles mostrar (normalizamos IDs a Number)
      this.alertasPendientes = alertas.filter(
        (a) => !this.alertasVistasSet.has(Number(a.AlertaUsuarioID))
      );

      this.actualizarIndicador();

      // Solo mostrar animaciones en el primer inicio de sesión
      if (this.alertasPendientes.length > 0 && this.esPrimeraVez) {
        this.mostrarToasts();
        // Marcar que ya se mostraron las animaciones en esta sesión
        sessionStorage.setItem(ANIMACIONES_MOSTRADAS_KEY, "true");
        this.esPrimeraVez = false;
      }
    } catch (error) {
      console.error("Error al cargar alertas:", error);
    }
  }

  escucharNuevasAlertas() {
    if (typeof window.socket !== "undefined" && window.socket) {
      console.log("✅ Socket.io conectado - escuchando nuevas alertas");

      window.socket.on("nuevaAlerta", (alerta) => {
        console.log("📬 Nueva alerta recibida:", alerta);

        this.alertasPendientes.unshift(alerta);
        this.actualizarIndicador();
        this.mostrarToastIndividual(alerta);

        if (this.panel.style.display === "flex") {
          this.renderPanel();
        }
      });
    } else {
      console.warn(
        "⚠️ Socket.io no está disponible - notificaciones en tiempo real deshabilitadas"
      );
    }
  }

  actualizarIndicador() {
    const count = this.alertasPendientes.length;

    if (count > 0) {
      this.indicador.textContent = count > 9 ? "9+" : String(count);
      this.indicador.style.display = "flex";
    } else {
      this.indicador.style.display = "none";
    }
  }

  togglePanel() {
    const isVisible = this.panel.style.display === "flex";

    if (!isVisible) {
      this.renderPanel();
      this.panel.style.display = "flex";
    } else {
      this.panel.style.display = "none";
    }
  }

  renderPanel() {
    this.panel.innerHTML = `
      <div style="padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 16px;">Notificaciones (${
          this.alertasPendientes.length
        })</h3>
        ${
          this.alertasPendientes.length > 0
            ? `<button id="marcar-todas-leidas" style="background: #1f526b; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 12px;">Marcar todas como leídas</button>`
            : ""
        }
      </div>
      <div style="overflow-y: auto; flex: 1; padding: 10px;">
        ${
          this.alertasPendientes.length === 0
            ? '<p style="text-align: center; color: #999; padding: 20px;">No hay notificaciones pendientes</p>'
            : this.alertasPendientes.map((a) => this.renderAlerta(a)).join("")
        }
      </div>
    `;

    // No necesitamos adjuntar listeners individuales aquí (delegación en crearIndicador())
    // Pero dejamos esto por compatibilidad si se requiere (sin duplicar listeners)
  }

  renderAlerta(alerta) {
    let icono, color, titulo;

    if (alerta.tipo === "UMBRAL") {
      icono = "⚠️";
      color = "#ff9800";
      titulo = "Umbral Superado";
    } else if (alerta.tipo === "CONTAMINACION_CRITICA") {
      icono = "🚨";
      color = "#d32f2f";
      titulo = "Contaminación Crítica";
    } else {
      icono = "🔴";
      color = "#f44336";
      titulo = "Anomalía Detectada";
    }

    return `
      <div class="alerta-item" data-id="${alerta.AlertaUsuarioID}" style="
        padding: 12px;
        margin-bottom: 8px;
        border-left: 4px solid ${color};
        background: #f9f9f9;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s;
      " onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='#f9f9f9'">
        <div style="display: flex; align-items: start; gap: 10px;">
          <span style="font-size: 24px;">${icono}</span>
          <div style="flex: 1;">
            <div style="font-weight: bold; color: ${color}; margin-bottom: 4px;">
              ${titulo}
            </div>
            <div style="font-size: 13px; color: #555; margin-bottom: 4px;">
              ${alerta.SensorNombre || alerta.mensaje || ""}
            </div>
            <div style="font-size: 12px; color: #777;">
              ${alerta.NombreParametro || ""}: ${this.formatearValor(alerta)} ${
      alerta.UnidadMedida || ""
    }
            </div>
            ${
              alerta.contexto
                ? `<div style="font-size: 11px; color: #666; margin-top: 4px; font-style: italic;">${alerta.contexto}</div>`
                : ""
            }
            <div style="font-size: 11px; color: #999; margin-top: 4px;">
              ${
                alerta.Timestamp ||
                (alerta.FechaEnvio
                  ? new Date(alerta.FechaEnvio).toLocaleString()
                  : "")
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  mostrarToasts() {
    const toMostrar = this.alertasPendientes.slice(0, 3);

    toMostrar.forEach((alerta, index) => {
      setTimeout(() => {
        this.mostrarToastIndividual(alerta);
      }, index * 300);
    });
  }

  mostrarToastIndividual(alerta) {
    const toast = document.createElement("div");

    let icono, color, titulo;

    if (alerta.tipo === "UMBRAL") {
      icono = "⚠️";
      color = "#ff9800";
      titulo = "⚠️ Umbral Superado";
    } else if (alerta.tipo === "CONTAMINACION_CRITICA") {
      icono = "🚨";
      color = "#d32f2f";
      titulo = "🚨 Contaminación Crítica";
    } else {
      icono = "🔴";
      color = "#f44336";
      titulo = "🔴 Anomalía Detectada";
    }

    toast.style.cssText = `
      position: fixed;
      top: 120px;
      right: 20px;
      width: 350px;
      background: white;
      border-left: 4px solid ${color};
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 2000;
      animation: slideIn 0.3s ease-out;
    `;

    toast.innerHTML = `
      <div style="display: flex; gap: 10px; align-items: start;">
        <span style="font-size: 24px;">${icono}</span>
        <div style="flex: 1;">
          <div style="font-weight: bold; color: ${color}; margin-bottom: 5px;">
            ${titulo}
          </div>
          <div style="font-size: 13px; color: #555;">
            ${alerta.SensorNombre || alerta.mensaje || ""}
          </div>
          <div style="font-size: 12px; color: #777; margin-top: 4px;">
            ${alerta.NombreParametro || ""}: ${this.formatearValor(alerta)} ${
      alerta.UnidadMedida || ""
    }
          </div>
          ${
            alerta.contexto
              ? `<div style="font-size: 11px; color: #666; margin-top: 4px; font-style: italic;">${alerta.contexto}</div>`
              : ""
          }
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #999;">×</button>
      </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  formatearValor(alerta) {
    const valor =
      alerta.Valor ?? alerta.Valor_original ?? alerta.Valor_procesado;
    if (valor === null || valor === undefined) {
      return "N/A";
    }
    return Number(valor).toFixed(2);
  }

  async marcarComoLeida(alertaID) {
    const idNum = Number(alertaID);
    console.log(`📝 Marcando alerta ${idNum} como leída...`);

    // Si ya está en vistas locales -> solo actualizar UI (aseguramos consistencia)
    if (this.alertasVistasSet.has(idNum)) {
      this.alertasPendientes = this.alertasPendientes.filter(
        (a) => Number(a.AlertaUsuarioID) !== idNum
      );
      this.actualizarIndicador();
      this.renderPanel();
      return;
    }

    // Optimista: marcar localmente y actualizar UI ya
    this.marcarVistaLocal(idNum);

    // Quitar de pendientes y actualizar indicador y UI
    this.alertasPendientes = this.alertasPendientes.filter(
      (a) => Number(a.AlertaUsuarioID) !== idNum
    );
    this.actualizarIndicador();

    if (this.panel.style.display === "flex") {
      this.renderPanel();
    }

    // Remover elemento DOM con animación si existe
    const elemento = this.panel.querySelector(
      `.alerta-item[data-id="${idNum}"]`
    );
    if (elemento) {
      elemento.style.transition = "opacity 0.18s, transform 0.18s";
      elemento.style.opacity = "0";
      elemento.style.transform = "translateX(20px)";
      setTimeout(() => {
        if (elemento && elemento.parentElement) elemento.remove();
      }, 180);
    } else {
      // forzar render si no se encontró elemento
      this.renderPanel();
    }

    // Llamada al backend (no bloqueamos la UI)
    try {
      const response = await fetch(`/api/alertas/${idNum}/leer`, {
        method: "PATCH",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error(`Respuesta ${response.status}`);
      }

      console.log(`✅ Alerta ${idNum} marcada en backend`);
    } catch (error) {
      console.error("❌ Error al marcar alerta en backend:", error);
      // En caso de fallo, revertimos la marca local (opcional)
      // Aquí revertimos para mantener consistencia entre local y backend
      if (this.alertasVistasSet.has(idNum)) {
        this.alertasVistasSet.delete(idNum);
        this.guardarAlertasVistas();
      }
      // volver a traer la alerta del servidor sería ideal; por simplicidad la rehacemos fetch de pendientes
      await this.cargarAlertasPendientes();
      this.renderPanel();
    }
  }

  async marcarTodasLeidas() {
    if (this.alertasPendientes.length === 0) return;

    // Copia de pendientes actuales
    const pendientes = [...this.alertasPendientes];

    // Filtrar solo IDs que NO estén ya marcadas localmente
    const idsParaMarcar = pendientes
      .map((a) => Number(a.AlertaUsuarioID))
      .filter((id) => !this.alertasVistasSet.has(id));

    // Optimista: marcar localmente todos (añadir al set y persistir)
    idsParaMarcar.forEach((id) => this.alertasVistasSet.add(Number(id)));
    this.guardarAlertasVistas();

    // Vaciar pendientes y actualizar UI ya
    this.alertasPendientes = [];
    this.actualizarIndicador();
    this.renderPanel();

    // Enviar PATCHs en paralelo solo para los que no estaban marcados localmente
    try {
      const results = await Promise.all(
        idsParaMarcar.map((id) =>
          fetch(`/api/alertas/${id}/leer`, {
            method: "PATCH",
            credentials: "same-origin",
          })
        )
      );

      const anyFail = results.some((r) => !r.ok);
      if (anyFail) {
        throw new Error("Al menos una petición PATCH falló");
      }

      console.log(
        "✅ Todas las alertas marcadas en backend (por lote individual)"
      );
    } catch (error) {
      console.error("❌ Error marcando todas las alertas en backend:", error);
      // Revertir localmente si prefieres consistencia
      // Aquí decidimos revertir las IDs que fallaron (para no mentir al usuario)
      // Una estrategia posible: recargar pendientes del servidor para sincronizar
      await this.cargarAlertasPendientes();
      this.renderPanel();
    }
  }
}

/* estilos para toasts */
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
