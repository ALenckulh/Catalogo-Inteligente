import Image from 'next/image'

const SIZES = { sm: { icon: 28, font: 'var(--font-size-lg)' }, md: { icon: 36, font: 'var(--font-size-xl)' }, lg: { icon: 72, font: undefined } } as const

interface Props {
  size?: keyof typeof SIZES
  /** Esconde o texto (ex.: hero, onde o H1 já tem o nome). */
  iconOnly?: boolean
}

export function Logo({ size = 'md', iconOnly = false }: Props) {
  const s = SIZES[size]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <Image src="/logo/LOGOTIPO_CLARA.png" alt="" aria-hidden width={s.icon} height={s.icon} style={{ flexShrink: 0 }} />
      {!iconOnly && <span style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: s.font }}>Renova</span>}
    </span>
  )
}
