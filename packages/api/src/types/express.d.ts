import type { TokenPayload } from '@clinikchat/shared'

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export {}
