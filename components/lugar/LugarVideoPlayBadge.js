/**
 * Overlay de play nos cards quando o lugar tem vídeo no perfil público.
 * @param {object} props
 * @param {"sm"|"md"} [props.size="md"]
 * @param {string} [props.className]
 * @returns {import("react").JSX.Element}
 */
export default function LugarVideoPlayBadge({ size = "md", className = "" }) {
  const box = size === "sm" ? "h-8 w-8" : "h-12 w-12";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <span
      className={`pointer-events-none absolute z-[1] flex items-center justify-center ${
        className || "inset-0"
      }`.trim()}
      aria-hidden
    >
      <span
        className={`flex ${box} items-center justify-center rounded-full bg-black/50 shadow-sm ring-1 ring-white/35 backdrop-blur-[2px]`}
      >
        <svg viewBox="0 0 24 24" className={`${icon} translate-x-px text-white`} fill="currentColor">
          <path d="M8 5.14v13.72L19.12 12 8 5.14z" />
        </svg>
      </span>
    </span>
  );
}
