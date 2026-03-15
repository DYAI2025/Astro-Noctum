// Loading spinner transitions — infinite rotation is intentional here:
// these animate while quiz results are being computed (active processing indicator).
export const SPINNER_OUTER = { duration: 1.2, repeat: Infinity, ease: 'linear' as const };
export const SPINNER_INNER = { duration: 1.8, repeat: Infinity, ease: 'linear' as const };
