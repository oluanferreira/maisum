import { type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm text-neutral-600">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`h-12 rounded-sm border px-4 ${error ? 'border-error' : 'border-neutral-200'} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${inputId}-error`} className="text-xs text-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
