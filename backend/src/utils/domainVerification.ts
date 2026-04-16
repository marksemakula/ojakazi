import dns from 'dns/promises';

const DNS_TOKEN_PREFIX = 'esign-verify=';
// Allowed time after which org must re-verify (90 days)
export const REVERIFY_DAYS = parseInt(process.env.DOMAIN_VERIFY_RECHECK_INTERVAL_DAYS ?? '90', 10);

/**
 * Check that a domain's DNS TXT records contain the expected token.
 * Returns true on match, false otherwise.
 */
export async function checkDnsTxtRecord(domain: string, token: string): Promise<boolean> {
  try {
    const records: string[][] = await dns.resolveTxt(domain);
    const expected = `${DNS_TOKEN_PREFIX}${token}`;
    return records.some((chunks) => chunks.join('').includes(expected));
  } catch {
    // NXDOMAIN or timeout – verification not yet complete
    return false;
  }
}

/**
 * Returns the TXT record value that the user must add to their DNS.
 */
export function buildDnsTxtValue(token: string): string {
  return `${DNS_TOKEN_PREFIX}${token}`;
}

/**
 * Determine if an org's verification has expired and a re-check is needed.
 */
export function isVerificationExpired(verifiedAt: Date | null): boolean {
  if (!verifiedAt) return true;
  const diffMs = Date.now() - new Date(verifiedAt).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > REVERIFY_DAYS;
}
