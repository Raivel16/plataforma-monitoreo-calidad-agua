import { logout as logoutFunc } from "./sesion.js";

// 🔹 Control del menú desplegable del usuario
export function inicializarMenuUsuario() {
  const userBtn = document.getElementById("userBtn");
  const dropdown = document.getElementById("userDropdown");
  const logout = document.getElementById("logout");
  //const changeAccount = document.getElementById("changeAccount");

  userBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Evita cierre inmediato
    userBtn.classList.toggle("active");
  });

  logout.addEventListener("click", logoutFunc);

  /*
        changeAccount.addEventListener("click", () => {
          localStorage.removeItem("usuario");
          window.location.href = "../login.html";
        });*/

  document.addEventListener("click", (e) => {
    if (!userBtn.contains(e.target) && !dropdown.contains(e.target)) {
      userBtn.classList.remove("active");
    }
  });
}
