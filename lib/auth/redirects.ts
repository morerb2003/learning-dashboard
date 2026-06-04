const DEFAULT_REDIRECT_PATH = "/";

export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback = DEFAULT_REDIRECT_PATH
) {
  if (!value) return fallback;

  const redirectPath = value.trim();

  if (
    !redirectPath.startsWith("/") ||
    redirectPath.startsWith("//") ||
    redirectPath.startsWith("/\\") ||
    /[\u0000-\u001f\u007f]/.test(redirectPath)
  ) {
    return fallback;
  }

  return redirectPath;
}
