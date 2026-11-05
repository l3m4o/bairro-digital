const API_BASE = "/api";

// Centraliza requisições para manter sessão por cookie e padronizar erros da API.
async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    }
  });
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    const error = new Error(body?.message || body?.error || "Não foi possível concluir a operação.");
    error.status = response.status;
    throw error;
  }
  return body;
}

const BairroService = {
  // Consultas públicas não exigem sessão; a autorização é feita pelo backend.
  listReports() { return apiRequest("/reports"); },
  getReport(id) { return apiRequest(`/reports/${encodeURIComponent(id)}`); },
  getCurrentUser() {
    return apiRequest("/auth/me").catch((error) => {
      if (error.status === 401 || error.status === 403) return null;
      throw error;
    });
  },
  login(username, password) {
    return apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
  },
  // O encerramento da sessão depende da invalidação do cookie no servidor.
  logout() { return apiRequest("/auth/logout", { method: "POST" }); },
  register(user) {
    const body = new FormData();
    Object.entries(user).forEach(([key, value]) => body.append(key, value));
    return apiRequest("/auth/register", { method: "POST", body });
  },
  createReport(report) {
    return apiRequest("/reports", { method: "POST", body: report });
  },
  // A API deve alternar a curtida do usuário autenticado sem duplicá-la.
  likeReport(id) {
    return apiRequest(`/reports/${encodeURIComponent(id)}/like`, { method: "POST" });
  },
  getAdminSession() {
    return apiRequest("/admin/auth/me").catch((error) => {
      if (error.status === 401 || error.status === 403) return null;
      throw error;
    });
  },
  adminLogin(username, password) {
    return apiRequest("/admin/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
  },
  // Operações administrativas só ficam disponíveis após autorização do servidor.
  adminReports() { return apiRequest("/admin/reports"); }
};
