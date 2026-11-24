/**
 * Kurgusal şirket logoları: referanstaki renk ve baş harf korunur, her şirkete ayırt edici küçük bir işaret eklenir.
 * Hiçbiri gerçek bir şirketin logosunu taklit etmez.
 */
const MARKS: Record<string, string> = {
  nehirsu: 'M6 30c4-3 8-3 12 0s8 3 12 0M6 35c4-3 8-3 12 0s8 3 12 0', // dalga
  tirhan: 'M10 30h20M10 34h20', // kitap satırları
  selvigol: 'M20 28v9M16 33l4-5 4 5', // selvi
  kekik: 'M14 36c3-6 9-8 12-8M18 33l-2-3M22 31l-1-3', // dal
  ardicli: 'M12 32h16M15 29c2 2 2 4 0 6M25 29c-2 2-2 4 0 6', // dil/küre
  akcaagac: 'M20 27l3 5h-6l3-5ZM20 32v5', // yaprak
};

export function CompanyLogo({ ini, color, mark, size = 56, label }: { ini: string; color: string; mark?: string; size?: number; label?: string }) {
  const d = mark ? MARKS[mark] : undefined;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label={label ? `${label} logosu` : undefined} className="shrink-0 rounded-md">
      <rect width="40" height="40" rx="7" fill={color} />
      <rect x="0.5" y="0.5" width="39" height="39" rx="6.5" fill="none" stroke="rgba(255,255,255,.18)" />
      <text x="20" y={d ? 22 : 26.5} textAnchor="middle" fontSize={d ? 15 : 18} fontWeight="700" fill="#fff" fontFamily="var(--font-sans)">{ini}</text>
      {d ? <path d={d} fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /> : null}
    </svg>
  );
}
