/**
 * Simple beta access system.
 * Check localStorage for a valid beta code.
 * Later this gets replaced with real Stripe + auth.
 */

const BETA_CODE = 'GULFEDGE2026';
const STORAGE_KEY = 'lco_beta_access';

export function isBetaUser(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === BETA_CODE;
}

export function activateBeta(code: string): boolean {
  if (code.trim().toUpperCase() === BETA_CODE) {
    localStorage.setItem(STORAGE_KEY, BETA_CODE);
    return true;
  }
  return false;
}

export function revokeBeta(): void {
  localStorage.removeItem(STORAGE_KEY);
}
