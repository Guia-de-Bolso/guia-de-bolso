"use client";

import {
  PERFIL_PROMO_FIM_PADRAO,
  formatDiasRestantesPerfilPromo,
  getDiasRestantesPerfilPromo,
  isSubcategoriaPresenca,
} from "@/lib/planoLancamento";
import { hojeISO } from "@/lib/homeRotation";
import { normalizeDateISO } from "@/lib/parceiroAdmin";

/**
 * Campos da promo de perfil completo (fase de lançamento).
 * @param {object} props
 * @param {object} props.form
 * @param {(updater: object | ((current: object) => object)) => void} props.setForm
 * @param {boolean} props.columnReady
 * @param {boolean} [props.showPresets=true]
 * @returns {import("react").JSX.Element|null}
 */
export default function PerfilPromoFields({ form, setForm, columnReady, showPresets = true }) {
  if (!columnReady) {
    return (
      <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950">
        Promo de perfil completo ainda não está ativa neste banco. Rode{" "}
        <code className="rounded bg-white px-1 py-0.5">supabase/lugares_plano_lancamento_bulk.sql</code>{" "}
        no SQL Editor do Supabase (cria a coluna e classifica os planos).
      </p>
    );
  }

  const hoje = hojeISO();
  const promoAtivo = Boolean(form.perfil_promo_ate);
  const diasRestantes = promoAtivo
    ? getDiasRestantesPerfilPromo(form.perfil_promo_ate, hoje)
    : null;

  /**
   * @param {boolean} checked
   */
  function handlePromoToggle(checked) {
    setForm((current) => ({
      ...current,
      perfil_promo_ativo: checked,
      perfil_promo_ate: checked
        ? normalizeDateISO(current.perfil_promo_ate) || PERFIL_PROMO_FIM_PADRAO
        : null,
    }));
  }

  /**
   * @param {"presenca"|"lancamento"} preset
   */
  function applyPreset(preset) {
    if (preset === "presenca") {
      setForm((current) => {
        const categoria =
          current.categoria === "Natureza" || current.categoria === "Aventura"
            ? "Serviços"
            : current.categoria;
        const subcategoria =
          current.subcategoria ||
          (categoria === "Serviços" ? "Farmácias" : current.subcategoria);

        return {
          ...current,
          categoria,
          subcategoria,
          perfil_promo_ativo: false,
          perfil_promo_ate: null,
          eh_parceiro: false,
        };
      });
      return;
    }

    setForm((current) => {
      const categoria =
        current.categoria === "Natureza" || current.categoria === "Aventura"
          ? "Gastronomia"
          : current.categoria;
      const subcategoria =
        current.subcategoria && !isSubcategoriaPresenca(current.subcategoria)
          ? current.subcategoria
          : categoria === "Gastronomia"
            ? "Restaurantes"
            : current.subcategoria;

      return {
        ...current,
        categoria,
        subcategoria,
        perfil_promo_ativo: true,
        perfil_promo_ate: PERFIL_PROMO_FIM_PADRAO,
        eh_parceiro: false,
      };
    });
  }

  return (
    <section className="mt-6 rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#1a2e28]">Plano de lançamento</h3>
          <p className="mt-1 text-xs text-[#5a6b66]">
            <strong>Presença</strong> (padrão): perfil completo permanente para farmácias,
            mercados, mecânicos e saúde — sem cobrança e sem CTA de upgrade.{" "}
            <strong>Lançamento</strong>: perfil completo grátis até a data abaixo — use
            em restaurantes e experiências que você quer destacar antes de cobrar.
          </p>
        </div>
      </div>

      {showPresets && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset("presenca")}
            className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Utilitário (Presença)
          </button>
          <button
            type="button"
            onClick={() => applyPreset("lancamento")}
            className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-50"
          >
            Experiência (Lançamento)
          </button>
          <span className="self-center text-[11px] text-[#5a6b66]">
            Atalhos para cadastro em massa — ajuste categoria depois se precisar.
          </span>
        </div>
      )}

      <label className="mt-4 flex items-start gap-3 text-sm font-semibold text-[#1a2e28]">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={promoAtivo}
          onChange={(event) => handlePromoToggle(event.target.checked)}
        />
        <span>
          Perfil completo gratuito (lançamento)
          {promoAtivo && diasRestantes !== null && (
            <span className="mt-0.5 block text-xs font-normal text-sky-800">
              {formatDiasRestantesPerfilPromo(diasRestantes)}
            </span>
          )}
        </span>
      </label>

      {promoAtivo && (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="block text-sm font-semibold text-[#1a2e28]">
            Válido até
            <input
              type="date"
              value={normalizeDateISO(form.perfil_promo_ate) || PERFIL_PROMO_FIM_PADRAO}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  perfil_promo_ativo: true,
                  perfil_promo_ate: event.target.value,
                }))
              }
              className="mt-1 block rounded-xl bg-white px-3 py-2 text-sm font-normal outline-none ring-[#1a4a3a]/20 focus:ring-2"
            />
          </label>
          <button
            type="button"
            onClick={() =>
              setForm((current) => ({
                ...current,
                perfil_promo_ativo: true,
                perfil_promo_ate: PERFIL_PROMO_FIM_PADRAO,
              }))
            }
            className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-sky-800 ring-1 ring-sky-200 hover:bg-sky-100"
          >
            Usar padrão (fev/2027)
          </button>
        </div>
      )}

      <p className="mt-3 text-[11px] text-[#5a6b66]">
        Após a data, o local volta ao perfil básico (Presença) automaticamente. Para
        visibilidade premium (carrossel, badge Parceiro), marque{" "}
        <strong>Parceiro</strong> abaixo quando for cobrar.
      </p>
    </section>
  );
}
