/**
 * Extrai nome de exibição do usuário autenticado.
 * @param {import('@supabase/supabase-js').User|null|undefined} user
 * @returns {string|null}
 */
function userName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    null
  );
}

/**
 * Registra ação do usuário na tabela `logs` (falhas são silenciosas).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {import('@supabase/supabase-js').User|null|undefined} user
 * @param {string} acao - Identificador da ação (ex.: `login`, `favoritou`).
 * @param {Record<string, unknown>} [detalhes] - Metadados adicionais.
 * @returns {Promise<void>}
 */
export async function registrarLog(supabase, user, acao, detalhes = {}) {
  try {
    await supabase.from("logs").insert({
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      user_nome: userName(user),
      acao,
      detalhes,
    });
  } catch (error) {
    console.error("Erro ao registrar log:", error);
  }
}

/**
 * Formata linha de log para exibição legível no admin.
 * @param {{ acao: string, detalhes?: Record<string, unknown> }} log
 * @returns {string}
 */
export function formatarAcaoLog(log) {
  const detalhes = log.detalhes || {};
  const appLabels = {
    google: "Google Maps",
    apple: "Apple Maps",
    waze: "Waze",
  };

  const labels = {
    login: "Fez login",
    logout: "Fez logout",
    favoritou: `Favoritou ${detalhes.lugar_nome || detalhes.rota_nome || "um item"}`,
    desfavoritou: `Desfavoritou ${detalhes.lugar_nome || detalhes.rota_nome || "um item"}`,
    ir_agora: `Clicou IR AGORA no ${
      appLabels[detalhes.app] || detalhes.app || "app de navegação"
    }`,
    visualizou_lugar: `Visualizou ${detalhes.lugar_nome || "um local"}`,
    escaneou_qr: `Escaneou QR de ${detalhes.lugar_nome || "um local"}`,
    acessou_app: "Acessou o app",
    acesso_app: "Acessou o app",
    deletou_conta: "Solicitou exclusão da conta",
    admin_excluiu_usuario: `Excluiu conta de ${detalhes.alvo_nome || detalhes.alvo_email || "usuário"}`,
    excluiu_lugar_inativo: "Excluiu local inativo (retenção 30 dias)",
  };

  return labels[log.acao] || log.acao;
}

/**
 * Retorna badge visual (rótulo + classes Tailwind) para tipo de ação.
 * @param {string} acao
 * @returns {{ label: string, className: string }}
 */
export function getLogAcaoBadge(acao) {
  const badges = {
    acessou_app: { label: "Acesso ao app", className: "bg-blue-100 text-blue-700" },
    favoritou: { label: "Favorito", className: "bg-purple-100 text-purple-700" },
    desfavoritou: { label: "Favorito", className: "bg-purple-100 text-purple-700" },
    ir_agora: { label: "IR AGORA", className: "bg-emerald-100 text-emerald-700" },
    visualizou_lugar: { label: "Visualização", className: "bg-sky-100 text-sky-700" },
    escaneou_qr: { label: "QR Code", className: "bg-teal-100 text-teal-800" },
    acesso_app: { label: "Acesso", className: "bg-blue-100 text-blue-700" },
    login: { label: "Login", className: "bg-gray-100 text-gray-600" },
    logout: { label: "Logout", className: "bg-gray-100 text-gray-600" },
    deletou_conta: { label: "Exclusão de conta", className: "bg-red-100 text-red-800" },
    admin_excluiu_usuario: {
      label: "Admin excluiu usuário",
      className: "bg-red-100 text-red-800",
    },
    excluiu_lugar_inativo: {
      label: "Local excluído (inativo)",
      className: "bg-red-100 text-red-800",
    },
  };

  return (
    badges[acao] || {
      label: acao || "Ação",
      className: "bg-gray-100 text-gray-600",
    }
  );
}

/**
 * Formata objeto `detalhes` do log para texto secundário na listagem.
 * @param {Record<string, unknown>} [detalhes]
 * @returns {string}
 */
export function formatarDetalhesLog(detalhes = {}) {
  const appLabels = {
    google_maps: "Google Maps",
    google: "Google Maps",
    apple: "Apple Maps",
    waze: "Waze",
  };

  const metodoLabels = {
    google: "Google",
    apple: "Apple",
    waze: "Waze",
  };

  if (detalhes.pagina) return `Página: ${detalhes.pagina}`;
  if (detalhes.app) return appLabels[detalhes.app] || String(detalhes.app);
  if (detalhes.metodo) return metodoLabels[detalhes.metodo] || String(detalhes.metodo);
  if (detalhes.lugar_nome) return String(detalhes.lugar_nome);
  if (detalhes.rota_nome) return String(detalhes.rota_nome);
  if (detalhes.lugar_id) return `Local #${detalhes.lugar_id}`;
  if (detalhes.rota_id) return `Atrativo #${detalhes.rota_id}`;

  const entries = Object.entries(detalhes).filter(([, value]) => value !== null && value !== "");
  if (entries.length === 0) return "—";

  return entries.map(([key, value]) => `${key}: ${value}`).join(" · ");
}
