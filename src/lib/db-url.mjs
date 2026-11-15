/**
 * Neon connection strings end in `sslmode=require`. The pg library currently treats that as `verify-full`
 * and prints a warning that the meaning will change in a future version. Writing `verify-full` explicitly
 * keeps today's (stricter, certificate-checked) behavior and silences the warning.
 *
 * @param {string | undefined} url
 */
export function explicitSsl(url) {
  return url ? url.replace(/([?&])sslmode=(?:require|prefer|verify-ca)(?=&|$)/, "$1sslmode=verify-full") : url;
}
