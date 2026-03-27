import bcrypt from 'bcryptjs'

const PASSWORD_COST = 12

export async function hashPassword(value: string): Promise<string> {
  return bcrypt.hash(value, PASSWORD_COST)
}

export async function comparePassword(value: string, hash: string): Promise<boolean> {
  return bcrypt.compare(value, hash)
}
