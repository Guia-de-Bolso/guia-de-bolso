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
 * @param {() => void} [props.onLoad] - Chamado quando a imagem termina de carregar.
 * @returns {import("react").JSX.Element}
 */
export default function RemotePhoto({
  src,
  alt,
  className = "",
  priority = false,
  fill = false,
  onLoad,
}) {
  const fillClass = fill ? "absolute inset-0 h-full w-full" : "";

  // Imagens vindas do cache do browser podem já estar completas antes de o
  // React anexar o handler, e nesse caso o evento `load` não dispara. O ref
  // cobre esse caso para não deixar o fade (`home-image-fade`) preso invisível.
  const handleImgRef = (node) => {
    if (node && node.complete && node.naturalWidth > 0) {
      onLoad?.();
    }
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={handleImgRef}
      src={src}
      alt={alt}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      loading={priority ? "eager" : "lazy"}
      onLoad={onLoad}
      className={[fillClass, className].filter(Boolean).join(" ")}
    />
  );
}
