"use client";

import Link from "next/link";
import {
  CURADORIA_AVALIACOES_DIAS,
  PARCEIRO_MODALIDADE,
  PARCEIRO_STATUS,
  buildCuradoriaAvaliacoesFeita,
  formatDiasRestantesParceiro,
  getDiasAteCuradoria,
  getDiasRestantesParceiroGratis,
  getParceiroFimGratisISO,
  getParceiroModalidadeLabel,
  getParceiroStatusLabel,
} from "@/lib/parceiroAdmin";
import { hojeISO } from "@/lib/homeRotation";
import { addDaysISO } from "@/lib/lugarPurge";

/**
 * Campos do programa parceiro no formulário de local.
 * @param {object} props
 * @param {object} props.form
 * @param {(updater: object | ((current: object) => object)) => void} props.setForm
 * @param {boolean} props.columnReady
 * @param {string|null} [props.editingId]
 * @param {(patch: object) => Promise<void>} [props.onPatchSave]
 * @returns {import("react").JSX.Element|null}
 */
export default function ParceiroProgramaFields({
  form,
  setForm,
  columnReady,
  editingId,
  onPatchSave,
}) {
  if (!columnReady) {
    return (
      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950">
        Programa parceiro (prazos e curadoria) ainda não está ativo neste banco. Rode{" "}
        <code className="rounded bg-white px-1 py-0.5">
          supabase/lugares_parceiro_programa.sql
        </code>{" "}
        no SQL Editor do Supabase.
      </p>
    );
  }

  const hoje = hojeISO();
  const ehParceiro = Boolean(form.eh_parceiro);
  const modalidade =
    form.parceiro_modalidade || PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS;
  const diasGratis =
    modalidade === PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS
      ? getDiasRestantesParceiroGratis(form.parceiro_fim_em, hoje)
      : null;
  const diasCuradoria = getDiasAteCuradoria(form.proxima_curadoria_avaliacoes_em, hoje);

  /**
   * @param {string} field
   * @param {string} value
   */
  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  /**
   * @param {boolean} checked
   */
  function handleParceiroToggle(checked) {
    setForm((current) => {
      const next = { ...current, eh_parceiro: checked };
      if (checked && !current.parceiro_inicio_em) {
        next.parceiro_inicio_em = hoje;
        next.parceiro_modalidade =
          current.parceiro_modalidade || PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS;
        if (
          next.parceiro_modalidade === PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS &&
          !current.parceiro_fim_em
        ) {
          next.parceiro_fim_em = getParceiroFimGratisISO(hoje);
        }
        if (!current.parceiro_status || current.parceiro_status === PARCEIRO_STATUS.ENCERRADO) {
          next.parceiro_status = PARCEIRO_STATUS.ATIVO;
        }
        if (!current.proxima_curadoria_avaliacoes_em) {
          next.proxima_curadoria_avaliacoes_em = addDaysISO(
            hoje,
            CURADORIA_AVALIACOES_DIAS
          );
        }
      }
      if (!checked) {
        next.parceiro_status = PARCEIRO_STATUS.ENCERRADO;
      }
      return next;
    });
  }

  /**
   * @param {string} nextModalidade
   */
  function handleModalidadeChange(nextModalidade) {
    setForm((current) => {
      const inicio = current.parceiro_inicio_em || hoje;
      const next = {
        ...current,
        parceiro_modalidade: nextModalidade,
        parceiro_inicio_em: inicio,
      };
      if (nextModalidade === PARCEIRO_MODALIDADE.PAGO) {
        next.parceiro_fim_em = "";
        next.parceiro_status = PARCEIRO_STATUS.CONVERTIDO_PAGO;
      } else {
        next.parceiro_fim_em =
          current.parceiro_fim_em || getParceiroFimGratisISO(inicio);
        next.parceiro_status = PARCEIRO_STATUS.ATIVO;
      }
      return next;
    });
  }

  /**
   * @param {string} inicio
   */
  function handleInicioChange(inicio) {
    setForm((current) => {
      const next = { ...current, parceiro_inicio_em: inicio };
      if (
        (current.parceiro_modalidade || PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS) ===
        PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS
      ) {
        next.parceiro_fim_em = inicio ? getParceiroFimGratisISO(inicio) : "";
      }
      return next;
    });
  }

  async function handleMarcarCuradoria() {
    const patch = buildCuradoriaAvaliacoesFeita(hoje);
    setForm((current) => ({ ...current, ...patch }));
    if (editingId && onPatchSave) {
      await onPatchSave(patch);
    }
  }

  async function handleEncerrarParceria() {
    const patch = {
      eh_parceiro: false,
      parceiro_status: PARCEIRO_STATUS.ENCERRADO,
    };
    setForm((current) => ({ ...current, ...patch }));
    if (editingId && onPatchSave) {
      await onPatchSave(patch);
    }
  }

  async function handleConverterPago() {
    const patch = {
      eh_parceiro: true,
      parceiro_modalidade: PARCEIRO_MODALIDADE.PAGO,
      parceiro_fim_em: null,
      parceiro_status: PARCEIRO_STATUS.CONVERTIDO_PAGO,
    };
    setForm((current) => ({ ...current, ...patch }));
    if (editingId && onPatchSave) {
      await onPatchSave(patch);
    }
  }

  return (
    <div className="mt-4 space-y-4 rounded-xl bg-[#eef8f4] px-3 py-4 text-sm text-[#1a2e28]">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={ehParceiro}
          onChange={(e) => handleParceiroToggle(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-[#c5d5cf] text-[#1a4a3a]"
        />
        <span>
          <strong>Parceiro do Guia</strong>
          <span className="mt-0.5 block text-xs font-normal text-[#5a6b66]">
            Visível no app — carrossel, badge e perfil completo (R$ 299/mês após período
            gratuito).
          </span>
        </span>
      </label>

      {ehParceiro && (
        <div className="space-y-3 border-t border-[#d4ede8] pt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#5a6b66]">
              Modalidade
              <select
                value={modalidade}
                onChange={(e) => handleModalidadeChange(e.target.value)}
                className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm font-normal text-[#1a2e28] outline-none ring-[#1a4a3a]/20 focus:ring-2"
              >
                <option value={PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS}>
                  Lançamento — 6 meses grátis
                </option>
                <option value={PARCEIRO_MODALIDADE.PAGO}>Pago — R$ 299/mês</option>
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#5a6b66]">
              Status
              <select
                value={form.parceiro_status || PARCEIRO_STATUS.ATIVO}
                onChange={(e) => setField("parceiro_status", e.target.value)}
                className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm font-normal text-[#1a2e28] outline-none ring-[#1a4a3a]/20 focus:ring-2"
              >
                <option value={PARCEIRO_STATUS.ATIVO}>Ativo</option>
                <option value={PARCEIRO_STATUS.RENOVACAO_PENDENTE}>
                  Renovação pendente
                </option>
                <option value={PARCEIRO_STATUS.CONVERTIDO_PAGO}>Convertido pago</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#5a6b66]">
              Início da parceria
              <input
                type="date"
                value={form.parceiro_inicio_em || ""}
                onChange={(e) => handleInicioChange(e.target.value)}
                className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm font-normal outline-none ring-[#1a4a3a]/20 focus:ring-2"
              />
            </label>
            {modalidade === PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS ? (
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#5a6b66]">
                Fim do gratuito
                <input
                  type="date"
                  value={form.parceiro_fim_em || ""}
                  onChange={(e) => setField("parceiro_fim_em", e.target.value)}
                  className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm font-normal outline-none ring-[#1a4a3a]/20 focus:ring-2"
                />
                {diasGratis !== null && (
                  <span className="mt-1 block text-xs font-normal text-[#5a6b66]">
                    {formatDiasRestantesParceiro(diasGratis)}
                  </span>
                )}
              </label>
            ) : (
              <p className="flex items-end text-xs text-[#5a6b66]">
                Plano pago — sem data de término automática.
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#5a6b66]">
              Última curadoria de avaliações
              <input
                type="date"
                value={form.ultima_curadoria_avaliacoes_em || ""}
                onChange={(e) =>
                  setField("ultima_curadoria_avaliacoes_em", e.target.value)
                }
                className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm font-normal outline-none ring-[#1a4a3a]/20 focus:ring-2"
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#5a6b66]">
              Próxima curadoria
              <input
                type="date"
                value={form.proxima_curadoria_avaliacoes_em || ""}
                onChange={(e) =>
                  setField("proxima_curadoria_avaliacoes_em", e.target.value)
                }
                className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm font-normal outline-none ring-[#1a4a3a]/20 focus:ring-2"
              />
              {diasCuradoria !== null && (
                <span
                  className={`mt-1 block text-xs font-normal ${
                    diasCuradoria < 0 ? "text-red-600" : "text-[#5a6b66]"
                  }`}
                >
                  {diasCuradoria < 0
                    ? `Atrasada há ${Math.abs(diasCuradoria)} dias`
                    : diasCuradoria === 0
                      ? "Hoje"
                      : `Em ${diasCuradoria} dias`}
                </span>
              )}
            </label>
          </div>

          <label className="block text-xs font-semibold uppercase tracking-wide text-[#5a6b66]">
            Notas internas (só admin)
            <textarea
              value={form.parceiro_notas_internas || ""}
              onChange={(e) => setField("parceiro_notas_internas", e.target.value)}
              rows={2}
              placeholder="Ex.: amigo lançamento, combinado 6 meses grátis…"
              className="mt-1 w-full resize-y rounded-xl bg-white px-3 py-2 text-sm font-normal outline-none ring-[#1a4a3a]/20 focus:ring-2"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleMarcarCuradoria}
              className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#1a4a3a] ring-1 ring-[#c5d5cf] hover:bg-[#f7faf9]"
            >
              Marcar curadoria feita
            </button>
            {editingId && (
              <Link
                href={`/admin/avaliacoes?lugar_id=${editingId}&tab=aprovado`}
                className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#1a4a3a] ring-1 ring-[#c5d5cf] hover:bg-[#f7faf9]"
              >
                Revisar avaliações
              </Link>
            )}
            {editingId && (
              <button
                type="button"
                onClick={handleConverterPago}
                className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-200"
              >
                Converter para pago
              </button>
            )}
            {editingId && ehParceiro && (
              <button
                type="button"
                onClick={handleEncerrarParceria}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                Encerrar parceria
              </button>
            )}
          </div>

          <p className="text-xs text-[#5a6b66]">
            {getParceiroModalidadeLabel(modalidade)} ·{" "}
            {getParceiroStatusLabel(form.parceiro_status)}
          </p>
        </div>
      )}

      <label className="flex cursor-pointer items-start gap-3 border-t border-[#d4ede8] pt-3">
        <input
          type="checkbox"
          checked={Boolean(form.conteudo_curadoria)}
          onChange={(e) =>
            setForm((current) => ({
              ...current,
              conteudo_curadoria: e.target.checked,
            }))
          }
          className="mt-1 h-4 w-4 rounded border-[#c5d5cf] text-[#1a4a3a]"
        />
        <span>
          <strong>Curadoria do Guia</strong>
          <span className="mt-0.5 block text-xs font-normal text-[#5a6b66]">
            Conteúdo curado pela equipe (praia, trilha…) — hero e Em alta hoje.
          </span>
        </span>
      </label>
    </div>
  );
}
