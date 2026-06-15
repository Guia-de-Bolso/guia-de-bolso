import { SITE_CONTACT_EMAIL } from "./siteContact.js";

/** @typedef {{ id: string, title: string, paragraphs: string[] }} LegalSection */

export const LEGAL_RESPONSAVEL = {
  nome: "Bruno de Souza Disliler",
  email: SITE_CONTACT_EMAIL,
  produto: "Guia de Bolso",
  local: "Imbituba, Santa Catarina, Brasil",
};

export const LEGAL_LAST_UPDATED = "11 de junho de 2026";

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
      "Dados de conta: ao criar conta via Google, SMS ou Sign in with Apple (na versão iOS), recebemos identificadores de autenticação, e-mail (quando disponível ou autorizado), telefone (no login por SMS), nome e foto de perfil fornecidos pelo provedor ou por você.",
      "Dados de uso: favoritos, avaliações, roteiros salvos, preferência de app de mapas, registros de uso de recursos com IA (quantidade de buscas e roteiros no dia, quando logado) e interações registradas em nossa base (ex.: login, favoritar, abrir rota no mapa).",
      "Dados de localização: com sua permissão no navegador ou no dispositivo, usamos coordenadas aproximadas para calcular distâncias e sugerir lugares perto. Você pode negar o acesso; o app continua funcionando com informações fixas da região.",
      "Dados no dispositivo (localStorage): indicação de onboarding visto, preferência de mapa, histórico recente de lugares visitados e cache de uso de recursos premium no mesmo dia.",
      "Dados de conexão: endereço IP e informações do navegador ou dispositivo (user-agent) podem ser usados temporariamente para limitar abuso (ex.: excesso de buscas com IA ou envio de feedback) e, no feedback, para diagnóstico técnico.",
      "Dados técnicos: logs de acesso e ações no app (data, tipo de ação, identificador de usuário quando autenticado) para segurança, suporte e melhoria do produto.",
      "Feedback voluntário: quando você envia sugestão, dúvida ou reporte de problema (Perfil → Ajuda e feedback), podemos armazenar tipo, mensagem, página de origem, nome e e-mail de contato opcionais e, se aplicável, detalhes técnicos que você autorizar (ex.: rota, código de erro e user-agent) para investigação.",
      "Lista de espera: se você se cadastrar na landing page, armazenamos seu e-mail e confirmação de aceite desta política para envio de comunicações sobre o lançamento.",
    ],
  },
  {
    id: "finalidades",
    title: "3. Para que usamos seus dados",
    paragraphs: [
      "Prestar o serviço: exibir lugares, atrativos, clima, busca com IA, favoritos, avaliações e perfil.",
      "Autenticação e segurança: validar sua identidade, proteger a conta e cumprir obrigações legais.",
      "Moderação de conteúdo: analisar automaticamente avaliações enviadas para detectar conteúdo ofensivo, spam ou fraude, antes ou depois da publicação.",
      "Melhoria do produto: entender uso agregado, corrigir erros e evoluir funcionalidades.",
      "Comunicação: responder solicitações enviadas ao e-mail de contato e, quando aplicável, enviar confirmações da lista de espera.",
      "Não vendemos seus dados pessoais a terceiros.",
    ],
  },
  {
    id: "bases",
    title: "4. Bases legais (LGPD)",
    paragraphs: [
      "Execução de contrato ou procedimentos preliminares: cadastro, favoritos, avaliações e funcionalidades da conta.",
      "Consentimento: geolocalização no navegador ou dispositivo, envio de SMS para login, cadastro na lista de espera e, quando aplicável, comunicações opcionais.",
      "Legítimo interesse: logs de segurança, prevenção a fraudes, moderação automatizada de avaliações e métricas agregadas de uso, sempre com impacto mínimo à sua privacidade.",
      "Cumprimento de obrigação legal: quando exigido por autoridade competente.",
    ],
  },
  {
    id: "terceiros",
    title: "5. Compartilhamento com terceiros",
    paragraphs: [
      "Supabase: hospedagem de banco de dados, autenticação e armazenamento de arquivos (EUA ou região configurada no projeto).",
      "Vercel: hospedagem e entrega do aplicativo web.",
      "Google: login OAuth, visualização estática de mapas em páginas de lugares (quando configurado) e, quando você escolhe, abertura do Google Maps.",
      "Twilio (via Supabase Auth): envio de SMS com código de verificação.",
      "Anthropic (Claude): buscas e roteiros com IA; moderação automática de avaliações. Enviamos textos das suas consultas, preferências de roteiro, dados públicos de lugares do catálogo e, quando você envia uma avaliação, o texto, a nota e o contexto do lugar para análise de conteúdo. Não enviamos e-mail, telefone ou coordenadas GPS para esse fim.",
      "Open-Meteo: dados meteorológicos. Quando você consulta o clima, seu navegador ou dispositivo pode enviar coordenadas (do lugar ou da região) diretamente a esse serviço.",
      "Resend: envio de e-mails transacionais (ex.: confirmação de cadastro na lista de espera), quando você se inscreve na landing page.",
      "Apple (Sign in with Apple): na versão para iOS (App Store), login com Apple estará disponível antes do lançamento, conforme exigências da plataforma. Enquanto não habilitado, nenhum dado de autenticação é enviado à Apple. Quando ativo, recebemos identificadores de login, e-mail (se você autorizar compartilhar) e nome conforme suas preferências na Apple.",
      "Apps de mapas (Google Maps, Apple Maps, Waze): apenas quando você toca em “Ir agora” ou links similares — o app abre o serviço escolhido; não controlamos o tratamento de dados desses apps.",
    ],
  },
  {
    id: "transferencia",
    title: "6. Transferência internacional de dados",
    paragraphs: [
      "Seus dados podem ser processados em servidores fora do Brasil, principalmente nos Estados Unidos, pelos provedores listados na seção 5 (Supabase, Vercel, Google, Twilio, Anthropic, Open-Meteo, Resend e Apple, quando aplicável).",
      "Adotamos medidas contratuais e técnicas compatíveis com a LGPD para proteger esses dados no exterior, incluindo criptografia em trânsito (HTTPS) e controles de acesso.",
    ],
  },
  {
    id: "ia",
    title: "7. Processamento automatizado e IA",
    paragraphs: [
      "Usamos processamento automatizado (inteligência artificial) para sugerir lugares, gerar roteiros e moderar avaliações enviadas por usuários.",
      "Essas decisões não produzem efeitos legais sobre você. Em moderação, uma avaliação pode ser bloqueada ou removida conforme nossas regras de uso e termos do serviço.",
      "Sugestões de busca e roteiros são orientativas e baseadas no catálogo disponível no momento da consulta; não substituem seu próprio julgamento sobre segurança, trânsito, maré ou condições locais.",
    ],
  },
  {
    id: "retencao",
    title: "8. Retenção e exclusão",
    paragraphs: [
      "Mantemos os dados enquanto sua conta estiver ativa ou conforme necessário para as finalidades descritas nesta política.",
      "Você pode solicitar exclusão da conta pelo app (Perfil → Excluir conta). Isso remove favoritos, avaliações, roteiros, perfil, foto de avatar e dados de autenticação associados à sua conta.",
      "Registros técnicos de segurança (logs) podem ser mantidos por período limitado, anonimizados ou desvinculados da sua identidade, depois eliminados conforme nossa política de retenção.",
      "Dados armazenados localmente no seu dispositivo (preferências, cache, histórico recente de visitas) permanecem até você limpar os dados do app ou do navegador.",
      "Backups podem ser mantidos por período limitado por segurança e obrigações legais, depois eliminados ou anonimizados.",
    ],
  },
  {
    id: "direitos",
    title: "9. Seus direitos",
    paragraphs: [
      "Nos termos da Lei nº 13.709/2018 (LGPD), você pode solicitar: confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação, informação sobre compartilhamentos e revogação de consentimento.",
      `Envie pedidos para ${LEGAL_RESPONSAVEL.email} com assunto “Privacidade — Guia de Bolso”. Responderemos em até 15 dias, prorrogáveis por mais 15 dias conforme art. 18, §5º da LGPD, quando necessário.`,
      "Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).",
    ],
  },
  {
    id: "cookies",
    title: "10. Cookies e armazenamento local",
    paragraphs: [
      "Utilizamos cookies e tecnologias similares essenciais para sessão de login (Supabase Auth) e armazenamento local no navegador para preferências e experiência offline parcial.",
      "Não utilizamos, nesta versão, cookies de publicidade comportamental de terceiros no app.",
      "Consultas feitas pelo seu navegador ou dispositivo a serviços como Open-Meteo e Google Maps não utilizam cookies do Guia de Bolso, mas esses serviços podem registrar a requisição conforme suas próprias políticas de privacidade.",
    ],
  },
  {
    id: "plataformas",
    title: "11. Versão em lojas de aplicativos",
    paragraphs: [
      "O Guia de Bolso pode ser distribuído na App Store (iOS) e Google Play (Android) por meio de um aplicativo nativo que exibe o mesmo serviço web em um componente de navegação do sistema.",
      "Permissões de localização, armazenamento e notificações (quando disponíveis) seguem as regras do sistema operacional. Você pode conceder, negar ou revogar essas permissões nas configurações do dispositivo a qualquer momento.",
    ],
  },
  {
    id: "planos",
    title: "12. Planos pagos",
    paragraphs: [
      "Funcionalidades premium ou planos pagos podem ser exibidos no app, mas a cobrança recorrente ainda não está disponível nesta versão.",
      "Quando planos pagos forem oferecidos, informaremos preço, periodicidade, renovação automática, cancelamento e processador de pagamento (ex.: Apple App Store, Google Play ou parceiro brasileiro) em atualização desta política e na tela de contratação.",
    ],
  },
  {
    id: "notificacoes",
    title: "13. Notificações push",
    paragraphs: [
      "Notificações push ainda não estão disponíveis nesta versão.",
      "Quando forem implementadas, solicitaremos seu consentimento antes de enviar alertas. Você poderá desativá-las nas configurações do dispositivo ou do app.",
    ],
  },
  {
    id: "seguranca",
    title: "14. Segurança",
    paragraphs: [
      "Adotamos medidas técnicas e organizacionais adequadas ao porte do serviço, incluindo HTTPS, controle de acesso por autenticação e políticas de banco de dados (RLS) no Supabase.",
      "Nenhum sistema é 100% seguro; em caso de incidente relevante, buscaremos notificar usuários e autoridades conforme a lei.",
    ],
  },
  {
    id: "menores",
    title: "15. Crianças e adolescentes",
    paragraphs: [
      "O serviço não é direcionado a menores de 16 anos sem consentimento dos responsáveis. Se tomarmos conhecimento de cadastro indevido, poderemos excluir a conta.",
    ],
  },
  {
    id: "alteracoes",
    title: "16. Alterações desta política",
    paragraphs: [
      "Podemos atualizar este documento. A data da última versão aparece no topo. O uso continuado após alterações relevantes pode ser considerado aceitação, conforme aviso no app quando aplicável.",
    ],
  },
];

/** @type {LegalSection[]} */
export const EXCLUIR_CONTA_SECTIONS = [
  {
    id: "introducao",
    title: "1. Sobre a exclusao de conta",
    paragraphs: [
      `Esta pagina descreve como solicitar a exclusao da sua conta e dos dados associados no ${LEGAL_RESPONSAVEL.produto}, aplicativo de descoberta turistica para ${LEGAL_RESPONSAVEL.local}.`,
      `Operador: ${LEGAL_RESPONSAVEL.nome}. Para duvidas ou pedidos por e-mail: ${LEGAL_RESPONSAVEL.email}.`,
    ],
  },
  {
    id: "passos",
    title: "2. Como excluir sua conta no app",
    paragraphs: [
      "Abra o Guia de Bolso em https://guiadebolso.app (navegador ou app instalado).",
      "Faca login na conta que deseja excluir (Google, SMS ou Sign in with Apple na versao iOS).",
      "Toque em Perfil no menu inferior da tela.",
      "Role ate a secao Sessao e toque em Excluir conta.",
      "Leia o aviso e confirme em Excluir permanentemente. A exclusao e imediata e nao pode ser desfeita.",
    ],
  },
  {
    id: "dados-excluidos",
    title: "3. Dados que sao excluidos",
    paragraphs: [
      "Conta de autenticacao (login Google, SMS ou Apple) e identificadores vinculados.",
      "Perfil: nome, foto de perfil, preferencia de app de mapas e data de cadastro.",
      "Favoritos de lugares, avaliacoes publicadas, roteiros salvos e atrativos favoritos.",
      "Registros de uso de recursos com IA associados a conta e mensagens de feedback enviadas por voce.",
      "Foto de avatar armazenada em nossos servidores, quando aplicavel.",
    ],
  },
  {
    id: "dados-mantidos",
    title: "4. Dados que podem ser mantidos",
    paragraphs: [
      "Registros tecnicos de acesso e seguranca (logs) podem ser conservados por periodo limitado para prevencao a fraudes, suporte e cumprimento de obrigacoes legais, depois eliminados ou anonimizados.",
      "Backups temporarios do provedor de infraestrutura podem reter copias por curto prazo antes da eliminacao definitiva.",
      "Conteudo publico de lugares, atrativos curados e demais informacoes do catalogo nao vinculadas a sua conta permanecem no servico.",
      "Dados armazenados apenas no seu dispositivo (localStorage), como historico local de lugares visitados ou preferencias em cache, nao sao apagados automaticamente pela exclusao da conta — voce pode limpa-los nas configuracoes do navegador.",
    ],
  },
  {
    id: "prazo",
    title: "5. Prazo de processamento",
    paragraphs: [
      "A exclusao feita pelo app (Perfil -> Excluir conta) e processada imediatamente apos a confirmacao.",
      `Pedidos enviados por e-mail para ${LEGAL_RESPONSAVEL.email} com assunto "Exclusao de conta — Guia de Bolso" sao atendidos em ate 15 dias uteis, mediante confirmacao da identidade do titular.`,
    ],
  },
  {
    id: "sem-acesso",
    title: "6. Se voce nao conseguir acessar o app",
    paragraphs: [
      `Envie um e-mail para ${LEGAL_RESPONSAVEL.email} com assunto "Exclusao de conta — Guia de Bolso", informando o e-mail ou telefone usado no cadastro.`,
      "Responderemos com orientacoes ou confirmaremos a exclusao apos validarmos que voce e o titular da conta.",
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
      "O Guia de Bolso é uma plataforma digital de informação turística e local sobre Imbituba e região: lugares, categorias, atrativos curados, clima, busca com inteligência artificial e, para usuários logados, favoritos e avaliações.",
      "Grande parte do conteúdo pode ser consultada sem conta. Algumas funções exigem login (favoritos, avaliações, busca IA com limites diários, roteiros com IA, entre outras).",
      "Horários de funcionamento, distâncias e sugestões da IA são orientativos; confirme no estabelecimento ou no local antes de se deslocar.",
    ],
  },
  {
    id: "conta",
    title: "3. Conta e elegibilidade",
    paragraphs: [
      "Você deve fornecer informações verdadeiras e manter suas credenciais seguras. É proibido criar contas falsas ou usar o serviço para fins ilegais.",
      "Login disponível via Google, SMS e, na versão iOS (App Store), Sign in with Apple antes do lançamento. Você é responsável pelo uso da sua conta.",
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
      "Avaliações de usuários podem passar por moderação manual e automatizada (incluindo análise por IA). Reservamo-nos o direito de remover conteúdo que viole estes termos ou a legislação.",
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
      "Funcionalidades ou planos pagos para estabelecimentos ou usuários premium poderão ser oferecidos futuramente. Nesta versão, a cobrança recorrente ainda não está disponível.",
      "Quando disponíveis, preços, condições de renovação, cancelamento e processador de pagamento serão informados no momento da contratação, em documento ou tela específica.",
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
