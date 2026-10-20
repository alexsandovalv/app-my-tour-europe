import type { ReactNode } from 'react'
import type { Link } from '../../domain/trip'

export function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener">
      {children}
    </a>
  )
}

export function LinkList({ links }: { links: readonly Link[] }) {
  return (
    <>
      {links.map((l) => (
        <ExtLink key={l.url + l.label} href={l.url}>
          {l.label}
        </ExtLink>
      ))}
    </>
  )
}
