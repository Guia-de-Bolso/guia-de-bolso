/**
 * Completa perfis pausados: tags, subcategoria (surf) e contatos públicos verificados.
 * Não altera status nem fotos (sem fonte licenciada).
 *
 * Uso: node --env-file=.env.local scripts/apply-complete-pausados.mjs
 */

/** @type {Array<{
 *   slug: string,
 *   subcategoria?: string,
 *   tags?: string[],
 *   telefone?: string,
 *   instagram?: string,
 *   site_url?: string,
 *   cardapio_url?: string,
 * }>} */
export const COMPLETE_PAUSADOS_LOTE_1 = [
  // —— Aventura / Surf (corrige subcategoria + tags de Surf)
  {
    slug: "alaia-surf",
    subcategoria: "Surf",
    tags: ["Escola de surf", "Aulas de surf", "Aluguel de prancha", "Surfe", "Prancha soft"],
  },
  {
    slug: "kite-surf-ibiraquera",
    subcategoria: "Surf",
    tags: ["Escola de surf", "Aulas de surf", "Aluguel de prancha", "Surfe"],
  },
  // —— Aventura / Esportes radicais (kite, cavalgada, SUP)
  {
    slug: "escola-ktavento",
    tags: ["Com guia", "Reserva necessária", "Treinamento incluso", "Aventura radical"],
  },
  {
    slug: "ikc-ibiraquera-kite-center",
    tags: ["Com guia", "Reserva necessária", "Treinamento incluso", "Aventura radical"],
  },
  {
    slug: "cavalgadas-rosa-norte",
    tags: ["Com guia", "Reserva necessária"],
  },
  {
    slug: "viva-ibira",
    tags: ["Sem guia necessário", "Reserva necessária"],
    site_url: "https://vivaibira.com.br",
  },
  // —— Aventura / barco e bike
  {
    slug: "deco-turismo",
    tags: [
      "Com guia",
      "Reserva necessária",
      "Avistamento de golfinhos",
      "Passeio de escuna",
      "Pôr do sol no mar",
    ],
  },
  {
    slug: "vai-de-rosa",
    tags: ["Aluguel de bike", "Rota costeira", "Capacete incluso", "Sem guia necessário"],
  },
  // —— Bem-estar
  {
    slug: "espaco-mahatma",
    tags: ["Aula para iniciantes", "Ideal para iniciantes", "Reserva necessária", "Turmas reduzidas"],
  },
  {
    slug: "praia-do-rosa-yoga-brasil",
    tags: ["Aula ao ar livre", "Aula para iniciantes", "Ideal para iniciantes", "Reserva necessária"],
  },
  {
    slug: "espaco-vitalitta",
    tags: ["Massagem terapêutica", "Reserva necessária", "Pouco movimentado"],
  },
  {
    slug: "spa-solar-mirador",
    tags: ["Day spa", "Massagem", "Reserva necessária", "Romântico"],
  },
  {
    slug: "spa-village-praia-do-rosa",
    tags: ["Day spa", "Massagem", "Reserva necessária", "Sauna"],
  },
  // —— Saúde
  {
    slug: "clinica-perpetuo-socorro",
    tags: ["Clínico geral", "Convênio aceito", "Aceita cartão", "Estacionamento"],
    telefone: "(48) 3255-0664",
  },
  {
    slug: "laboratorio-central-imbituba",
    tags: ["Exames laboratoriais", "Aceita cartão", "Convênio aceito", "Estacionamento"],
  },
  {
    slug: "policlinica-central-de-imbituba",
    tags: ["Clínico geral", "Urgência", "Convênio aceito", "Aceita cartão"],
  },
  // —— Salão / mecânico
  {
    slug: "confraria-da-beleza",
    tags: ["Atendimento com hora marcada", "Aceita cartão", "Coloração", "Manicure"],
  },
  {
    slug: "correa-auto-center",
    tags: ["Troca de óleo", "Alinhamento e balanceamento", "Aceita cartão", "Orçamento sem compromisso"],
  },
  // —— Mercados / açougues
  {
    slug: "cortes-talhos-praia-do-rosa",
    tags: ["Açougue no mercado", "Aceita cartão", "Produtos da região"],
  },
  {
    slug: "cortes-talhos-vila-nova",
    tags: ["Açougue no mercado", "Aceita cartão", "Produtos da região"],
  },
  {
    slug: "nunes-casa-de-carnes",
    tags: ["Açougue no mercado", "Aceita cartão", "Produtos da região"],
  },
  {
    slug: "komprao-aracatuba",
    tags: ["Aceita cartão", "Hortifruti", "Abastece de carro", "Preço popular"],
  },
  {
    slug: "komprao-nova-brasilia",
    tags: ["Aceita cartão", "Hortifruti", "Abastece de carro", "Preço popular"],
  },
  {
    slug: "komprao-village",
    tags: ["Aceita cartão", "Hortifruti", "Abastece de carro", "Estacionamento"],
  },
  {
    slug: "santos-supermercados",
    tags: ["Aceita cartão", "Hortifruti", "Abastece de carro", "Estacionamento"],
  },
  {
    slug: "supermercado-ana-paula",
    tags: ["Aceita cartão", "Hortifruti", "Preço popular", "Abastece de carro"],
  },
  {
    slug: "tieli-supermercado",
    tags: ["Aceita cartão", "Hortifruti", "Abastece de carro", "Estacionamento"],
  },
  // —— Farmácias (não inclui skatepark lixo)
  {
    slug: "farmacia-do-trabalhador-24h",
    tags: ["Atendimento 24h", "Delivery de remédios", "Aceita cartão", "Medicamento genérico"],
  },
  {
    slug: "farmacia-do-trabalhador-centro",
    tags: ["Atendimento farmacêutico", "Aceita cartão", "Medicamento genérico", "Orientação gratuita"],
  },
  {
    slug: "farmacia-farmarosa",
    tags: ["Atendimento farmacêutico", "Aceita cartão", "Medicamento genérico", "Produtos de higiene"],
  },
  // —— Cultura
  {
    slug: "igreja-de-sant-ana-de-vila-nova",
    tags: [
      "Histórico",
      "Patrimônio histórico",
      "Arquitetura histórica",
      "Grátis",
      "Ótimo para fotos",
    ],
  },
  // —— Contatos públicos (já tinham tags)
  {
    slug: "brisa-do-rosa-gastrobar",
    telefone: "(48) 99193-2916",
    instagram: "brisadorosagastrobar",
  },
  {
    slug: "land-pizzaria-e-sushi",
    telefone: "(48) 99189-9098",
    instagram: "landpizzaria",
    cardapio_url: "https://app.cardapioweb.com/landpizzaria",
  },
];
