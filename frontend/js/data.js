// Conteúdo editorial da ajuda; contatos operacionais não são usados como autorização.
const HELP_CATEGORIES = [
  ["Vazamentos de água", "Registre o local e, se possível, a origem do vazamento.", "Sanepar · 0800 200 0115"],
  ["Problemas nas ruas", "Informe o endereço, o tipo de dano e se há risco imediato.", "Prefeitura · 156"],
  ["Iluminação pública", "Descreva o poste e o trecho que está sem iluminação.", "Prefeitura · 156"],
  ["Lixo e descarte irregular", "Fotografe o ponto e indique o endereço completo.", "Prefeitura · 156"],
  ["Sinalização e semáforos", "Relate a sinalização danificada e o cruzamento.", "Semob · 156"],
  ["Outros problemas urbanos", "Explique a situação e informe como ela afeta o bairro.", "Bairro Digital · registre uma denúncia"]
];

// Registros locais temporários, usados somente quando a API pública está indisponível.
const DEMO_REPORTS = [
  {
    id: "demo-iluminacao-zona-7",
    category: "Iluminação pública",
    gravity: "Baixa",
    gravityClass: "low",
    description: "Uma luminária de poste está apagada durante a noite.",
    address: "Rua das Palmeiras, Zona 7",
    isDemo: true
  },
  {
    id: "demo-calcadas-zona-5",
    category: "Calçadas",
    gravity: "Moderada",
    gravityClass: "moderate",
    description: "Calçada com rachaduras e pequenos desníveis, dificultando a passagem de pedestres.",
    address: "Avenida das Grevíleas, Zona 5",
    isDemo: true
  },
  {
    id: "demo-descarte-jardim-alvorada",
    category: "Descarte irregular de lixo",
    gravity: "Média",
    gravityClass: "medium",
    description: "Acúmulo de sacos de lixo e resíduos em um terreno vazio.",
    address: "Rua dos Ipês, Jardim Alvorada",
    isDemo: true
  },
  {
    id: "demo-asfalto-zona-1",
    category: "Asfalto e vias públicas",
    gravity: "Perigosa",
    gravityClass: "high",
    description: "Buraco profundo na pista, oferecendo risco para veículos e motociclistas.",
    address: "Avenida Brasil, Zona 1",
    isDemo: true
  },
  {
    id: "demo-sinalizacao-zona-6",
    category: "Sinalização de trânsito",
    gravity: "Média",
    gravityClass: "medium",
    description: "Placa de trânsito danificada e parcialmente ilegível.",
    address: "Avenida Colombo, Zona 6",
    isDemo: true
  }
];
