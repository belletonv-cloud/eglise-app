export function validate(schema, data) {
  const errors = []
  for (const [key, rules] of Object.entries(schema)) {
    const val = data[key]
    if (rules.required && (val === undefined || val === null || val === '')) {
      errors.push(`${key} is required`)
      continue
    }
    if (val === undefined || val === null) continue
    if (rules.type === 'string' && typeof val !== 'string') {
      errors.push(`${key} must be a string`)
    }
    if (rules.type === 'number' && (typeof val !== 'number' || isNaN(val))) {
      errors.push(`${key} must be a number`)
    }
    if (rules.type === 'integer' && (!Number.isInteger(val))) {
      errors.push(`${key} must be an integer`)
    }
    if (rules.type === 'boolean' && typeof val !== 'boolean') {
      errors.push(`${key} must be a boolean`)
    }
    if (rules.type === 'array' && !Array.isArray(val)) {
      errors.push(`${key} must be an array`)
    }
    if (rules.minLength && typeof val === 'string' && val.length < rules.minLength) {
      errors.push(`${key} must be at least ${rules.minLength} characters`)
    }
    if (rules.maxLength && typeof val === 'string' && val.length > rules.maxLength) {
      errors.push(`${key} must be at most ${rules.maxLength} characters`)
    }
    if (rules.min !== undefined && (typeof val === 'number' && val < rules.min)) {
      errors.push(`${key} must be >= ${rules.min}`)
    }
    if (rules.max !== undefined && (typeof val === 'number' && val > rules.max)) {
      errors.push(`${key} must be <= ${rules.max}`)
    }
    if (rules.enum && !rules.enum.includes(val)) {
      errors.push(`${key} must be one of: ${rules.enum.join(', ')}`)
    }
    if (rules.pattern && typeof val === 'string' && !rules.pattern.test(val)) {
      errors.push(`${key} has invalid format`)
    }
  }
  return errors.length > 0 ? errors : null
}

export function validateId(id) {
  const num = parseInt(id, 10)
  if (isNaN(num) || num <= 0) return 'Invalid ID'
  return null
}

export function validationError(errors) {
  const msg = Array.isArray(errors) ? errors.join('; ') : errors
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  })
}
