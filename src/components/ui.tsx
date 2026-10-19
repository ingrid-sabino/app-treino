import type { ButtonHTMLAttributes, InputHTMLAttributes } from 'react'

export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`h-14 w-full rounded-full bg-lime font-display text-xl font-bold uppercase tracking-wide text-ink transition active:scale-[0.98] disabled:opacity-50 ${className}`}
      {...props}
    />
  )
}

export function TextButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`text-sm font-medium text-lilac-ink underline-offset-4 active:underline ${className}`}
      {...props}
    />
  )
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-14 w-full rounded-2xl border border-line bg-card px-4 text-base outline-none focus:border-lilac focus:ring-4 focus:ring-lilac-soft ${className}`}
      {...props}
    />
  )
}

export function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-card bg-card p-5 shadow-[0_1px_0_var(--color-line)] ${className}`}>{children}</div>
}
