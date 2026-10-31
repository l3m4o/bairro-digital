let map;
let markers = [];
let usuarioAtual = null;

let relatos = [
  {
    id: 1,
    usuario: "João da Silva",
    categoria: "Buraco / Asfalto",
    cor: "Vermelho",
    gravidade: "Crítica",
    descricao: "Grande buraco na pista principal atrapalhando os veículos.",
    endereco: "Rua Marechal Deodoro, 500",
    lat: -25.4250000,
    lng: -49.2700000,
    origem: "MANUAL",
    status: "Em análise",
    data: "2026-03-28"
  },
  {
    id: 2,
    usuario: "Maria Oliveira",
    categoria: "Iluminação Pública",
    cor: "Amarelo",
    gravidade: "Média",
    descricao: "Poste com lâmpada queimada em frente à praça.",
    endereco: "Av. Sete de Setembro, 1200",
    lat: -25.4350000,
    lng: -49.2650000,
    origem: "GPS",
    status: "Aberto",
    data: "2026-03-29"
  },
  {
    id: 3,
    usuario: "Luiz Fernando",
    categoria: "Intulho no cantero",
    cor: "bege",
    gravidade: "muito baixo",
    descricao: "Esta tendo lixo acumulado no cantero.",
    endereco: "Av. Guaiapó, 826",
    lat:-23.4043371,
    lng:-51.9801587,
    origem:"GPS",
    status: "Em análise",
    data: "2026-08-19"
  }
];

window.onload = function() {
  initMap();
  atualizarInterface();
};

function initMap() {
  map = L.map('map').setView([-25.4289543, -49.2719342], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  renderizarMarcadores(relatos);
}

function renderizarMarcadores(lista) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  lista.forEach(relato => {
    let colorClass = getCorBadge(relato.categoria);
    let marker = L.circleMarker([relato.lat, relato.lng], {
      color: getHexCor(relato.categoria),
      fillColor: getHexCor(relato.categoria),
      fillOpacity: 0.8,
      radius: 10
    }).addTo(map);

    marker.bindPopup(`
      <strong>${relato.categoria}</strong><br>
      <p>${relato.descricao}</p>
      <small><strong>Local:</strong> ${relato.endereco}</small><br>
      <small><strong>Por:</strong> ${relato.usuario}</small>
    `);

    markers.push(marker);
  });
}

function getCorBadge(categoria) {
  if (categoria.includes("Buraco")) return "bg-vermelho";
  if (categoria.includes("Iluminação")) return "bg-amarelo";
  if (categoria.includes("Vazamento")) return "bg-verde";
  if (categoria.includes("lixo")) return "bg-bege";
  return "bg-bege";
}

function getHexCor(categoria) {
  if (categoria.includes("Buraco")) return "#ef4444";
  if (categoria.includes("Iluminação")) return "#f59e0b";
  if (categoria.includes("Vazamento")) return "#10b981";
  if (categoria.includes("lixo")) return "#ede8d0";
  return "#ede8d0";
}

function atualizarInterface() {
  const feedList = document.getElementById("feedList");
  feedList.innerHTML = "";

  relatos.forEach(r => {
    feedList.innerHTML += `
      <div class="card-relato">
        <div class="card-header">
          <span class="badge ${getCorBadge(r.categoria)}">${r.categoria}</span>
          <small>${r.status}</small>
        </div>
        <p><strong>${r.descricao}</strong></p>
        <small style="color: #64748b;">📍 ${r.endereco}</small>
      </div>
    `;
  });

  document.getElementById("statTotal").innerText = relatos.length;
  document.getElementById("statAnalise").innerText = relatos.filter(r => r.status === "Em análise").length;
  document.getElementById("statResolvidos").innerText = relatos.filter(r => r.status === "Resolvido").length;
}

function abrirModalAuth() { document.getElementById("modalAuth").style.display = "flex"; }
function fecharModalAuth() { document.getElementById("modalAuth").style.display = "none"; }
function abrirModalRelato() { document.getElementById("modalRelato").style.display = "flex"; }
function fecharModalRelato() { document.getElementById("modalRelato").style.display = "none"; }

function salvarAutenticacao(e) {
  e.preventDefault();
  usuarioAtual = document.getElementById("nomeUsuario").value;
  document.getElementById("btnAuth").innerText = `👤 ${usuarioAtual}`;
  fecharModalAuth();
}

function alternarOrigemLoc(tipo) {
  document.getElementById("groupEnderecoManual").style.display = tipo === 'MANUAL' ? 'block' : 'none';
}

function salvarRelato(e) {
  e.preventDefault();
  const categoria = document.getElementById("categoria").value;
  const descricao = document.getElementById("descricao").value;
  const origem = document.querySelector('input[name="origemLoc"]:checked').value;
  const enderecoManual = document.getElementById("enderecoProblema").value;

  const novoRelato = {
    id: relatos.length + 1,
    usuario: usuarioAtual || "Morador Anônimo",
    categoria: categoria,
    descricao: descricao,
    endereco: origem === "MANUAL" ? enderecoManual : "Localização GPS",
    lat: -25.4289543 + (Math.random() - 0.5) * 0.02,
    lng: -49.2719342 + (Math.random() - 0.5) * 0.02,
    origem: origem,
    status: "Aberto",
    data: new Date().toISOString().split('T')[0]
  };

  relatos.unshift(novoRelato);
  renderizarMarcadores(relatos);
  atualizarInterface();
  fecharModalRelato();
  document.getElementById("formRelato").reset();
}

function filtrarRelatos() {
  const cat = document.getElementById("categoriaFilter").value;
  const filtrados = cat === "TODAS" ? relatos : relatos.filter(r => r.categoria === cat);
  renderizarMarcadores(filtrados);
}