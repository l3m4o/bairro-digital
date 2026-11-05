(function () {
  // Cada página usa data-page para ativar somente o fluxo correspondente.
  const page = document.body.dataset.page;
  const $ = (selector) => document.querySelector(selector);
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
  const initials = (name = "") => name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  const errorMessage = (error) => error?.message || "Não foi possível concluir a operação.";
  const safeRedirect = (value) => {
    if (!value || value.startsWith("//") || /^[a-z][a-z\d+\-.]*:/i.test(value)) {
      return "index.html";
    }
    return value.startsWith("/") ? value.slice(1) : value;
  };
  const gravityClass = (report) => {
    // Denúncias sem classificação não recebem marcador no mapa.
    const value = String(report.gravityClass || "").toLowerCase();
    const classes = {
      baixa: "low",
      low: "low",
      moderada: "moderate",
      moderate: "moderate",
      media: "medium",
      médio: "medium",
      medium: "medium",
      perigosa: "high",
      high: "high"
    };
    return classes[value] || null;
  };

  function initializeBrandFallback() {
    document.querySelectorAll(".brand-logo").forEach((logo) => {
      // O fallback textual evita uma marca quebrada quando a imagem oficial não existe.
      const showFallback = () => {
        logo.hidden = true;
        logo.nextElementSibling.hidden = false;
      };

      logo.addEventListener("error", showFallback, { once: true });
      if (logo.complete && logo.naturalWidth === 0) {
        showFallback();
      }
    });
  }

  async function syncAuthUI() {
    // O texto do acesso acompanha a sessão real retornada pela API.
    let user = null;

    try {
      user = await BairroService.getCurrentUser();
    } catch (error) {
      document.querySelectorAll("[data-auth-link]").forEach((link) => {
        link.title = errorMessage(error);
      });
    }

    document.querySelectorAll("[data-auth-link]").forEach((link) => {
      link.textContent = user ? "Sair" : "Entrar";
      link.href = user ? "#" : "login.html";
      link.dataset.logout = user ? "true" : "false";
    });

    document.querySelectorAll("[data-auth-link][data-logout='true']").forEach((link) => {
      link.addEventListener("click", async (event) => {
        event.preventDefault();

        try {
          await BairroService.logout();
          location.href = "index.html";
        } catch (error) {
          link.textContent = errorMessage(error);
        }
      });
    });

  }

  function reportLink(report) {
    // A listagem pública mostra apenas o relato; o endereço fica nos detalhes.
    return `<a class="report-item" href="denuncia.html?id=${encodeURIComponent(report.id)}">
      <p>${escapeHtml(report.description)}</p>
    </a>`;
  }

  async function renderHome() {
    // O mapa é ilustrativo; o fallback local não participa de autenticação ou persistência.
    const list = $("#report-list");

    try {
      const reports = await BairroService.listReports();
      renderReports(reports);
    } catch (error) {
      renderReports(DEMO_REPORTS);
      $("#demo-notice").hidden = false;
    }
  }

  function renderReports(reports) {
    const list = $("#report-list");
    $("#report-count").textContent = reports.length;
    list.innerHTML = reports.length
      ? reports.map(reportLink).join("")
      : '<p class="empty-state">Ainda não há denúncias publicadas.</p>';

    reports.forEach((report, index) => {
      const markerClass = gravityClass(report);
      if (!markerClass) {
        return;
      }

      const marker = document.createElement("a");
      marker.className = `map-marker ${markerClass}`;
      marker.href = `denuncia.html?id=${encodeURIComponent(report.id)}`;
      marker.style.left = `${25 + (index * 17) % 58}%`;
      marker.style.top = `${28 + (index * 19) % 50}%`;
      marker.title = `${report.category}: ${report.description} (${report.address})`;
      marker.setAttribute("aria-label", `Abrir denúncia: ${report.description}`);
      marker.textContent = "!";
      $("#map-canvas").appendChild(marker);
    });
  }

  async function protectPage() {
    // Protege ações de morador sem substituir a autorização obrigatória do backend.
    let user;

    try {
      user = await BairroService.getCurrentUser();
    } catch (error) {
      const errorTarget = $("#report-detail") || $("#profile-card") || $("#report-error");
      if (errorTarget) {
        errorTarget.textContent = errorMessage(error);
      }
      return null;
    }

    if (!user) {
      const currentPage = `${location.pathname.split("/").pop()}${location.search}`;
      location.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
      return null;
    }

    return user;
  }

  async function getDetailSession() {
    // Detalhes aceitam sessão de morador ou administrativa, ambas validadas pelo servidor.
    const user = await BairroService.getCurrentUser();
    if (user) {
      return { type: "user" };
    }

    const admin = await BairroService.getAdminSession();
    return admin ? { type: "admin" } : null;
  }

  function renderComments(comments) {
    // Comentários só são exibidos quando vierem no payload autenticado da denúncia.
    if (!Array.isArray(comments)) {
      return `
        <section class="comments-section" aria-labelledby="comments-title">
          <h2 id="comments-title">Comentários</h2>
          <p class="empty-state">Os comentários serão exibidos quando forem disponibilizados pela API.</p>
        </section>`;
    }

    if (!comments.length) {
      return `
        <section class="comments-section" aria-labelledby="comments-title">
          <h2 id="comments-title">Comentários</h2>
          <p class="empty-state">Ainda não há comentários nesta denúncia.</p>
        </section>`;
    }

    return `
      <section class="comments-section" aria-labelledby="comments-title">
        <h2 id="comments-title">Comentários</h2>
        <div class="comments-list">
          ${comments.map((comment) => `
            <article class="comment">
              <strong>${escapeHtml(comment.author?.name || "Autor não informado")}</strong>
              ${comment.createdAt ? `<time datetime="${escapeHtml(comment.createdAt)}">${escapeHtml(comment.createdAt)}</time>` : ""}
              <p>${escapeHtml(comment.text || comment.description || "")}</p>
            </article>`).join("")}
        </div>
      </section>`;
  }

  async function renderDetail() {
    // Visitantes precisam autenticar antes de consultar detalhes e comentários.
    let session;
    try {
      session = await getDetailSession();
    } catch (error) {
      $("#report-detail").innerHTML = `<p class="empty-state">${escapeHtml(errorMessage(error))}</p>`;
      return;
    }

    if (!session) {
      const currentPage = `${location.pathname.split("/").pop()}${location.search}`;
      location.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
      return;
    }

    const id = new URLSearchParams(location.search).get("id");
    if (!id) {
      $("#report-detail").innerHTML = '<p class="empty-state">O identificador da denúncia não foi informado.</p>';
      return;
    }

    try {
      const report = await BairroService.getReport(id);
      const author = report.author || {};
      const canLike = session.type === "user";
      const gravity = report.gravity || "Gravidade ainda não atribuída";
      const likeLabel = report.userLiked ? "Remover curtida" : "Curtir";

      $("#report-detail").innerHTML = `
        <div class="detail-header"><a href="index.html">Voltar ao mapa</a></div>
        <article class="panel detail-card">
          <div class="author">
            <div class="avatar">${escapeHtml(initials(author.name))}</div>
            <div>
              <strong>${escapeHtml(author.name || "Autor não informado")}</strong>
              <p>Relato publicado na cidade</p>
            </div>
          </div>
          <p class="eyebrow">Relato público</p>
          <p class="detail-description">${escapeHtml(report.description)}</p>
          <div class="detail-address">Endereço: ${escapeHtml(report.address)}</div>
          <div class="detail-actions">
            <span class="status ${escapeHtml(report.statusClass || "")}">${escapeHtml(report.status || "Status não informado")}</span>
            <span class="status">${escapeHtml(gravity)}</span>
            ${canLike ? `<button type="button" data-like aria-pressed="${Boolean(report.userLiked)}" aria-label="${likeLabel}">
              ${likeLabel} <span>${Number(report.likes || 0)}</span>
            </button>` : ""}
            <button type="button" data-share>Compartilhar</button>
          </div>
          <p class="form-error" id="detail-message" role="status"></p>
        </article>
        ${renderComments(report.comments)}`;

      $("[data-like]")?.addEventListener("click", async (event) => {
        // Contagem e estado permanecem sob controle da API.
        try {
          const result = await BairroService.likeReport(report.id);
          if (result && result.likes !== undefined) {
            event.currentTarget.querySelector("span").textContent = Number(result.likes);
          }
          if (result && result.userLiked !== undefined) {
            const label = result.userLiked ? "Remover curtida" : "Curtir";
            event.currentTarget.firstChild.textContent = `${label} `;
            event.currentTarget.setAttribute("aria-label", label);
            event.currentTarget.setAttribute("aria-pressed", String(Boolean(result.userLiked)));
          }
        } catch (error) {
          $("#detail-message").textContent = errorMessage(error);
        }
      });

      $("[data-share]").addEventListener("click", async () => {
        const message = $("#detail-message");

        try {
          const relativeUrl = `denuncia.html?id=${encodeURIComponent(report.id)}`;
          if (!/^https?:$/.test(location.protocol)) {
            throw new Error("O compartilhamento estará disponível quando o site estiver publicado.");
          }
          const shareUrl = new URL(relativeUrl, location.href).href;
          await navigator.clipboard.writeText(shareUrl);
          message.textContent = "Link copiado para a área de transferência.";
        } catch (error) {
          message.textContent = errorMessage(error);
        }
      });
    } catch (error) {
      $("#report-detail").innerHTML = `<p class="empty-state">${escapeHtml(errorMessage(error))}</p>`;
    }
  }

  function bindLogin() {
    // O redirect retorna o usuário à denúncia solicitada após o login.
    $("#login-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);

      try {
        await BairroService.login(form.get("username").trim(), form.get("password"));
        const redirect = new URLSearchParams(location.search).get("redirect");
        location.href = safeRedirect(redirect);
      } catch (error) {
        $("#login-error").textContent = errorMessage(error);
      }
    });
  }

  function bindRegister() {
    // A foto de perfil é opcional e só é usada para pré-visualização local.
    const photoInput = document.querySelector("[name='photo']");
    const preview = $("#photo-preview");
    let previewUrl = null;

    photoInput.addEventListener("change", () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const file = photoInput.files[0];
      preview.hidden = !file;
      previewUrl = file ? URL.createObjectURL(file) : null;
      if (previewUrl) {
        preview.src = previewUrl;
      }
    });

    $("#register-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);

      try {
        const user = {
          name: form.get("name").trim(),
          username: form.get("username").trim(),
          password: form.get("password")
        };
        if (photoInput.files[0]) {
          user.photo = photoInput.files[0];
        }
        await BairroService.register(user);
        location.href = "index.html";
      } catch (error) {
        $("#register-error").textContent = errorMessage(error);
      }
    });
  }

  async function bindReportForm() {
    // Descrição, endereço e foto são enviados; a gravidade é definida pela administração.
    if (!await protectPage()) {
      return;
    }

    $("#report-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      if (!form.get("photo")?.name) {
        $("#report-error").textContent = "A foto da denúncia é obrigatória.";
        return;
      }

      try {
        await BairroService.createReport(form);
        location.href = "conta.html";
      } catch (error) {
        $("#report-error").textContent = errorMessage(error);
      }
    });
  }

  async function renderAccount() {
    // Perfil e denúncias são dados do servidor, sem armazenamento local de negócio.
    const user = await protectPage();
    if (!user) {
      return;
    }

    $("#profile-card").innerHTML = `
      <div class="avatar">${escapeHtml(initials(user.name))}</div>
      <h2>${escapeHtml(user.name)}</h2>
      <p>@${escapeHtml(user.username)}</p>`;

    try {
      const reports = (await BairroService.listReports())
        .filter((report) => report.authorId === user.id);
      $("#my-reports").innerHTML = reports.length
        ? reports.map((report) => `
          <div class="my-report">
            <p>${escapeHtml(report.description)}</p>
            <span class="status ${escapeHtml(report.statusClass || "")}">${escapeHtml(report.status)}</span>
          </div>`).join("")
        : '<p class="empty-state">Você ainda não registrou denúncias.</p>';
    } catch (error) {
      $("#my-reports").innerHTML = `<p class="empty-state">${escapeHtml(errorMessage(error))}</p>`;
    }
  }

  function renderHelp() {
    // A página de ajuda é estática e não depende de autenticação.
    $("#help-list").innerHTML = HELP_CATEGORIES.map((item) => `
      <article class="help-card">
        <h2>${escapeHtml(item[0])}</h2>
        <p>${escapeHtml(item[1])}</p>
        <strong>Órgão responsável: ${escapeHtml(item[2])}</strong>
      </article>`).join("");
  }

  async function renderAdmin() {
    // A tela só renderiza o painel após a sessão administrativa ser autorizada pela API.
    let session = null;

    try {
      session = await BairroService.getAdminSession();
    } catch (error) {
      $("main").innerHTML = `<p class="empty-state">${escapeHtml(errorMessage(error))}</p>`;
      return;
    }

    if (!session) {
      $("main").innerHTML = `
        <section class="auth-card admin-login" aria-labelledby="admin-login-title">
          <p class="eyebrow">Acesso restrito</p>
          <h1 id="admin-login-title">Entrar na administração</h1>
          <p class="muted">Esta área é exclusiva para a equipe responsável pelas denúncias.</p>
          <form id="admin-login-form" class="form-stack">
            <label for="admin-username">Nome de usuário</label>
            <input id="admin-username" name="username" required autocomplete="username">
            <label for="admin-password">Senha</label>
            <input id="admin-password" name="password" type="password" required autocomplete="current-password">
            <p class="form-error" id="admin-login-error" role="alert"></p>
            <button class="button button-full" type="submit">Acessar painel</button>
          </form>
        </section>`;

      $("#admin-login-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);

        try {
          await BairroService.adminLogin(form.get("username").trim(), form.get("password"));
          location.reload();
        } catch (error) {
          $("#admin-login-error").textContent = errorMessage(error);
        }
      });
      return;
    }

    try {
      const reports = await BairroService.adminReports();
      const draw = (filter) => {
        // O filtro atua apenas sobre dados já autorizados e retornados pelo backend.
        $("#admin-reports").innerHTML = reports
          .filter((report) => filter === "todas" || report.statusClass === filter)
          .map((report) => `
            <tr>
              <td>${escapeHtml(report.description)}</td>
              <td>${escapeHtml(report.address)}</td>
              <td>${escapeHtml(report.gravity)}</td>
              <td>${escapeHtml(report.status)}</td>
              <td><a href="denuncia.html?id=${encodeURIComponent(report.id)}">Ver</a></td>
            </tr>`).join("");
      };

      draw("todas");
      $("#admin-filter").addEventListener("change", (event) => draw(event.target.value));
    } catch (error) {
      $("#admin-reports").innerHTML = `<tr><td colspan="5">${escapeHtml(errorMessage(error))}</td></tr>`;
    }
  }

  // Inicializa recursos comuns antes do fluxo específico da página.
  initializeBrandFallback();
  syncAuthUI();

  if (page === "inicio") renderHome();
  if (page === "denuncia") renderDetail();
  if (page === "login") bindLogin();
  if (page === "cadastro") bindRegister();
  if (page === "nova-denuncia") bindReportForm();
  if (page === "conta") renderAccount();
  if (page === "ajuda") renderHelp();
  if (page === "admin") renderAdmin();
})();
