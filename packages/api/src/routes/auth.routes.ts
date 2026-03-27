import { Router, type Router as RouterType } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { validate } from '../middleware/validate.middleware'
import { loginSchema, registerSchema } from '@clinikchat/shared'
import * as authService from '../services/auth.service'

const router: RouterType = Router()

router.post(
  '/register',
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.registerUser(req.body as { email: string; password: string; displayName: string })
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      res.status(201).json({
        success: true,
        data: { user: result.user, accessToken: result.accessToken },
      })
    } catch (err) {
      next(err)
    }
  },
)

router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.loginUser(req.body as { email: string; password: string })
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      res.json({
        success: true,
        data: { user: result.user, accessToken: result.accessToken },
      })
    } catch (err) {
      next(err)
    }
  },
)

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken =
      (req.cookies as Record<string, string | undefined>)['refreshToken'] ??
      (req.body as { refreshToken?: string }).refreshToken
    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: { code: 'AUTH_REFRESH_TOKEN_INVALID', message: 'No refresh token provided' },
      })
      return
    }
    const tokens = await authService.refreshTokens(refreshToken)
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    res.json({ success: true, data: { accessToken: tokens.accessToken } })
  } catch (err) {
    next(err)
  }
})

router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken =
      (req.cookies as Record<string, string | undefined>)['refreshToken'] ??
      (req.body as { refreshToken?: string }).refreshToken ?? ''
    await authService.logoutUser(refreshToken)
    res.clearCookie('refreshToken')
    res.json({ success: true, data: null })
  } catch (err) {
    next(err)
  }
})

export default router
