const ALERTAS_VISTAS_KEY = "alertasVistas";

export class SistemaNotificaciones {
  constructor() {
    this.alertasPendientes = [];
    this.alertasVistas = this.cargarAlertasVistas();
    this.indicador = null;
    this.panel = null;
  }

  cargarAlertasVistas() {
    try {
      const vistas = localStorage.getItem(ALERTAS_VISTAS_KEY);
      return vistas ? JSON.parse(vistas) : [];
    } catch {
      return [];
    }
  }

  guardarAlertasVistas() {
    localStorage.setItem(ALERTAS_VISTAS_KEY, JSON.stringify(this.alertasVistas));
  }

  async inicializar() {
    this.crearIndicador();
    await this.cargarAlertasPendientes();
    this.escucharNuevasAlertas();
  }

  crearIndicador() {
    // Crear badge de notificaciones en el header
    const userMenu = document.querySelector(".user-menu");
    
    this.indicador = document.createElement("div");
    this.indicador.className = "notif-badge";
    this.indicador.style.cssText = `
      position: absolute;
      top: -5px;
      right: -5px;
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
    
    userMenu.style.position = "relative";
    userMenu.appendChild(this.indicador);

    // Crear panel de notificaciones
    this.panel = document.createElement("div");
    this.panel.className = "notif-panel";
    this.panel.style.cssText = `
      position: fixed;
      top: 70px;
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

    // Click en indicador abre/cierra panel
    this.indicador.addEventListener("click", (e) => {
      e.stopPropagation();
      this.togglePanel();
    });

    // Click fuera cierra panel
    document.addEventListener("click", (e) => {
      if (!this.panel.contains(e.target) && !this.indicador.contains(e.target)) {
        this.panel.style.display = "none";
      }
    });
  }

  async cargarAlertasPendientes() {
    try {
      const res = await fetch("/api/alertas/pendientes", {
        credentials: "same-origin",
      });

      if (!res.ok) return;

      const alertas = await res.json();
      
      // Filtrar solo las no vistas
      this.alertasPendientes = alertas.filter(
        (a) => !this.alertasVistas.includes(a.AlertaUsuarioID)
      );

      this.actualizarIndicador();
      
      // Mostrar notificaciones toast solo si hay nuevas
      if (this.alertasPendientes.length > 0) {
        this.mostrarToasts();
      }
    } catch (error) {
      console.error("Error al cargar alertas:", error);
    }
  }

  escucharNuevasAlertas() {
    window.addEventListener("nuevaAlerta", (event) => {
      const alerta = event.detail;
      
      // Solo si es para este usuario
      if (alerta.UsuarioID) {
        this.alertasPendientes.unshift(alerta);
        this.actualizarIndicador();
        this.mostrarToastIndividual(alerta);
      }
    });
  }

  actualizarIndicador() {
    const count = this.alertasPendientes.length;
    
    if (count > 0) {
      this.indicador.textContent = count > 9 ? "9+" : count;
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
        <h3 style="margin: 0; font-size: 16px;">Notificaciones (${this.alertasPendientes.length})</h3>
        ${this.alertasPendientes.length > 0 ? 
          `<button id="marcar-todas-leidas" style="background: #1f526b; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 12px;">Marcar todas como leídas</button>` 
          : ''}
      </div>
      <div style="overflow-y: auto; flex: 1; padding: 10px;">
        ${this.alertasPendientes.length === 0 
          ? '<p style="text-align: center; color: #999; padding: 20px;">No hay notificaciones pendientes</p>'
          : this.alertasPendientes.map(a => this.renderAlerta(a)).join('')
        }
      </div>
    `;

    // Event listener para marcar todas como leídas
    const btnMarcarTodas = this.panel.querySelector("#marcar-todas-leidas");
    if (btnMarcarTodas) {
      btnMarcarTodas.addEventListener("click", () => this.marcarTodasLeidas());
    }

    // Event listeners para cada alerta
    this.panel.querySelectorAll(".alerta-item").forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.dataset.id;
        this.marcarComoLeida(id);
      });
    });
  }

  renderAlerta(alerta) {
    const icono = alerta.tipo === "UMBRAL" ? "⚠️" : "🔴";
    const color = alerta.tipo === "UMBRAL" ? "#ff9800" : "#f44336";
    
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
              ${alerta.tipo === "UMBRAL" ? "Umbral Superado" : "Anomalía Detectada"}
            </div>
            <div style="font-size: 13px; color: #555; margin-bottom: 4px;">
              ${alerta.SensorNombre || alerta.mensaje}
            </div>
            <div style="font-size: 12px; color: #777;">
              ${alerta.NombreParametro}: ${Number(alerta.Valor_procesado || alerta.Valor).toFixed(2)} ${alerta.UnidadMedida}
            </div>
            <div style="font-size: 11px; color: #999; margin-top: 4px;">
              ${alerta.Timestamp || new Date(alerta.FechaEnvio).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  mostrarToasts() {
    // Mostrar máximo 3 toasts al cargar
    const toMostrar = this.alertasPendientes.slice(0, 3);
    
    toMostrar.forEach((alerta, index) => {
      setTimeout(() => {
        this.mostrarToastIndividual(alerta);
      }, index * 300);
    });
  }

  mostrarToastIndividual(alerta) {
    const toast = document.createElement("div");
    const icono = alerta.tipo === "UMBRAL" ? "⚠️" : "🔴";
    const color = alerta.tipo === "UMBRAL" ? "#ff9800" : "#f44336";

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
            ${alerta.tipo === "UMBRAL" ? "⚠️ Umbral Superado" : "🔴 Anomalía Detectada"}
          </div>
          <div style="font-size: 13px; color: #555;">
            ${alerta.SensorNombre || alerta.mensaje}
          </div>
          <div style="font-size: 12px; color: #777; margin-top: 4px;">
            ${alerta.NombreParametro}: ${Number(alerta.Valor_procesado || alerta.Valor).toFixed(2)} ${alerta.UnidadMedida}
          </div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #999;">×</button>
      </div>
    `;

    document.body.appendChild(toast);

    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  async marcarComoLeida(alertaID) {
    try {
      await fetch(`/api/alertas/${alertaID}/leer`, {
        method: "PATCH",
        credentials: "same-origin",
      });

      // Agregar a vistas
      this.alertasVistas.push(parseInt(alertaID));
      this.guardarAlertasVistas();

      // Remover de pendientes
      this.alertasPendientes = this.alertasPendientes.filter(
        (a) => a.AlertaUsuarioID !== parseInt(alertaID)
      );

      this.actualizarIndicador();
      this.renderPanel();
    } catch (error) {
      console.error("Error al marcar alerta:", error);
    }
  }

  async marcarTodasLeidas() {
    const promises = this.alertasPendientes.map((a) =>
      this.marcarComoLeida(a.AlertaUsuarioID)
    );

    await Promise.all(promises);
  }
}

// Agregar estilos de animación
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