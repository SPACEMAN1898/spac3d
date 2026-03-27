import type { LoginRequest, RegisterRequest } from '@clinikchat/shared'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import type { ZodType } from 'zod'

interface AuthFormProps<T extends LoginRequest | RegisterRequest> {
  title: string
  subtitle: string
  schema: ZodType<T>
  fields: Array<{
    name: Extract<keyof T, string>
    label: string
    type: string
    autoComplete?: string
  }>
  submitLabel: string
  onSubmit: (values: T) => Promise<void>
  footer?: ReactNode
}

export const AuthForm = <T extends LoginRequest | RegisterRequest>({
  title,
  subtitle,
  schema,
  fields,
  submitLabel,
  onSubmit,
  footer
}: AuthFormProps<T>) => {
  const initialValues = useMemo(
    () =>
      fields.reduce<Record<string, string>>((accumulator, field) => {
        accumulator[field.name] = ''
        return accumulator
      }, {}),
    [fields]
  )
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    const result = schema.safeParse(values)
    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors
      const nextErrors = Object.fromEntries(
        Object.entries(flattened).map(([key, messages]) => [key, messages?.[0] ?? 'Invalid value'])
      )
      setErrors(nextErrors)
      setIsSubmitting(false)
      return
    }

    try {
      await onSubmit(result.data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={(event) => void handleFormSubmit(event)}
      className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl"
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">{title}</h1>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>

      <div className="space-y-4">
        {fields.map((field) => (
          <label key={String(field.name)} className="block space-y-2 text-sm text-slate-200">
            <span>{field.label}</span>
            <input
              value={values[field.name] ?? ''}
              type={field.type}
              autoComplete={field.autoComplete}
              onChange={(event) => {
                const nextValue = event.target.value
                setValues((current) => ({ ...current, [field.name]: nextValue }))
              }}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
            />
            <span className="min-h-5 text-xs text-rose-400">{errors[field.name] ?? ''}</span>
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Working...' : submitLabel}
      </button>

      {footer ? <div className="text-center text-sm text-slate-400">{footer}</div> : null}
    </form>
  )
}
