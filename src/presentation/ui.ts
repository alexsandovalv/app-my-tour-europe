/** Clases de Tailwind que se repiten en varias pantallas. */
export const ui = {
  panel: 'flex flex-col gap-4 pt-[22px]',
  lead: 'm-0 max-w-[62ch] text-muted',
  subH: 'mt-1.5 font-display text-[1.15rem] font-extrabold',
  card: 'rounded-md border border-line bg-surface',
  list: 'm-0 flex list-none flex-col gap-2 p-0',
  row: 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-2 rounded-md border border-line bg-surface px-3.5 py-3 max-[480px]:grid-cols-1',
  rowTitle: 'font-display text-[1.02rem] font-semibold',
  meta: 'mt-0.5 font-mono text-[.72rem] text-muted',
  note: 'mt-1 text-sm text-muted',
  price: 'mt-1.5 text-sm [&_b]:font-semibold',
  links: 'mt-2 flex flex-wrap gap-x-3.5 gap-y-1.5 text-sm font-medium',
  link: 'text-accent underline underline-offset-[3px]',
  warn: 'rounded-r-md border-l-4 border-todo bg-todo-bg px-3.5 py-2.5 text-[.9rem]',
  tips: 'm-0 flex list-disc flex-col gap-1.5 pl-[1.1em] [&>li]:max-w-[66ch]',
  sum: 'flex flex-col gap-1 rounded-md border border-line bg-surface px-3.5 py-3 text-[.9rem] [&_b]:font-display [&_b]:text-[1.05rem] [&_small]:text-[.78rem] [&_small]:text-muted',
  table:
    'w-full border-collapse text-[.9rem] [&_td]:border-b [&_td]:border-line [&_td]:px-2.5 [&_td]:py-2 [&_th]:border-b [&_th]:border-line [&_th]:px-2.5 [&_th]:py-2 [&_th]:text-left [&_th]:font-mono [&_th]:text-[.72rem] [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-muted',
  seg: 'inline-flex overflow-hidden rounded-lg border border-line',
  segBtn:
    'cursor-pointer border-0 bg-surface px-4 py-1.5 text-[.85rem] font-semibold text-muted aria-pressed:bg-accent aria-pressed:text-accent-ink aria-checked:bg-accent aria-checked:text-accent-ink',
  legend:
    'flex flex-wrap gap-x-[18px] gap-y-1.5 text-[.82rem] text-muted [&>span]:inline-flex [&>span]:items-center [&>span]:gap-[7px]',
  dot: 'inline-block size-[11px] rounded-full',
} as const
