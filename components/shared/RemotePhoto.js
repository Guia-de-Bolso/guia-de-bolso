"use client";

/**
 * Foto remota servida direto do CDN — sem passar pelo Image Optimization da Vercel.
 * Use em miniaturas fixas e galerias cujas imagens já vêm comprimidas do Storage.
 *
 * @param {object} props
 * @param {string} props.src
 * @param {string} props.alt
 * @param {string} [props.className]
 * @param {boolean} [props.priority]
 * @param {boolean} [props.fill] - Preenche o container `relative` pai.
 * @returns {import("react").JSX.Element}
 */
export default function RemotePhoto({
  src,
  alt,
  className = "",
  priority = false,
  fill = false,
}) {
  const fillClass = fill ? "absolute inset-0 h-full w-full" : "";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      loading={priority ? "eager" : "lazy"}
      className={[fillClass, className].filter(Boolean).join(" ")}
    />
  );
}
