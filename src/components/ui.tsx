import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import type { Modality } from '../lib/db'

// Componentes base do Tönus. Cores sempre pelos tokens de src/index.css,
// para o tema escuro funcionar sem mudar os componentes.

type ButtonVariant = 'primary' | 'dark' | 'secondary' | 'ghost'
type ButtonSize = 'lg' | 'md' | 'sm'

const buttonVariant: Record<ButtonVariant, string> = {
  primary: 'bg-lime text-on-lime',
  dark: 'bg-inverse text-on-inverse',
  secondary: 'bg-surface text-ink border border-ink',
  ghost: 'bg-transparent text-ink',
}

const buttonSize: Record<ButtonSize, string> = {
  lg: 'h-14 px-5 text-xl',
  md: 'h-11 px-4 text-lg',
  sm: 'h-9 px-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'lg',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={`inline-flex w-full items-center justify-center gap-2 rounded-md font-display font-bold uppercase tracking-wide transition active:translate-y-px disabled:opacity-40 ${buttonVariant[variant]} ${buttonSize[size]} ${className}`}
      {...props}
    />
  )
}

export function TextButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`text-sm font-semibold text-lilac-strong underline-offset-4 active:underline ${className}`}
      {...props}
    />
  )
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-14 w-full rounded-md border border-line bg-surface px-4 text-base text-ink outline-none placeholder:text-muted focus:border-ink focus:ring-2 focus:ring-lime ${className}`}
      {...props}
    />
  )
}

type CardTone = 'plain' | 'inverse' | 'lime' | 'lilac'

const cardTone: Record<CardTone, string> = {
  plain: 'bg-surface text-ink border border-line',
  inverse: 'bg-inverse text-on-inverse',
  lime: 'bg-lime text-on-lime',
  lilac: 'bg-lilac text-on-lilac',
}

export function Card({ tone = 'plain', className = '', children }: { tone?: CardTone; className?: string; children: ReactNode }) {
  return <div className={`rounded-lg p-4 ${cardTone[tone]} ${className}`}>{children}</div>
}

// Rótulo pequeno em caixa alta (títulos de seção, legendas de números)
export function Label({ className = '', children }: { className?: string; children: ReactNode }) {
  return <p className={`text-xs font-semibold uppercase tracking-wider ${className}`}>{children}</p>
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between">
      <h2 className="text-2xl">{title}</h2>
      {action}
    </div>
  )
}

// Número grande com legenda (Duração, Volume, reps)
export function Stat({ label, value, unit, className = '' }: { label: string; value: string; unit?: string; className?: string }) {
  return (
    <div className={className}>
      <Label className="opacity-70">{label}</Label>
      <p className="mt-1 font-display text-4xl font-bold leading-none">
        {value}
        {unit && <span className="ml-1 text-xl font-semibold opacity-70">{unit}</span>}
      </p>
    </div>
  )
}

// Cor de cada Modalidade: musculação lima, cardio lilás, yoga e outras em tinta
export const modalityStyle: Record<Modality, { label: string; className: string }> = {
  strength: { label: 'Musculação', className: 'bg-lime text-on-lime' },
  run: { label: 'Corrida', className: 'bg-lilac text-on-lilac' },
  ride: { label: 'Ciclismo', className: 'bg-lilac text-on-lilac' },
  yoga: { label: 'Yoga', className: 'bg-inverse text-on-inverse ring-1 ring-inset ring-white/40' },
  other: { label: 'Outra', className: 'bg-surface-2 text-ink' },
}

export function ModalityTag({ modality, className = '' }: { modality: Modality; className?: string }) {
  const style = modalityStyle[modality]
  return (
    <span className={`inline-flex h-6 items-center rounded-sm px-2 text-xs font-bold uppercase tracking-wider ${style.className} ${className}`}>
      {style.label}
    </span>
  )
}
