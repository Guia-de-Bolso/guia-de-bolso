/**
 * Gera o roteiro de lançamento Guia de Bolso (.docx)
 * Uso: node scripts/generate-launch-docx.mjs [caminho-saida]
 */
import fs from "fs";
import path from "path";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";

const REQUESTED_OUTPUT =
  process.argv[2] ||
  "/mnt/user-data/outputs/GuiadeBolso_Roteiro_Lancamento.docx";

const FALLBACK_OUTPUT = path.join(
  process.cwd(),
  "output/GuiadeBolso_Roteiro_Lancamento.docx"
);

/** @returns {string} */
function resolveOutputPath() {
  const candidate = REQUESTED_OUTPUT;
  try {
    fs.mkdirSync(path.dirname(candidate), { recursive: true });
    return candidate;
  } catch {
    fs.mkdirSync(path.dirname(FALLBACK_OUTPUT), { recursive: true });
    console.warn(
      `Aviso: não foi possível gravar em ${candidate}. Usando ${FALLBACK_OUTPUT}`
    );
    return FALLBACK_OUTPUT;
  }
}

const OUTPUT = resolveOutputPath();

const GREEN = "1A4A3A";
const GREEN_LIGHT = "E8F0ED";
const GRAY = "5A6B66";
const ORANGE = "C45A00";
const RED = "B91C1C";
const GREEN_EASY = "15803D";

const FONT = "Arial";

/** @param {string} level */
function difficultyColor(level) {
  const n = level.toLowerCase();
  if (n.includes("fácil") || n.includes("facil")) return GREEN_EASY;
  if (n.includes("difícil") || n.includes("dificil")) return RED;
  return ORANGE;
}

/** @param {string} text @param {object} [opts] */
function run(text, opts = {}) {
  return new TextRun({
    text,
    font: FONT,
    size: opts.size ?? 22,
    bold: opts.bold,
    color: opts.color,
    italics: opts.italics,
    underline: opts.underline ? {} : undefined,
  });
}

/** @param {import('docx').ParagraphChild[]} children @param {object} [opts] */
function para(children, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
    alignment: opts.alignment,
    children,
  });
}

/** @param {string} text */
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 180 },
    children: [run(text, { size: 32, bold: true, color: GREEN })],
  });
}

/** @param {string} text */
function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 120 },
    shading: { fill: GREEN_LIGHT, type: ShadingType.CLEAR },
    children: [run(text, { size: 26, bold: true, color: GREEN })],
  });
}

/** @param {string} text */
function body(text) {
  return para([run(text, { color: GRAY })], { after: 160 });
}

/** @param {string} label @param {string} value */
function bullet(label, value) {
  return para(
    [
      run(`${label}: `, { bold: true, color: GREEN }),
      run(value, { color: GRAY }),
    ],
    { after: 80 }
  );
}

/**
 * @param {{ title: string, onde: string, tempo: string, dificuldade: string, obs?: string }} item
 */
function checklistItem(item) {
  const blocks = [
    para(
      [
        run("[ ] ", { bold: true, color: GREEN, size: 24 }),
        run(item.title, { bold: true, color: "1A2E28", size: 22 }),
      ],
      { after: 60 }
    ),
    bullet("Onde", item.onde),
    bullet("Tempo estimado", item.tempo),
    para(
      [
        run("Dificuldade: ", { bold: true, color: GREEN }),
        run(`[${item.dificuldade.toUpperCase()}]`, {
          bold: true,
          color: difficultyColor(item.dificuldade),
        }),
      ],
      { after: 60 }
    ),
  ];
  if (item.obs) {
    blocks.push(
      para(
        [
          run("Observações: ", { bold: true, color: GREEN, italics: true }),
          run(item.obs, { color: GRAY, italics: true }),
        ],
        { after: 140 }
      )
    );
  } else {
    blocks.push(para([], { after: 80 }));
  }
  return blocks;
}

/**
 * @param {string} phaseTitle
 * @param {{ tempo: string, dificuldade: string, prereqs: string }} summary
 */
function phaseBanner(phaseTitle, summary) {
  return [
    new Paragraph({
      spacing: { before: 0, after: 200 },
      shading: { fill: GREEN, type: ShadingType.CLEAR },
      children: [
        run(phaseTitle, { size: 30, bold: true, color: "FFFFFF" }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            cell("Estimativa de tempo", summary.tempo, true),
            cell("Dificuldade geral", summary.dificuldade, true),
            cell("Pré-requisitos", summary.prereqs, true),
          ],
        }),
      ],
    }),
    para([], { after: 160 }),
  ];
}

/** @param {string} header @param {string} value @param {boolean} [headerCell] */
function cell(header, value, headerCell = false) {
  return new TableCell({
    shading: headerCell
      ? { fill: GREEN_LIGHT, type: ShadingType.CLEAR }
      : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [
          run(headerCell ? header : `${header}: `, {
            bold: true,
            color: GREEN,
            size: headerCell ? 20 : 18,
          }),
          ...(headerCell
            ? []
            : [run(value, { color: GRAY, size: 18 })]),
        ],
      }),
      ...(headerCell
        ? [
            new Paragraph({
              children: [run(value, { color: GRAY, size: 20 })],
            }),
          ]
        : []),
    ],
  });
}

/** @param {string} title @param {ReturnType<typeof checklistItem> extends (infer U)[] ? never : any} items */
function section(title, items) {
  return [heading2(title), ...items.flatMap((i) => checklistItem(i))];
}

// ─── Dados das fases ───────────────────────────────────────────────

const FASE1 = {
  title: "FASE 1 — FINALIZAÇÃO DO APP (1–2 semanas)",
  summary: {
    tempo: "7–14 dias",
    dificuldade: "Médio",
    prereqs: "App web em produção (guiadebolso.app); acesso admin",
  },
  sections: [
    {
      title: "1.1 Conteúdo real",
      items: [
        {
          title: "Cadastrar todos os locais com fotos reais",
          onde: "Painel Admin → /admin/locais + Supabase Storage (bucket imagens)",
          tempo: "3–5 dias",
          dificuldade: "Médio",
          obs: "Meta de lançamento: ~100 lugares (docs/CUSTOS.md). Catálogo seed atual: ~25 lugares. Usar lib/imageCompress.js para otimizar uploads.",
        },
        {
          title: "Cadastrar rotas reais com pontos e dicas corretas",
          onde: "Admin → /admin/rotas (tabelas rotas, rota_pontos, rota_dicas, rotas_localizacoes)",
          tempo: "2–3 dias",
          dificuldade: "Médio",
          obs: "Rotas curadas em /rotas; roteiros IA são gerados sob demanda. Validar mapas e ordem das etapas no celular.",
        },
        {
          title: "Corrigir coordenadas das praias e locais outdoor",
          onde: "Admin → editar local → Google Places Autocomplete + tabela localizacoes",
          tempo: "4–8 horas",
          dificuldade: "Fácil",
          obs: "Distância na home usa geolocalização real (hooks/useUserPosition.js). Coordenadas erradas afetam 'Perto de você' e clima.",
        },
        {
          title: "Revisar descrições, horários de funcionamento e contatos",
          onde: "Admin → /admin/locais; componente HorarioEditor (dois turnos/dia)",
          tempo: "2–3 dias",
          dificuldade: "Médio",
          obs: "Status aberto/fechado é calculado em tempo real (lib/horarios.js). Confirmar com estabelecimentos parceiros.",
        },
        {
          title: "Configurar destaques do carrossel Parceiros na home",
          onde: "Admin → /admin/parceiros + flags eh_parceiro em lugares",
          tempo: "2–4 horas",
          dificuldade: "Fácil",
          obs: "Plano comercial atual: R$ 299/mês (lib/planoComercial.js). Carrossel: components/home/ParceirosCarrossel.js.",
        },
        {
          title: "Revisar taxonomia (categorias, subcategorias e tags)",
          onde: "Admin → /admin/taxonomia; scripts SQL em supabase/",
          tempo: "4–6 horas",
          dificuldade: "Fácil",
          obs: "9 categorias ativas (Natureza, Gastronomia, Noite, etc.). Máximo 5 tags por local.",
        },
      ],
    },
    {
      title: "1.2 Testes manuais completos",
      items: [
        {
          title: "Executar checklist interativo completo (153 casos)",
          onde: "https://guiadebolso.app/checklist-testes.html (public/checklist-testes.data.json)",
          tempo: "2–3 dias",
          dificuldade: "Médio",
          obs: "Referência: docs/TESTING-CHECKLIST.md. Exportar resultado JSON ao final.",
        },
        {
          title: "Testar todos os fluxos no celular real (~390px)",
          onde: "Dispositivo físico → guiadebolso.app ou build local",
          tempo: "1 dia",
          dificuldade: "Fácil",
          obs: "Layout mobile-first; validar bottom nav, sheets e gestos de carrossel.",
        },
        {
          title: "Testar em Android e iOS (Safari + Chrome)",
          onde: "Browsers nativos nos dois SOs",
          tempo: "4–6 horas",
          dificuldade: "Fácil",
          obs: "Playwright e2e existe (npm run test:e2e) mas não substitui teste manual em device.",
        },
        {
          title: "Testar com conexão 3G/lenta (throttling)",
          onde: "Chrome DevTools → Network → Slow 3G",
          tempo: "2 horas",
          dificuldade: "Fácil",
          obs: "Home tem carregamento em duas fases; verificar skeletons e fallbacks por seção.",
        },
        {
          title: "Testar GPS e geolocalização",
          onde: "Home, Explorar, detalhe de lugar, seção 'Perto de você'",
          tempo: "1 hora",
          dificuldade: "Fácil",
          obs: "Permissão negada: app continua com região fixa Imbituba. Declarar na política de privacidade.",
        },
        {
          title: "Testar upload de foto de perfil",
          onde: "/perfil/editar → Supabase Storage bucket imagens/avatars/",
          tempo: "30 min",
          dificuldade: "Fácil",
          obs: "Compressão client-side via lib/imageCompress.js.",
        },
        {
          title: "Testar login Google e SMS (OTP Twilio)",
          onde: "/login, LoginModal, AuthFlow",
          tempo: "1 hora",
          dificuldade: "Médio",
          obs: "Apple Sign In desabilitado (pendente Apple Developer Program). SMS via Supabase Auth + Twilio.",
        },
        {
          title: "Testar busca por IA e limites free (5/dia)",
          onde: "Home SmartSearch → POST /api/buscar",
          tempo: "1 hora",
          dificuldade: "Médio",
          obs: "Modelo claude-sonnet-4-5; custo escala com catálogo (docs/CUSTOS.md). Premium = ilimitado.",
        },
        {
          title: "Testar geração e exclusão de roteiro IA",
          onde: "/rotas → Criar roteiro; DELETE /api/roteiro/[id]",
          tempo: "1 hora",
          dificuldade: "Médio",
          obs: "Limite free: 2 roteiros/dia. Timeline: RoteiroItineraryView.",
        },
        {
          title: "Testar sistema de avaliações e moderação",
          onde: "Detalhe do lugar + Admin /admin/avaliacoes",
          tempo: "1 hora",
          dificuldade: "Fácil",
          obs: "Moderação automática via IA (POST /api/avaliacoes/analisar) + aprovação manual admin.",
        },
        {
          title: "Testar QR Code de estabelecimentos",
          onde: "Admin PDF → scan /q/{slug} → redirect /lugares/[id]",
          tempo: "30 min",
          dificuldade: "Fácil",
          obs: "QR só para categorias comerciais; praias/natureza sem QR.",
        },
        {
          title: "Testar exclusão de conta (requisito Apple)",
          onde: "Perfil → Excluir conta → DELETE /api/conta",
          tempo: "30 min",
          dificuldade: "Fácil",
          obs: "lib/deleteUserAccount.js remove favoritos, avaliações, roteiros, perfil e auth.users.",
        },
      ],
    },
    {
      title: "1.3 Correções pós-teste",
      items: [
        {
          title: "Corrigir bugs encontrados nos testes",
          onde: "Repositório GitHub → Cursor → deploy Vercel",
          tempo: "2–5 dias (variável)",
          dificuldade: "Médio",
          obs: "Priorizar bloqueadores de login, busca IA, pagamento futuro e crashes.",
        },
        {
          title: "Ajustes de UI/UX identificados no QA",
          onde: "Componentes em components/ e app/",
          tempo: "1–3 dias",
          dificuldade: "Médio",
          obs: "Seguir ENGINEERING_GUIDE.md e CODING_STANDARDS.md. Screenshots em docs/screenshots/.",
        },
        {
          title: "Corrigir textos legais divergentes do código",
          onde: "lib/legalContent.js (Open-Meteo vs OpenWeatherMap; histórico buscas IA)",
          tempo: "2 horas",
          dificuldade: "Fácil",
          obs: "Alinhar política com Data Safety (Google) e Privacy Labels (Apple) antes da submissão.",
        },
      ],
    },
    {
      title: "1.4 Performance",
      items: [
        {
          title: "Verificar tempo de carregamento da home (LCP, TTI)",
          onde: "Vercel Analytics, Lighthouse mobile, WebPageTest",
          tempo: "2–3 horas",
          dificuldade: "Médio",
          obs: "Home carrega clima Open-Meteo em segunda fase. Meta: LCP < 2,5s em 4G.",
        },
        {
          title: "Otimizar imagens (Storage + next/image)",
          onde: "Supabase Storage; scripts/refresh-brand-icons.mjs",
          tempo: "4–6 horas",
          dificuldade: "Fácil",
          obs: "Cards com altura mínima 380px; usar WebP quando possível no admin.",
        },
        {
          title: "Testar em dispositivos mais antigos (Android 8+)",
          onde: "Dispositivo físico ou BrowserStack",
          tempo: "2–4 horas",
          dificuldade: "Médio",
          obs: "Next.js 16 + React 19; validar gestos de carrossel (lib/horizontalCarousel.js).",
        },
        {
          title: "Rodar npm run build e npm run test antes do release",
          onde: "Terminal local + CI GitHub",
          tempo: "30 min",
          dificuldade: "Fácil",
          obs: "Testes unitários: lib/horarios.test.js, lib/premium.test.js, lib/marketingHost.test.js.",
        },
      ],
    },
  ],
};

const FASE2 = {
  title: "FASE 2 — PREPARAÇÃO TÉCNICA PARA AS STORES (1 semana)",
  summary: {
    tempo: "5–7 dias",
    dificuldade: "Difícil",
    prereqs: "Fase 1 concluída; Node.js 20+; decisão Capacitor vs TWA",
  },
  sections: [
    {
      title: "2.1 Configurar Capacitor",
      items: [
        {
          title: "Instalar e configurar Capacitor no projeto Next.js",
          onde: "Terminal → npm install @capacitor/core @capacitor/cli",
          tempo: "4–6 horas",
          dificuldade: "Difícil",
          obs: "Capacitor ainda NÃO está no projeto (PWA via site.webmanifest apenas). Next.js 16 exige export estático ou server URL remota.",
        },
        {
          title: "Configurar capacitor.config.ts (appId + appName + server.url)",
          onde: "Raiz do projeto; appId sugerido: app.guiadebolso.imbituba",
          tempo: "1–2 horas",
          dificuldade: "Médio",
          obs: "Para app híbrido: apontar server.url para https://guiadebolso.app ou embedar build estático.",
        },
        {
          title: "Adicionar plataformas Android e iOS",
          onde: "npx cap add android && npx cap add ios",
          tempo: "2 horas",
          dificuldade: "Médio",
          obs: "iOS requer Mac com Xcode. Sincronizar: npx cap sync.",
        },
        {
          title: "Testar build nativo localmente",
          onde: "Android Studio / Xcode Simulator",
          tempo: "4–8 horas",
          dificuldade: "Difícil",
          obs: "Validar deep links (/lugares/[id], /q/{slug}), auth callback e cookies Supabase.",
        },
        {
          title: "Resolver conflitos de plugins (push, splash, status bar)",
          onde: "Capacitor plugins + documentação capacitorjs.com",
          tempo: "2–4 horas",
          dificuldade: "Médio",
          obs: "Push notifications está no roadmap Q2; não bloqueia v1.",
        },
      ],
    },
    {
      title: "2.2 Assets obrigatórios",
      items: [
        {
          title: "Criar ícone do app 1024×1024 px (sem transparência)",
          onde: "Design (Figma/Canva) → public/icon-192.png, logo.png existentes",
          tempo: "2–4 horas",
          dificuldade: "Médio",
          obs: "Rodar npm run icons (scripts/refresh-brand-icons.mjs) após atualizar logo.",
        },
        {
          title: "Criar splash screen nas resoluções exigidas",
          onde: "Android res/ + iOS LaunchScreen.storyboard via Capacitor",
          tempo: "2–3 horas",
          dificuldade: "Médio",
          obs: "Cores brand: #1a4a3a (verde), #f0f4f3 (fundo).",
        },
        {
          title: "Criar screenshots Play Store (mín. 2, ideal 8)",
          onde: "Dispositivo ou emulador → capturas 1080×1920 ou similar",
          tempo: "3–4 horas",
          dificuldade: "Fácil",
          obs: "Sugerido: home, busca IA, detalhe praia, rotas, favoritos, perfil, carrossel parceiros, clima.",
        },
        {
          title: "Criar screenshots App Store (mín. 3 por tamanho de tela)",
          onde: "iPhone 6,7\" e 6,5\" (obrigatórios); iPad se suportar tablet",
          tempo: "3–4 horas",
          dificuldade: "Médio",
          obs: "Apple exige dimensões exatas por device class. Usar Fastlane snapshot ou manual.",
        },
        {
          title: "Criar feature graphic Play Store (1024×500 px)",
          onde: "Google Play Console → Store listing",
          tempo: "1–2 horas",
          dificuldade: "Fácil",
          obs: "Banner horizontal com logo + tagline 'Descubra Imbituba'.",
        },
        {
          title: "Preparar vídeo preview opcional (Play Store / App Store)",
          onde: "Gravação de tela + edição leve",
          tempo: "4–6 horas",
          dificuldade: "Médio",
          obs: "Opcional mas aumenta conversão. Mostrar busca IA e 'Ir agora'.",
        },
      ],
    },
    {
      title: "2.3 Build Android (APK/AAB)",
      items: [
        {
          title: "Instalar Android Studio (versão estável)",
          onde: "developer.android.com/studio",
          tempo: "1–2 horas",
          dificuldade: "Fácil",
          obs: "Inclui SDK Manager e emulador.",
        },
        {
          title: "Configurar JDK 17",
          onde: "Android Studio → Settings → Gradle JDK",
          tempo: "30 min",
          dificuldade: "Fácil",
          obs: "Capacitor 6+ recomenda JDK 17.",
        },
        {
          title: "Gerar keystore de assinatura (GUARDAR COM SEGURANÇA)",
          onde: "keytool -genkey ou Android Studio → Generate Signed Bundle",
          tempo: "30 min",
          dificuldade: "Médio",
          obs: "Backup em cofre de senhas + nuvem criptografada. Perda = impossível atualizar app.",
        },
        {
          title: "Gerar AAB (Android App Bundle) de produção",
          onde: "Android Studio → Build → Generate Signed Bundle/APK",
          tempo: "2–4 horas",
          dificuldade: "Médio",
          obs: "Play Store exige AAB desde 2021. versionCode incrementa a cada release.",
        },
        {
          title: "Testar AAB em dispositivo físico (internal testing)",
          onde: "Play Console → Internal testing track",
          tempo: "2 horas",
          dificuldade: "Fácil",
          obs: "Validar login OAuth (custom scheme redirect) e SMS.",
        },
      ],
    },
    {
      title: "2.4 Build iOS (somente com Mac)",
      items: [
        {
          title: "Instalar Xcode (versão mais recente)",
          onde: "Mac App Store",
          tempo: "1–3 horas (download)",
          dificuldade: "Fácil",
          obs: "Requer macOS atualizado (~15 GB disco).",
        },
        {
          title: "Inscrever-se no Apple Developer Program (US$ 99/ano)",
          onde: "developer.apple.com/programs",
          tempo: "1–2 dias (aprovação)",
          dificuldade: "Médio",
          obs: "Necessário para TestFlight, App Store e Sign in with Apple (futuro).",
        },
        {
          title: "Criar App ID no Apple Developer Portal",
          onde: "Certificates, Identifiers & Profiles",
          tempo: "30 min",
          dificuldade: "Fácil",
          obs: "Habilitar Push (futuro), Associated Domains se usar Universal Links.",
        },
        {
          title: "Criar certificado de distribuição e provisioning profile",
          onde: "Apple Developer Portal + Xcode automatic signing",
          tempo: "1–2 horas",
          dificuldade: "Médio",
          obs: "Xcode managed signing simplifica para solo dev.",
        },
        {
          title: "Gerar arquivo .ipa de produção",
          onde: "Xcode → Product → Archive → Distribute App",
          tempo: "2–4 horas",
          dificuldade: "Difícil",
          obs: "Primeira vez costuma exigir ajustes de capabilities e entitlements.",
        },
        {
          title: "Testar em dispositivo físico via TestFlight",
          onde: "App Store Connect → TestFlight",
          tempo: "1 dia",
          dificuldade: "Médio",
          obs: "Convidar testers internos antes da submissão pública.",
        },
      ],
    },
  ],
};

const FASE3 = {
  title: "FASE 3 — CONFIGURAÇÃO DAS CONTAS NAS STORES (3–5 dias)",
  summary: {
    tempo: "3–5 dias",
    dificuldade: "Médio",
    prereqs: "Conta Google/Apple; política de privacidade publicada",
  },
  sections: [
    {
      title: "3.1 Google Play Console",
      items: [
        {
          title: "Criar conta Google Play Developer (US$ 25 taxa única)",
          onde: "play.google.com/console/signup",
          tempo: "1 hora + verificação",
          dificuldade: "Fácil",
          obs: "Verificação de identidade pode levar 24–48h.",
        },
        {
          title: "Preencher perfil do desenvolvedor e dados fiscais",
          onde: "Play Console → Settings → Developer account",
          tempo: "1 hora",
          dificuldade: "Fácil",
          obs: "Nome público: Bruno Disliler ou Guia de Bolso.",
        },
        {
          title: "Aceitar acordos de distribuição e políticas",
          onde: "Play Console → Policy → App content",
          tempo: "30 min",
          dificuldade: "Fácil",
          obs: "Inclui acordo de distribuição de apps e exportação EUA.",
        },
        {
          title: "Criar novo app no Console",
          onde: "Play Console → Create app",
          tempo: "30 min",
          dificuldade: "Fácil",
          obs: "Idioma padrão: Português (Brasil). App ou jogo: App.",
        },
        {
          title: "Configurar país/região de distribuição",
          onde: "Play Console → Production → Countries",
          tempo: "15 min",
          dificuldade: "Fácil",
          obs: "Iniciar com Brasil; expandir depois se desejado.",
        },
        {
          title: "Preencher Data Safety (declaração de coleta de dados)",
          onde: "Play Console → App content → Data safety",
          tempo: "2–3 horas",
          dificuldade: "Difícil",
          obs: "Declarar: e-mail, telefone, localização aproximada, logs de uso, dados de conta. Terceiros: Supabase, Google, Twilio, Anthropic.",
        },
        {
          title: "Configurar URL de política de privacidade",
          onde: "Play Console → Store settings",
          tempo: "15 min",
          dificuldade: "Fácil",
          obs: "JÁ EXISTE: https://guiadebolso.app/privacidade (revisar texto antes de submeter).",
        },
      ],
    },
    {
      title: "3.2 Apple App Store Connect",
      items: [
        {
          title: "Ativar Apple Developer Program (US$ 99/ano)",
          onde: "developer.apple.com + App Store Connect",
          tempo: "1–2 dias",
          dificuldade: "Médio",
          obs: "Mesma conta para certificados e Connect.",
        },
        {
          title: "Aceitar acordos de licença em App Store Connect",
          onde: "App Store Connect → Agreements",
          tempo: "15 min",
          dificuldade: "Fácil",
          obs: "Novos acordos aparecem periodicamente; bloqueiam upload.",
        },
        {
          title: "Criar novo app no App Store Connect",
          onde: "App Store Connect → My Apps → +",
          tempo: "30 min",
          dificuldade: "Fácil",
          obs: "Nome: Guia de Bolso (verificar disponibilidade).",
        },
        {
          title: "Configurar Bundle ID e SKU único",
          onde: "App Store Connect + Developer Portal",
          tempo: "30 min",
          dificuldade: "Fácil",
          obs: "SKU interno (ex.: GUIADEBOLSO2026). Bundle = app.guiadebolso.imbituba.",
        },
        {
          title: "Preencher App Privacy (Privacy Nutrition Labels)",
          onde: "App Store Connect → App Privacy",
          tempo: "2–3 horas",
          dificuldade: "Difícil",
          obs: "Deve coincidir com lib/legalContent.js. Incluir localização (when in use), identificadores, uso.",
        },
      ],
    },
    {
      title: "3.3 Política de privacidade e termos",
      items: [
        {
          title: "Revisar e finalizar política de privacidade",
          onde: "lib/legalContent.js → app/privacidade/page.js",
          tempo: "4–8 horas",
          dificuldade: "Médio",
          obs: "Rascunho em docs/legal/privacidade.md. Recomendada revisão jurídica. Corrigir Open-Meteo (não OpenWeatherMap).",
        },
        {
          title: "Cobrir todos os terceiros e finalidades (LGPD)",
          onde: "Seção 5 de legalContent.js",
          tempo: "2 horas",
          dificuldade: "Médio",
          obs: "Supabase, Vercel, Google OAuth, Twilio, Anthropic, Open-Meteo, apps de mapas.",
        },
        {
          title: "Garantir URL pública acessível e estável",
          onde: "https://guiadebolso.app/privacidade (Vercel produção)",
          tempo: "Concluído",
          dificuldade: "Fácil",
          obs: "Considerar SSR do texto legal para crawlers das lojas (hoje é client-side).",
        },
        {
          title: "Publicar Termos de Uso em URL pública",
          onde: "https://guiadebolso.app/termos",
          tempo: "Concluído",
          dificuldade: "Fácil",
          obs: "Links no login (LegalConsentLine), perfil e landing footer.",
        },
        {
          title: "Adicionar privacy_policy ao site.webmanifest",
          onde: "public/site.webmanifest",
          tempo: "15 min",
          dificuldade: "Fácil",
          obs: "Campo recomendado para TWA/Android.",
        },
      ],
    },
  ],
};

const FASE4 = {
  title: "FASE 4 — SUBMISSÃO PLAY STORE (3–7 dias de review)",
  summary: {
    tempo: "3–7 dias (review Google)",
    dificuldade: "Médio",
    prereqs: "AAB assinado; Data Safety; store listing completa",
  },
  sections: [
    {
      title: "4.1 Ficha do app na Play Store",
      items: [
        {
          title: "Nome do app: Guia de Bolso",
          onde: "Play Console → Main store listing",
          tempo: "15 min",
          dificuldade: "Fácil",
          obs: "Verificar conflito de marca com 'Guiabolso' (finanças) — landing já esclarece.",
        },
        {
          title: "Escrever descrição curta (até 80 caracteres)",
          onde: "Play Console → Store listing",
          tempo: "30 min",
          dificuldade: "Fácil",
          obs: "Ex.: 'Praias, restaurantes e rotas de Imbituba com busca por IA.'",
        },
        {
          title: "Escrever descrição completa (até 4000 caracteres)",
          onde: "Play Console → Store listing",
          tempo: "1–2 horas",
          dificuldade: "Médio",
          obs: "Destacar: gratuito, login opcional, parceiros locais, clima, rotas.",
        },
        {
          title: "Definir categoria: Viagem e guias locais",
          onde: "Play Console → Store settings",
          tempo: "15 min",
          dificuldade: "Fácil",
          obs: "Tags: turismo, Imbituba, Santa Catarina, praias, gastronomia.",
        },
        {
          title: "Configurar e-mail de suporte e site",
          onde: "Store listing",
          tempo: "15 min",
          dificuldade: "Fácil",
          obs: "contato@guiadebolso.app · https://guiadebolso.app",
        },
      ],
    },
    {
      title: "4.2 Classificação de conteúdo",
      items: [
        {
          title: "Preencher questionário IARC de classificação etária",
          onde: "Play Console → App content → Content rating",
          tempo: "30 min",
          dificuldade: "Fácil",
          obs: "Esperado: Livre (L). Sem violência, jogos de azar ou conteúdo adulto.",
        },
        {
          title: "Declarar anúncios (se aplicável)",
          onde: "Play Console → App content → Ads",
          tempo: "15 min",
          dificuldade: "Fácil",
          obs: "App atual não exibe ads de terceiros. Carrossel parceiros = conteúdo editorial.",
        },
        {
          title: "Declarar compras no app (futuro Premium)",
          onde: "Play Console → Monetization",
          tempo: "30 min",
          dificuldade: "Médio",
          obs: "Guia Premium R$ 9,90/mês planejado; billing Asaas ainda no roadmap. v1 pode ser 100% gratuito.",
        },
      ],
    },
    {
      title: "4.3 Upload e revisão",
      items: [
        {
          title: "Fazer upload do AAB assinado",
          onde: "Play Console → Production → Create new release",
          tempo: "1 hora",
          dificuldade: "Fácil",
          obs: "Testar antes em Internal → Closed testing.",
        },
        {
          title: "Configurar distribuição e preço (gratuito)",
          onde: "Play Console → Pricing",
          tempo: "15 min",
          dificuldade: "Fácil",
          obs: "Free to download.",
        },
        {
          title: "Submeter para revisão",
          onde: "Play Console → Review release",
          tempo: "15 min",
          dificuldade: "Fácil",
          obs: "Primeira submissão pode levar até 7 dias.",
        },
        {
          title: "Acompanhar status e responder solicitações",
          onde: "Play Console → Policy status",
          tempo: "Contínuo",
          dificuldade: "Médio",
          obs: "Responder em até 24h se Google pedir esclarecimentos sobre Data Safety.",
        },
      ],
    },
    {
      title: "4.4 Pós-aprovação Play Store",
      items: [
        {
          title: "Testar instalação pela Play Store em device limpo",
          onde: "Dispositivo Android sem sideload",
          tempo: "1 hora",
          dificuldade: "Fácil",
          obs: "Fluxo completo: onboarding → explorar → login → busca IA.",
        },
        {
          title: "Verificar funcionalidades em build de produção",
          onde: "App instalado via Play Store",
          tempo: "2 horas",
          dificuldade: "Médio",
          obs: "OAuth redirect e cookies são pontos críticos em WebView/Capacitor.",
        },
        {
          title: "Publicar link da Play Store nas comunicações",
          onde: "Landing, Instagram, materiais parceiros",
          tempo: "1 hora",
          dificuldade: "Fácil",
          obs: "Instagram já ativo: @guiadebolsoimbituba.",
        },
      ],
    },
  ],
};

const FASE5 = {
  title: "FASE 5 — SUBMISSÃO APP STORE (1–3 dias de review)",
  summary: {
    tempo: "1–3 dias (review Apple)",
    dificuldade: "Difícil",
    prereqs: "Mac + .ipa + App Privacy + conta demo",
  },
  sections: [
    {
      title: "5.1 Ficha do app na App Store",
      items: [
        {
          title: "Nome do app (máx. 30 caracteres)",
          onde: "App Store Connect → App Information",
          tempo: "15 min",
          dificuldade: "Fácil",
          obs: "'Guia de Bolso' cabe. Subtítulo sugerido: 'Turismo em Imbituba'.",
        },
        {
          title: "Subtítulo (máx. 30 caracteres)",
          onde: "App Store Connect → Version → Subtitle",
          tempo: "15 min",
          dificuldade: "Fácil",
          obs: "Foco em descoberta local + IA.",
        },
        {
          title: "Descrição (até 4000 caracteres) e keywords (100 caracteres)",
          onde: "App Store Connect → Version",
          tempo: "1–2 horas",
          dificuldade: "Médio",
          obs: "Keywords: imbituba,praia,turismo,sc,restaurante,roteiro,guia",
        },
        {
          title: "Categorias: Viagem (primária) + Estilo de vida (secundária)",
          onde: "App Store Connect → App Information",
          tempo: "15 min",
          dificuldade: "Fácil",
          obs: "Alinhado ao posicionamento de guia local.",
        },
        {
          title: "URL de suporte e marketing",
          onde: "App Store Connect",
          tempo: "15 min",
          dificuldade: "Fácil",
          obs: "Suporte: guiadebolso.app · Marketing: guiadebolso.app/landing",
        },
      ],
    },
    {
      title: "5.2 Informações de revisão",
      items: [
        {
          title: "Criar conta de demonstração para revisor Apple",
          onde: "Supabase Auth + perfil admin separado ou conta teste",
          tempo: "1 hora",
          dificuldade: "Fácil",
          obs: "Fornecer login/senha ou número SMS de teste na seção Review Notes.",
        },
        {
          title: "Escrever notas para o revisor",
          onde: "App Store Connect → App Review Information",
          tempo: "1 hora",
          dificuldade: "Médio",
          obs: "Explicar: app funciona sem login; geolocalização opcional; busca IA requer conta; conteúdo regional Imbituba.",
        },
        {
          title: "Documentar disclaimer de conteúdo gerado por IA",
          onde: "Notas de revisão + Termos seção 6 (legalContent.js)",
          tempo: "30 min",
          dificuldade: "Fácil",
          obs: "Sugestões IA são orientativas; usuário deve confirmar no local.",
        },
      ],
    },
    {
      title: "5.3 Upload e revisão",
      items: [
        {
          title: "Upload do .ipa via Xcode ou Transporter",
          onde: "Mac → Transporter app ou Xcode Organizer",
          tempo: "1 hora",
          dificuldade: "Médio",
          obs: "Build deve aparecer em App Store Connect → TestFlight em ~15 min.",
        },
        {
          title: "Preencher informações de exportação (criptografia)",
          onde: "App Store Connect → Compliance",
          tempo: "15 min",
          dificuldade: "Fácil",
          obs: "HTTPS padrão → geralmente 'uses encryption exempt'.",
        },
        {
          title: "Selecionar build e submeter para revisão",
          onde: "App Store Connect → Submit for Review",
          tempo: "30 min",
          dificuldade: "Fácil",
          obs: "Aguardar processamento do build antes de submeter.",
        },
        {
          title: "Responder rejeições em até 24 horas",
          onde: "App Store Connect → Resolution Center",
          tempo: "Variável",
          dificuldade: "Médio",
          obs: "Manter tom profissional; anexar vídeo se necessário.",
        },
      ],
    },
    {
      title: "5.4 Possíveis motivos de rejeição (preparar antes)",
      items: [
        {
          title: "Guideline 4.2 — app muito simples / wrapper",
          onde: "Garantir valor nativo além do site",
          tempo: "Preventivo",
          dificuldade: "Difícil",
          obs: "Destacar IA, clima, rotas offline parcial (futuro), QR codes. Capacitor com features nativas ajuda.",
        },
        {
          title: "Login obrigatório sem exploração prévia",
          onde: "App já permite guest em home, lugares, rotas curadas",
          tempo: "Verificado",
          dificuldade: "Fácil",
          obs: "Login só para favoritos, avaliar, busca IA logada, roteiro IA.",
        },
        {
          title: "Política de privacidade incompleta ou URL quebrada",
          onde: "https://guiadebolso.app/privacidade",
          tempo: "Preventivo",
          dificuldade: "Médio",
          obs: "Alinhar App Privacy labels com texto legal.",
        },
        {
          title: "Localização sem justificativa clara (Guideline 5.1.1)",
          onde: "Info.plist NSLocationWhenInUseUsageDescription",
          tempo: "30 min",
          dificuldade: "Fácil",
          obs: "Texto: 'Usamos sua localização para calcular distâncias e sugerir lugares perto.'",
        },
        {
          title: "Conteúdo gerado por IA sem disclaimer",
          onde: "UI busca/roteiro + termos legais",
          tempo: "Concluído parcial",
          dificuldade: "Fácil",
          obs: "Reforçar mensagem na interface além dos termos.",
        },
      ],
    },
    {
      title: "5.5 Pós-aprovação App Store",
      items: [
        {
          title: "Testar via TestFlight antes do release público",
          onde: "TestFlight → Internal testers",
          tempo: "1 dia",
          dificuldade: "Fácil",
          obs: "Mínimo 1 build TestFlight validado por você.",
        },
        {
          title: "Liberar release público manual ou automático",
          onde: "App Store Connect → Release",
          tempo: "15 min",
          dificuldade: "Fácil",
          obs: "Escolher 'Manually release' para sincronizar com Play Store.",
        },
        {
          title: "Publicar link da App Store nas comunicações",
          onde: "Landing, redes sociais, parceiros",
          tempo: "1 hora",
          dificuldade: "Fácil",
          obs: "Smart App Banner opcional no site.",
        },
      ],
    },
  ],
};

const FASE6 = {
  title: "FASE 6 — INFRAESTRUTURA DE PRODUÇÃO (antes do lançamento)",
  summary: {
    tempo: "3–5 dias",
    dificuldade: "Médio",
    prereqs: "Contas Vercel/Supabase; domínio ativo",
  },
  sections: [
    {
      title: "6.1 Supabase",
      items: [
        {
          title: "Upgrade para plano Pro (US$ 25/mês) antes de tráfego real",
          onde: "Supabase Dashboard → Billing",
          tempo: "30 min",
          dificuldade: "Fácil",
          obs: "Projeto prod: rsdjbqzjdyeaedyqwrvc, região us-west-2.",
        },
        {
          title: "Configurar backups automáticos diários",
          onde: "Supabase Pro → Database → Backups",
          tempo: "30 min",
          dificuldade: "Fácil",
          obs: "Incluído no Pro. Testar restore em projeto staging.",
        },
        {
          title: "Configurar alertas de uso (storage, bandwidth, DB)",
          onde: "Supabase Dashboard → Settings → Usage",
          tempo: "1 hora",
          dificuldade: "Fácil",
          obs: "Storage bucket imagens cresce com fotos de 100+ lugares.",
        },
        {
          title: "Revisar todas as RLS policies em produção",
          onde: "Supabase → Authentication → Policies; docs/security-rls.md",
          tempo: "4–6 horas",
          dificuldade: "Difícil",
          obs: "Comparar com scripts supabase/*_policies.sql. Testar como user comum e admin.",
        },
        {
          title: "Aplicar migrations pendentes na ordem do manifest",
          onde: "docs/migrations.md → SQL Editor",
          tempo: "2–4 horas",
          dificuldade: "Médio",
          obs: "Nunca pular ordem. Preview project para testar antes.",
        },
      ],
    },
    {
      title: "6.2 Vercel",
      items: [
        {
          title: "Upgrade para plano Pro (US$ 20/mês) se uso comercial",
          onde: "Vercel Dashboard → Billing",
          tempo: "30 min",
          dificuldade: "Fácil",
          obs: "Pro: analytics, team, limites maiores de serverless.",
        },
        {
          title: "Confirmar domínio personalizado guiadebolso.app",
          onde: "Vercel → Domains",
          tempo: "Concluído",
          dificuldade: "Fácil",
          obs: "DNS apontando corretamente; www redirect configurado.",
        },
        {
          title: "Revisar variáveis de ambiente de produção",
          onde: "Vercel → Settings → Environment Variables; docs/environment.md",
          tempo: "1 hora",
          dificuldade: "Médio",
          obs: "Obrigatórias: SUPABASE_*, ANTHROPIC_API_KEY. Opcional: SERVICE_ROLE, SENTRY, GOOGLE_MAPS.",
        },
        {
          title: "Configurar Vercel Analytics e alertas de erro",
          onde: "Vercel Dashboard → Analytics",
          tempo: "1 hora",
          dificuldade: "Fácil",
          obs: "Sentry opcional via NEXT_PUBLIC_SENTRY_DSN (lib/observability.js).",
        },
      ],
    },
    {
      title: "6.3 Domínio e e-mail",
      items: [
        {
          title: "Confirmar registro do domínio guiadebolso.app",
          onde: "Registrador de domínio",
          tempo: "Concluído",
          dificuldade: "Fácil",
          obs: "Renovar auto-renewal; .com.br opcional para SEO local.",
        },
        {
          title: "Configurar DNS apontando para Vercel",
          onde: "Registrador → DNS records",
          tempo: "Concluído",
          dificuldade: "Fácil",
          obs: "A/AAAA ou CNAME conforme Vercel instrui.",
        },
        {
          title: "Configurar e-mail profissional (Google Workspace ou similar)",
          onde: "Google Workspace → MX records",
          tempo: "2–4 horas",
          dificuldade: "Médio",
          obs: "contato@guiadebolso.app já referenciado no app. Criar suporte@ se necessário.",
        },
        {
          title: "Validar entrega de e-mail (SPF, DKIM, DMARC)",
          onde: "DNS do domínio",
          tempo: "1 hora",
          dificuldade: "Médio",
          obs: "Importante para OTP Supabase e comunicação com parceiros.",
        },
      ],
    },
    {
      title: "6.4 Monitoramento",
      items: [
        {
          title: "Configurar Sentry para captura de erros",
          onde: "sentry.io + NEXT_PUBLIC_SENTRY_DSN na Vercel",
          tempo: "2–3 horas",
          dificuldade: "Médio",
          obs: "Hoje só console.error (lib/observability.js). Crítico pós-lançamento.",
        },
        {
          title: "Configurar alertas de downtime",
          onde: "UptimeRobot, Better Stack ou Vercel",
          tempo: "1 hora",
          dificuldade: "Fácil",
          obs: "Monitorar guiadebolso.app e /api/buscar health.",
        },
        {
          title: "Validar custos de IA com painel admin",
          onde: "/admin/ia → tabela logs_ia",
          tempo: "30 min",
          dificuldade: "Fácil",
          obs: "lib/logIA.js registra tokens e custo USD por chamada.",
        },
        {
          title: "Configurar cron de purge de lugares inativos",
          onde: "vercel.json → /api/cron/lugares-purge + CRON_SECRET",
          tempo: "1 hora",
          dificuldade: "Médio",
          obs: "supabase/lugares_purge_inativos.sql — retenção 30 dias.",
        },
      ],
    },
  ],
};

const FASE7 = {
  title: "FASE 7 — LANÇAMENTO E DIVULGAÇÃO (semana do lançamento)",
  summary: {
    tempo: "5–7 dias",
    dificuldade: "Médio",
    prereqs: "Apps aprovados nas duas lojas; infra estável",
  },
  sections: [
    {
      title: "7.1 Comunicação com parceiros",
      items: [
        {
          title: "Notificar estabelecimentos parceiros sobre o lançamento",
          onde: "WhatsApp, e-mail, visita presencial",
          tempo: "2–3 dias",
          dificuldade: "Médio",
          obs: "Meta comercial: 36 parceiros. Plano Parceiro R$ 299/mês.",
        },
        {
          title: "Enviar kit de boas-vindas (QR Code, adesivo, artes)",
          onde: "Admin → PDF QR (/admin/locais) + design",
          tempo: "1–2 dias",
          dificuldade: "Médio",
          obs: "QR URL curta /q/{slug} já implementada.",
        },
        {
          title: "Realizar onboarding presencial ou por videochamada",
          onde: "Estabelecimentos parceiros",
          tempo: "1 semana (contínuo)",
          dificuldade: "Médio",
          obs: "Mostrar relatórios em /admin/relatorios.",
        },
        {
          title: "Ativar grupo WhatsApp dos fundadores / early adopters",
          onde: "WhatsApp Business",
          tempo: "2 horas",
          dificuldade: "Fácil",
          obs: "Canal de feedback rápido nos primeiros 30 dias.",
        },
      ],
    },
    {
      title: "7.2 Redes sociais",
      items: [
        {
          title: "Confirmar perfis Instagram e TikTok ativos",
          onde: "lib/siteContact.js → @guiadebolsoimbituba",
          tempo: "Concluído",
          dificuldade: "Fácil",
          obs: "Atualizar bio com links das lojas após aprovação.",
        },
        {
          title: "Preparar calendário de posts de lançamento (7 dias)",
          onde: "Canva + agendador (Meta Business Suite)",
          tempo: "1–2 dias",
          dificuldade: "Médio",
          obs: "Conteúdo: busca IA, praias, depoimentos, bastidores.",
        },
        {
          title: "Publicar nos dias D0, D+1 e D+7 do lançamento",
          onde: "Instagram, TikTok, stories",
          tempo: "Contínuo",
          dificuldade: "Fácil",
          obs: "Incluir links smart para Play Store e App Store.",
        },
      ],
    },
    {
      title: "7.3 Divulgação institucional",
      items: [
        {
          title: "Comunicado oficial com a prefeitura de Imbituba",
          onde: "E-mail institucional + reunião",
          tempo: "1–2 dias",
          dificuldade: "Médio",
          obs: "Posicionamento: guia turístico oficial da cidade (parceria estratégica).",
        },
        {
          title: "Solicitar divulgação nos canais oficiais da prefeitura",
          onde: "Site, Instagram e WhatsApp municipal",
          tempo: "1 semana",
          dificuldade: "Médio",
          obs: "Ter press kit pronto (logo, screenshots, texto padrão).",
        },
        {
          title: "Contato com imprensa local (jornais, rádios, portais)",
          onde: "Imbituba e região (Garopaba, Laguna)",
          tempo: "2–3 dias",
          dificuldade: "Médio",
          obs: "Ângulo: app com IA feito localmente para turismo.",
        },
        {
          title: "Solicitar matéria jornalística sobre o app",
          onde: "Portal G1 SC, NSC, jornais regionais",
          tempo: "1–2 semanas",
          dificuldade: "Difícil",
          obs: "Oferecer demo presencial e entrevista com fundador.",
        },
      ],
    },
    {
      title: "7.4 ASO (App Store Optimization)",
      items: [
        {
          title: "Pesquisar keywords para turismo em SC",
          onde: "AppTweak, Sensor Tower ou pesquisa manual nas lojas",
          tempo: "2–3 horas",
          dificuldade: "Médio",
          obs: "Foco: imbituba, praia, roteiro, restaurante, o que fazer.",
        },
        {
          title: "Otimizar título e descrição com keywords",
          onde: "Play Console + App Store Connect",
          tempo: "2 horas",
          dificuldade: "Médio",
          obs: "Revisar a cada 30 dias com base em conversão.",
        },
        {
          title: "Solicitar avaliações aos primeiros usuários",
          onde: "In-app prompt (futuro) + WhatsApp + presencial",
          tempo: "Contínuo",
          dificuldade: "Fácil",
          obs: "Meta 30 dias: 50+ avaliações nas stores.",
        },
        {
          title: "Monitorar posicionamento e conversão",
          onde: "Play Console Statistics + App Store Connect Analytics",
          tempo: "Semanal",
          dificuldade: "Fácil",
          obs: "Acompanhar impressões → instalações → retenção D1/D7.",
        },
      ],
    },
  ],
};

const FASE8 = {
  title: "FASE 8 — PÓS-LANÇAMENTO (primeiros 30 dias)",
  summary: {
    tempo: "30 dias contínuos",
    dificuldade: "Médio",
    prereqs: "App publicado; monitoramento ativo",
  },
  sections: [
    {
      title: "8.1 Monitoramento diário",
      items: [
        {
          title: "Verificar crashes e erros no Sentry",
          onde: "sentry.io dashboard",
          tempo: "15 min/dia",
          dificuldade: "Fácil",
          obs: "Priorizar erros em /api/buscar e auth callback.",
        },
        {
          title: "Acompanhar métricas de uso no Supabase",
          onde: "Tabela logs + Dashboard admin /admin",
          tempo: "15 min/dia",
          dificuldade: "Fácil",
          obs: "KPIs: acessou_app, visualizou_lugar, ir_agora, escaneou_qr.",
        },
        {
          title: "Acompanhar custo de IA no painel admin",
          onde: "/admin/ia → logs_ia (custo_usd acumulado)",
          tempo: "15 min/dia",
          dificuldade: "Fácil",
          obs: "Com 100 lugares, ~R$ 0,15/busca; escala para ~R$ 0,44 com 300 (docs/CUSTOS.md).",
        },
        {
          title: "Responder avaliações nas stores",
          onde: "Play Console + App Store Connect",
          tempo: "30 min/dia",
          dificuldade: "Fácil",
          obs: "Responder em português, tom cordial, resolver problemas publicamente.",
        },
        {
          title: "Triar feedback in-app",
          onde: "/admin/feedback",
          tempo: "30 min/dia",
          dificuldade: "Fácil",
          obs: "FeedbackProvider em Perfil → Ajuda e feedback.",
        },
      ],
    },
    {
      title: "8.2 Atualizações",
      items: [
        {
          title: "Corrigir bugs reportados pelos usuários",
          onde: "GitHub Issues → Cursor → deploy",
          tempo: "Contínuo",
          dificuldade: "Médio",
          obs: "SLA sugerido: críticos em 24h, menores em 1 semana.",
        },
        {
          title: "Publicar atualizações nas stores",
          onde: "Mesmo fluxo AAB/.ipa; incrementar versionCode/build",
          tempo: "1–3 dias por release",
          dificuldade: "Médio",
          obs: "Review Apple costuma ser mais rápido em updates.",
        },
        {
          title: "Comunicar melhorias aos parceiros",
          onde: "WhatsApp + e-mail mensal",
          tempo: "Mensal",
          dificuldade: "Fácil",
          obs: "Enviar relatório PDF via /admin/relatorios.",
        },
      ],
    },
    {
      title: "8.3 Métricas de sucesso (primeiros 30 dias)",
      items: [
        {
          title: "Meta: 500+ downloads combinados (Play + App Store + web PWA)",
          onde: "Play Console + App Store Connect + Vercel Analytics",
          tempo: "30 dias",
          dificuldade: "Médio",
          obs: "Acompanhar semanalmente; ajustar divulgação se abaixo.",
        },
        {
          title: "Meta: 200+ usuários ativos (MAU)",
          onde: "logs.acao = acessou_app + perfis ativos",
          tempo: "30 dias",
          dificuldade: "Médio",
          obs: "Definir MAU como usuário com ≥1 acesso no mês.",
        },
        {
          title: "Meta: 50+ avaliações nas stores (média ≥ 4,0)",
          onde: "Play Console + App Store Connect",
          tempo: "30 dias",
          dificuldade: "Médio",
          obs: "Pedir avaliação após experiência positiva (favoritar, roteiro).",
        },
        {
          title: "Meta: 30+ estabelecimentos ativos no catálogo",
          onde: "Supabase lugares status=ativo",
          tempo: "30 dias",
          dificuldade: "Médio",
          obs: "Escalar para 100 no lançamento; 300 em ~3 meses (CUSTOS.md).",
        },
      ],
    },
  ],
};

const ALL_PHASES = [FASE1, FASE2, FASE3, FASE4, FASE5, FASE6, FASE7, FASE8];

// ─── Montagem do documento ─────────────────────────────────────────

function buildPhaseContent(phase) {
  const blocks = [
    ...phaseBanner(phase.title, phase.summary),
    ...phase.sections.flatMap((s) => section(s.title, s.items)),
    new Paragraph({ children: [new PageBreak()] }),
  ];
  return blocks;
}

function buildCover() {
  return [
    para([], { after: 800 }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        run("Guia de Bolso — Roteiro de Lançamento", {
          size: 56,
          bold: true,
          color: GREEN,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        run("Passo a passo completo até a Play Store e App Store", {
          size: 28,
          color: GRAY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [run("Autor: Bruno Disliler", { size: 24, color: GRAY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
      children: [run("Maio de 2026", { size: 24, color: GRAY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        run("guiadebolso.app", { size: 22, color: GREEN, bold: true }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function buildIntroduction() {
  return [
    heading1("Introdução"),
    body(
      "Este documento é o roteiro operacional para lançar o Guia de Bolso — aplicativo de descoberta turística para Imbituba/SC — na Google Play Store, Apple App Store e web de produção. Foi elaborado com base no estado real do código-fonte em maio de 2026."
    ),
    heading2("Estado atual do app (baseado no código)"),
    body(
      "O Guia de Bolso já está em produção na web (https://guiadebolso.app) com stack Next.js 16, React 19, Supabase (PostgreSQL + Auth + Storage), Vercel e IA via Anthropic Claude. Funcionalidades implementadas incluem: home contextual com busca por IA, carrossel de parceiros, catálogo de lugares com geolocalização e clima (Open-Meteo), rotas curadas e roteiros IA, favoritos, avaliações moderadas, onboarding, painel admin completo, QR codes para estabelecimentos, política de privacidade (/privacidade), termos de uso (/termos), exclusão de conta, login Google + SMS, e PWA básico (site.webmanifest)."
    ),
    body(
      "Ainda não implementado para lojas: Capacitor/wrapper nativo, builds AAB/IPA, formulários Data Safety (Google) e App Privacy (Apple), billing recorrente (Asaas), Apple Sign In, push notifications e service worker offline. Catálogo seed ~25 lugares; meta de lançamento ~100 (docs/CUSTOS.md)."
    ),
    heading2("Objetivo deste documento"),
    body(
      "Fornecer um checklist acionável, fase por fase, desde a finalização do conteúdo e QA até a divulgação pós-lançamento. Cada item indica o que fazer, onde fazer, tempo estimado, dificuldade e observações práticas."
    ),
    heading2("Como usar o checklist"),
    bullet(
      "Marque [ ] → [x]",
      "conforme concluir cada item (no Word: substitua manualmente ou use caixas de seleção)."
    ),
    bullet(
      "Ordem sugerida",
      "Fases 1 e 6 podem overlap parcial. Fase 2 requer Mac para iOS. Fases 4 e 5 podem correr em paralelo após builds prontos."
    ),
    bullet(
      "Referência de testes",
      "Use checklist-testes.html (153 casos) e docs/TESTING-CHECKLIST.md como complemento da Fase 1."
    ),
    heading2("Estimativa total até o lançamento"),
    body(
      "Considerando execução solo (Bruno Disliler) e dependência de aprovações externas (Apple Developer, reviews das lojas):"
    ),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            cell("Fase", "Duração", true),
            cell("Fase 1 — Finalização", "7–14 dias", true),
            cell("Fase 2 — Prep. técnica", "5–7 dias", true),
          ],
        }),
        new TableRow({
          children: [
            cell("Fase 3", "3–5 dias", true),
            cell("Fases 4+5 — Reviews", "4–10 dias", true),
            cell("Fase 6 — Infra", "3–5 dias", true),
          ],
        }),
        new TableRow({
          children: [
            cell("Fase 7 — Lançamento", "5–7 dias", true),
            cell("Total estimado", "6–8 semanas", true),
            cell("Fase 8", "30 dias pós", true),
          ],
        }),
      ],
    }),
    para([], { after: 200 }),
    body(
      "Total realista: 6 a 8 semanas do estado atual até apps públicos nas duas lojas, assumindo dedicação parcial (~20–30 h/semana) e sem bloqueios graves de review."
    ),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function buildIndex() {
  const items = [
    "Introdução",
    ...ALL_PHASES.map((p) => p.title),
    "Referências e Recursos",
  ];
  return [
    heading1("Índice"),
    ...items.map((item, i) =>
      para(
        [
          run(`${i === 0 ? "" : i + "."} ${item}`, {
            color: i === 0 ? GREEN : GRAY,
            bold: i > 0,
          }),
        ],
        { after: i === 0 ? 160 : 80 }
      )
    ),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function buildReferences() {
  const links = [
    ["Google Play Console", "play.google.com/console"],
    ["Apple App Store Connect", "appstoreconnect.apple.com"],
    ["Apple Developer Program", "developer.apple.com/programs"],
    ["Capacitor Docs", "capacitorjs.com/docs"],
    ["Android Studio", "developer.android.com/studio"],
    ["Xcode", "developer.apple.com/xcode"],
    ["Supabase Dashboard", "supabase.com/dashboard"],
    ["Vercel Dashboard", "vercel.com/dashboard"],
    ["Guia de Bolso (produção)", "guiadebolso.app"],
    ["Política de Privacidade", "guiadebolso.app/privacidade"],
    ["Checklist de testes", "guiadebolso.app/checklist-testes.html"],
    ["Repositório GitHub", "github.com/BrunoDislilerDev/guia-de-bolso"],
    ["Documentação técnica", "github.com/BrunoDislilerDev/guia-de-bolso/tree/main/docs"],
  ];
  return [
    heading1("Referências e Recursos"),
    body(
      "Links úteis para execução do roteiro. Prefira sempre a documentação oficial das plataformas para procedimentos atualizados."
    ),
    ...links.map(([label, url]) =>
      para(
        [
          run("• ", { color: GREEN, bold: true }),
          run(`${label}: `, { bold: true, color: GREEN }),
          run(url, { color: GRAY, underline: true }),
        ],
        { after: 100 }
      )
    ),
    para([], { after: 400 }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        run("— Fim do documento —", { italics: true, color: GRAY, size: 20 }),
      ],
    }),
  ];
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 22 },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [
            para(
              [
                run("Guia de Bolso — Roteiro de Lançamento", {
                  size: 16,
                  color: GREEN,
                  italics: true,
                }),
              ],
              { after: 0 }
            ),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                run("Página ", { size: 18, color: GRAY }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: FONT,
                  size: 18,
                  color: GRAY,
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        ...buildCover(),
        ...buildIndex(),
        ...buildIntroduction(),
        ...ALL_PHASES.flatMap(buildPhaseContent),
        ...buildReferences(),
      ],
    },
  ],
});

// Fix typo Alignment IS -> AlignmentType
// Actually I made a typo - let me fix in file

const buffer = await Packer.toBuffer(doc);
const outDir = path.dirname(OUTPUT);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(OUTPUT, buffer);
console.log(`Documento gerado: ${OUTPUT} (${(buffer.length / 1024).toFixed(1)} KB)`);
