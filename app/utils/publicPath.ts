/**
 * Resolves a `/`-prefixed public asset against the deploy base path.
 *
 * Head tags and other raw URLs are emitted verbatim, so without this a
 * "/favicon.ico" points at the domain root and 404s when the site is served
 * from a subpath — the GitHub Pages deploy sets NUXT_APP_BASE_URL=/ai-slops/.
 */
export function publicPath(path: string): string {
  const baseURL = useRuntimeConfig().app.baseURL
  const base = baseURL.endsWith('/') ? baseURL : `${baseURL}/`
  return `${base}${path.replace(/^\//, '')}`
}
