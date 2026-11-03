/**
 * Ícones lineares do guia de roteiro.
 */

/**
 * @param {object} props
 * @param {string} [props.className]
 * @returns {import("react").JSX.Element}
 */
export function IconBookmark({ className = "h-5 w-5", filled = false }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M7 4.5h10A1.5 1.5 0 0 1 18.5 6v14l-6.5-3.4L5.5 20V6A1.5 1.5 0 0 1 7 4.5Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * @param {object} props
 * @param {string} [props.className]
 * @returns {import("react").JSX.Element}
 */
export function IconNavigate({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 11.2 20 4l-7.2 16-1.6-6.2L4 11.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * @param {object} props
 * @param {string} [props.className]
 * @returns {import("react").JSX.Element}
 */
export function IconCheck({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5 9.2 17 19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * @param {object} props
 * @param {string} [props.className]
 * @param {boolean} [props.open]
 * @returns {import("react").JSX.Element}
 */
export function IconChevron({ className = "h-4 w-4", open = false }) {
  return (
    <svg
      className={`${className} transition-transform duration-200 motion-reduce:transition-none ${
        open ? "rotate-180" : ""
      }`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 9.5 12 15.5 18 9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * @param {object} props
 * @param {"manha"|"tarde"|"noite"|null} [props.id]
 * @returns {import("react").JSX.Element}
 */
export function IconPeriodo({ id }) {
  if (id === "noite") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M15.5 3.5a8.2 8.2 0 1 0 5 12.2A7 7 0 0 1 15.5 3.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (id === "tarde") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12 3.5v1.8M12 18.7v1.8M3.5 12h1.8M18.7 12h1.8M6 6l1.3 1.3M16.7 16.7 18 18M18 6l-1.3 1.3M7.3 16.7 6 18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 16.5h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7 16.5a5 5 0 0 1 10 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 7.5V5.2M8.2 9.2 6.6 7.6M15.8 9.2l1.6-1.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
