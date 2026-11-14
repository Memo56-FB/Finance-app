export type Credentials = { email: string; password: string; name: string }
export function registrationErrors(values: Credentials) {
  const errors: ('name' | 'email' | 'password')[] = []
  if (!values.name.trim() || values.name.trim().length > 100) errors.push('name')
  if (values.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+$/.test(values.email.trim())) errors.push('email')
  if (!values.password.trim() || values.password.length < 8 || new TextEncoder().encode(values.password).length > 72) errors.push('password')
  return errors
}
