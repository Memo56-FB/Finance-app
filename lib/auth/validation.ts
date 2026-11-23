export type Credentials = { username: string; password: string; name: string }
export function credentialErrors(values: Credentials, register: boolean) {
  const errors: ('name' | 'username' | 'password')[] = []
  if (!/^[a-z0-9._-]{1,254}$/.test(values.username.trim().toLowerCase())) errors.push('username')
  if (register) {
    if (!values.name.trim() || values.name.trim().length > 100) errors.push('name')
    if (!values.password.trim() || values.password.length < 8 || new TextEncoder().encode(values.password).length > 72) errors.push('password')
  }
  return errors
}
