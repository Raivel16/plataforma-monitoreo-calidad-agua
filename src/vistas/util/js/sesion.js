const authApi = "/api/auth";

// --- Logout (tu función) ---
export async function logout() {
  await fetch(`${authApi}/logout`, {
    method: "POST",
    credentials: "same-origin",
  });
  sessionStorage.removeItem("animacionesMostradas");
  window.location.href = "/";
}

// --- Obtener sesión ---
export async function getSesion() {
  try {
    const res = await fetch(`${authApi}/session`, {
      credentials: "same-origin",
    });

    if (res.status === 401) return { logeado: false };
    if (!res.ok) return { logeado: false };
    return await res.json();
  } catch (err) {
    console.error("Error al obtener sesión:", err);
    return { logeado: false };
  }
}
