export function inicializarSlider() {
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