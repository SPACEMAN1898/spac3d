import { useState } from 'react'

interface AuthFormProps {
  title: string
  submitLabel: string
  fields: Array<{ name: string; label: string; type: 'email' | 'password' | 'text' }>
  onSubmit: (values: Record<string, string>) => Promise<void>
  errors: Record<string, string>
}

export function AuthForm({ title, submitLabel, fields, onSubmit, errors }: AuthFormProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <div className="mx-auto mt-20 w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">{title}</h1>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault()
          setIsSubmitting(true)
          try {
            await onSubmit(values)
          } finally {
            setIsSubmitting(false)
          }
        }}
      >
        {fields.map((field) => (
          <label key={field.name} className="block space-y-1">
            <span className="text-sm text-gray-700">{field.label}</span>
            <input
              required
              type={field.type}
              value={values[field.name] ?? ''}
              onChange={(event) =>
                setValues((previous) => ({
                  ...previous,
                  [field.name]: event.target.value
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            {errors[field.name] ? <p className="text-xs text-red-600">{errors[field.name]}</p> : null}
          </label>
        ))}

        {errors.form ? <p className="text-sm text-red-600">{errors.form}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? 'Please wait...' : submitLabel}
        </button>
      </form>
    </div>
  )
}
