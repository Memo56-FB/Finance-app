export type Credentials = { username: string; password: string }
export function credentialErrors(values: Credentials, register: boolean) {
  const errors: ('username' | 'password')[] = []
  if (!/^[a-z0-9._-]{1,254}$/.test(values.username.trim().toLowerCase())) errors.push('username')
  if (register) {
    if (!values.password.trim() || values.password.length < 8 || new TextEncoder().encode(values.password).length > 72) errors.push('password')
  }
  return errors
}
