import { SITE_CONTACT_EMAIL } from "./siteContact.js";

/** @typedef {{ id: string, title: string, paragraphs: string[] }} LegalSection */

export const LEGAL_RESPONSAVEL = {
  nome: "Bruno de Souza Disliler",
  email: SITE_CONTACT_EMAIL,
  produto: "Guia de Bolso",
  local: "Imbituba, Santa Catarina, Brasil",
};

export const LEGAL_LAST_UPDATED = "22 de maio de 2026";

/** @type {LegalSection[]} */
export const PRIVACIDADE_SECTIONS = [
  {
    id: "controlador",
    title: "1. Quem somos",
    paragraphs: [
      `O ${LEGAL_RESPONSAVEL.produto} é um aplicativo de descoberta turística e local para ${LEGAL_RESPONSAVEL.local}. O controlador dos dados pessoais tratados neste aplicativo é ${LEGAL_RESPONSAVEL.nome}, responsável pela operação do serviço.`,
      `Para exercer seus direitos ou tirar dúvidas sobre privacidade, entre em contato: ${LEGAL_RESPONSAVEL.email}.`,
    ],
  },
  {
    id: "dados",
    title: "2. Dados que coletamos",
    paragraphs: [
      "Dados de conta: ao criar conta via Google ou SMS, recebemos identificadores de autenticação, e-mail (quando disponível), telefone (no login por SMS), nome e foto de perfil fornecidos pelo provedor ou por você.",
      "Dados de uso: favoritos, avaliações, roteiros salvos, preferência de app de mapas, histórico de buscas com IA (quando logado) e interações registradas em nossa base (ex.: login, favoritar, abrir rota no mapa).",
      "Dados de localização: com sua permissão no navegador, usamos coordenadas aproximadas para calcular distâncias e sugerir lugares perto. Você pode negar o acesso; o app continua funcionando com informações fixas da região.",
      "Dados no dispositivo (localStorage): indicação de onboarding visto, preferência de mapa, histórico recente de lugares visitados e cache de uso de recursos premium no mesmo dia.",
      "Dados técnicos: logs de acesso e ações no app (data, tipo de ação, identificador de usuário quando autenticado) para segurança, suporte e melhoria do produto.",
      "Feedback voluntário: quando você envia sugestão, dúvida ou reporte de problema (Perfil → Ajuda e feedback), podemos armazenar tipo, mensagem, página de origem, nome e e-mail de contato opcionais e, se aplicável, detalhes técnicos que você autorizar (ex.: rota e código de erro) para investigação.",
    ],
  },
  {
    id: "finalidades",
    title: "3. Para que usamos seus dados",
    paragraphs: [
      "Prestar o serviço: exibir lugares, rotas, clima, busca com IA, favoritos, avaliações e perfil.",
      "Autenticação e segurança: validar sua identidade, proteger a conta e cumprir obrigações legais.",
      "Melhoria do produto: entender uso agregado, corrigir erros e evoluir funcionalidades.",
      "Comunicação: responder solicitações enviadas ao e-mail de contato.",
      "Não vendemos seus dados pessoais a terceiros.",
    ],
  },
  {
    id: "bases",
    title: "4. Bases legais (LGPD)",
    paragraphs: [
      "Execução de contrato ou procedimentos preliminares: cadastro, favoritos, avaliações e funcionalidades da conta.",
      "Consentimento: geolocalização no navegador, envio de SMS para login e, quando aplicável, comunicações opcionais.",
      "Legítimo interesse: logs de segurança, prevenção a fraudes e métricas agregadas de uso, sempre com impacto mínimo à sua privacidade.",
      "Cumprimento de obrigação legal: quando exigido por autoridade competente.",
    ],
  },
  {
    id: "terceiros",
    title: "5. Compartilhamento com terceiros",
    paragraphs: [
      "Supabase: hospedagem de banco de dados, autenticação e armazenamento de arquivos (EUA ou região configurada no projeto).",
      "Vercel: hospedagem e entrega do aplicativo web.",
      "Google: login OAuth e, quando você escolhe, abertura do Google Maps.",
      "Twilio (via Supabase Auth): envio de SMS com código de verificação.",
      "Anthropic (Claude): processamento de buscas e roteiros com IA — enviamos textos de consulta e contexto de lugares ativos, sem incluir dados sensíveis desnecessários.",
      "OpenWeatherMap: previsão do tempo para a região ou coordenadas do lugar.",
      "Apple: botão de login com Apple poderá ser habilitado no futuro; enquanto desativado, nenhum dado é enviado à Apple para autenticação.",
      "Apps de mapas (Google Maps, Apple Maps, Waze): apenas quando você toca em “Ir agora” ou links similares — o app abre o serviço escolhido; não controlamos o tratamento de dados desses apps.",
    ],
  },
  {
    id: "retencao",
    title: "6. Retenção e exclusão",
    paragraphs: [
      "Mantemos os dados enquanto sua conta estiver ativa ou conforme necessário para as finalidades descritas.",
      `Você pode solicitar exclusão da conta pelo app (Perfil → Excluir conta) ou pela página dedicada em /excluir-conta, o que remove favoritos, avaliações, roteiros e demais dados associados à conta, conforme descrito nessa página.`,
      "Logs e backups podem ser mantidos por período limitado por segurança e obrigações legais, depois eliminados ou anonimizados.",
    ],
  },
  {
    id: "direitos",
    title: "7. Seus direitos",
    paragraphs: [
      "Nos termos da Lei nº 13.709/2018 (LGPD), você pode solicitar: confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação, informação sobre compartilhamentos e revogação de consentimento.",
      `Envie pedidos para ${LEGAL_RESPONSAVEL.email} com assunto “Privacidade — Guia de Bolso”. Responderemos em prazo razoável.`,
      "Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).",
    ],
  },
  {
    id: "cookies",
    title: "8. Cookies e armazenamento local",
    paragraphs: [
      "Utilizamos cookies e tecnologias similares essenciais para sessão de login (Supabase Auth) e armazenamento local no navegador para preferências e experiência offline parcial.",
      "Não utilizamos, nesta versão, cookies de publicidade comportamental de terceiros no app.",
    ],
  },
  {
    id: "seguranca",
    title: "9. Segurança",
    paragraphs: [
      "Adotamos medidas técnicas e organizacionais adequadas ao porte do serviço, incluindo HTTPS, controle de acesso por autenticação e políticas de banco de dados (RLS) no Supabase.",
      "Nenhum sistema é 100% seguro; em caso de incidente relevante, buscaremos notificar usuários e autoridades conforme a lei.",
    ],
  },
  {
    id: "menores",
    title: "10. Crianças e adolescentes",
    paragraphs: [
      "O serviço não é direcionado a menores de 16 anos sem consentimento dos responsáveis. Se tomarmos conhecimento de cadastro indevido, poderemos excluir a conta.",
    ],
  },
  {
    id: "alteracoes",
    title: "11. Alterações desta política",
    paragraphs: [
      "Podemos atualizar este documento. A data da última versão aparece no topo. O uso continuado após alterações relevantes pode ser considerado aceitação, conforme aviso no app quando aplicável.",
    ],
  },
];

/** @type {LegalSection[]} */
export const EXCLUIR_CONTA_SECTIONS = [
  {
    id: "introducao",
    title: "1. Sobre a exclusão de conta",
    paragraphs: [
      `Esta página descreve como solicitar a exclusão da sua conta e dos dados associados no ${LEGAL_RESPONSAVEL.produto}, aplicativo de descoberta turística para ${LEGAL_RESPONSAVEL.local}.`,
      `Operador: ${LEGAL_RESPONSAVEL.nome}. Para dúvidas ou pedidos por e-mail: ${LEGAL_RESPONSAVEL.email}.`,
    ],
  },
  {
    id: "passos",
    title: "2. Como excluir sua conta no app",
    paragraphs: [
      "Abra o Guia de Bolso em https://guiadebolso.app (navegador ou app instalado).",
      "Faça login na conta que deseja excluir (Google ou SMS).",
      "Toque em Perfil no menu inferior da tela.",
      "Role até a seção Sessão e toque em Excluir conta.",
      "Leia o aviso e confirme em Excluir permanentemente. A exclusão é imediata e não pode ser desfeita.",
    ],
  },
  {
    id: "dados-excluidos",
    title: "3. Dados que são excluídos",
    paragraphs: [
      "Conta de autenticação (login Google ou SMS) e identificadores vinculados.",
      "Perfil: nome, foto de perfil, preferência de app de mapas e data de cadastro.",
      "Favoritos de lugares, avaliações publicadas, roteiros salvos e rotas favoritas.",
      "Histórico de buscas com IA associado à conta (logs_ia) e mensagens de feedback enviadas por você.",
      "Foto de avatar armazenada em nossos servidores, quando aplicável.",
    ],
  },
  {
    id: "dados-mantidos",
    title: "4. Dados que podem ser mantidos",
    paragraphs: [
      "Registros técnicos de acesso e segurança (logs) podem ser conservados por período limitado para prevenção a fraudes, suporte e cumprimento de obrigações legais, depois eliminados ou anonimizados.",
      "Backups temporários do provedor de infraestrutura podem reter cópias por curto prazo antes da eliminação definitiva.",
      "Conteúdo público de lugares, rotas curadas e demais informações do catálogo não vinculadas à sua conta permanecem no serviço.",
      "Dados armazenados apenas no seu dispositivo (localStorage), como histórico local de lugares visitados ou preferências em cache, não são apagados automaticamente pela exclusão da conta — você pode limpá-los nas configurações do navegador.",
    ],
  },
  {
    id: "prazo",
    title: "5. Prazo de processamento",
    paragraphs: [
      "A exclusão feita pelo app (Perfil → Excluir conta) é processada imediatamente após a confirmação.",
      `Pedidos enviados por e-mail para ${LEGAL_RESPONSAVEL.email} com assunto “Exclusão de conta — Guia de Bolso” são atendidos em até 15 dias úteis, mediante confirmação da identidade do titular.`,
    ],
  },
  {
    id: "sem-acesso",
    title: "6. Se você não conseguir acessar o app",
    paragraphs: [
      `Envie um e-mail para ${LEGAL_RESPONSAVEL.email} com assunto “Exclusão de conta — Guia de Bolso”, informando o e-mail ou telefone usado no cadastro.`,
      "Responderemos com orientações ou confirmaremos a exclusão após validarmos que você é o titular da conta.",
    ],
  },
];

/** @type {LegalSection[]} */
export const TERMOS_SECTIONS = [
  {
    id: "aceite",
    title: "1. Aceitação",
    paragraphs: [
      `Ao acessar ou usar o ${LEGAL_RESPONSAVEL.produto}, você concorda com estes Termos de Uso e com a Política de Privacidade. Se não concordar, não utilize o aplicativo.`,
      `Operador: ${LEGAL_RESPONSAVEL.nome} — contato: ${LEGAL_RESPONSAVEL.email}.`,
    ],
  },
  {
    id: "servico",
    title: "2. O serviço",
    paragraphs: [
      "O Guia de Bolso é uma plataforma digital de informação turística e local sobre Imbituba e região: lugares, categorias, rotas curadas, clima, busca com inteligência artificial e, para usuários logados, favoritos e avaliações.",
      "Grande parte do conteúdo pode ser consultada sem conta. Algumas funções exigem login (favoritos, avaliações, busca IA com limites diários, roteiros com IA, entre outras).",
      "Horários de funcionamento, distâncias e sugestões da IA são orientativos; confirme no estabelecimento ou no local antes de se deslocar.",
    ],
  },
  {
    id: "conta",
    title: "3. Conta e elegibilidade",
    paragraphs: [
      "Você deve fornecer informações verdadeiras e manter suas credenciais seguras. É proibido criar contas falsas ou usar o serviço para fins ilegais.",
      "Login disponível via Google, SMS e, quando habilitado no futuro, Apple. Você é responsável pelo uso da sua conta.",
    ],
  },
  {
    id: "uso",
    title: "4. Uso permitido",
    paragraphs: [
      "Você pode usar o app para fins pessoais e turísticos, respeitando a lei, outros usuários e estabelecimentos listados.",
      "É proibido: extrair dados em massa (scraping abusivo), tentar invadir sistemas, publicar avaliações ofensivas ou fraudulentas, usar bots não autorizados ou reproduzir conteúdo do app sem autorização.",
    ],
  },
  {
    id: "conteudo",
    title: "5. Conteúdo e avaliações",
    paragraphs: [
      "Textos, fotos e dados de lugares podem ser fornecidos por parceiros, administradores ou fontes públicas. Esforçamo-nos pela qualidade, mas não garantimos ausência total de erros ou desatualização.",
      "Avaliações de usuários passam por moderação. Reservamo-nos o direito de remover conteúdo que viole estes termos ou a legislação.",
    ],
  },
  {
    id: "ia",
    title: "6. Inteligência artificial",
    paragraphs: [
      "Buscas e roteiros gerados por IA são sugestões baseadas em dados cadastrados no momento da consulta. Não substituem planejamento próprio, condições de trânsito, maré, segurança em trilhas ou regras locais.",
      "Limites de uso diário podem aplicar-se a usuários não premium, conforme exibido no app.",
    ],
  },
  {
    id: "planos",
    title: "7. Planos pagos (futuro)",
    paragraphs: [
      "Funcionalidades ou planos pagos para estabelecimentos ou usuários premium poderão ser oferecidos futuramente, com preços e condições informados no momento da contratação, em documento ou tela específica.",
    ],
  },
  {
    id: "pi",
    title: "8. Propriedade intelectual",
    paragraphs: [
      "Marca, layout, textos institucionais e organização do Guia de Bolso pertencem ao operador ou licenciadores. Marcas de terceiros (Google, Apple, etc.) pertencem aos respectivos titulares.",
      "É vedada a cópia sistemática do catálogo ou do código do aplicativo sem autorização escrita.",
    ],
  },
  {
    id: "responsabilidade",
    title: "9. Limitação de responsabilidade",
    paragraphs: [
      "O app é fornecido “como está”, na medida permitida pela lei. Não nos responsabilizamos por danos indiretos, lucros cessantes ou decisões tomadas com base apenas em sugestões do app.",
      "Links para mapas, sites de estabelecimentos e redes sociais são de responsabilidade de terceiros.",
    ],
  },
  {
    id: "rescisao",
    title: "10. Encerramento",
    paragraphs: [
      "Você pode encerrar sua conta pelo app. Podemos suspender ou encerrar acesso em caso de violação grave destes termos ou exigência legal.",
    ],
  },
  {
    id: "lei",
    title: "11. Lei aplicável e foro",
    paragraphs: [
      "Estes termos são regidos pelas leis da República Federativa do Brasil.",
      "Fica eleito o foro da comarca de Imbituba/SC, com renúncia a outro, salvo direito do consumidor de optar pelo foro de seu domicílio quando aplicável o Código de Defesa do Consumidor.",
    ],
  },
  {
    id: "contato",
    title: "12. Contato",
    paragraphs: [
      `Dúvidas sobre estes termos: ${LEGAL_RESPONSAVEL.email}.`,
    ],
  },
];
