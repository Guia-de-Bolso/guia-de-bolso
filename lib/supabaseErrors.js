/**
 * @param {{ message?: string, code?: string }|null|undefined} error
 * @returns {boolean}
 */
export function isMissingTableError(error) {
  const msg = String(error?.message ?? "").toLowerCase();
  const code = String(error?.code ?? "");
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("could not find the table")
  );
}
