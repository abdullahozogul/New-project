/**
 * Lemon Squeezy checkout for premium (sandbox or production).
 *
 * Prefer full URL override for copy-paste from the dashboard, or build from
 * `VITE_LEMON_SQUEEZY_STORE_SLUG` + `VITE_LEMON_SQUEEZY_VARIANT_ID`.
 */
export function getLemonSqueezyPremiumCheckoutUrl(): string | null {
  const full = import.meta.env.VITE_LEMON_SQUEEZY_CHECKOUT_URL?.trim()
  if (full) {
    return full
  }

  const slug = import.meta.env.VITE_LEMON_SQUEEZY_STORE_SLUG?.trim()
  const variant = import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_ID?.trim()
  if (!slug || !variant) {
    return null
  }

  return `https://${slug}.lemonsqueezy.com/checkout/buy/${variant}`
}
