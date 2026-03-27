import { loginSchema, registerSchema } from '@clinikchat/shared'
import { Router } from 'express'

import { validateMiddleware } from '../middleware/validate.middleware'
import { login, logout, refresh, register } from '../services/auth.service'

const REFRESH_COOKIE = 'refreshToken'

export const authRouter = Router()

authRouter.post('/register', validateMiddleware(registerSchema), async (request, response, next) => {
  try {
    const result = await register(request.body)
    response.cookie(REFRESH_COOKIE, result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    response.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
    })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/login', validateMiddleware(loginSchema), async (request, response, next) => {
  try {
    const result = await login(request.body)
    response.cookie(REFRESH_COOKIE, result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    response.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
    })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/refresh', async (request, response, next) => {
  try {
    const refreshTokenFromCookie = request.cookies?.[REFRESH_COOKIE] as string | undefined
    const refreshTokenFromBody = request.body?.refreshToken as string | undefined
    const token = refreshTokenFromCookie ?? refreshTokenFromBody ?? ''

    const tokens = await refresh(token)

    response.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    response.json({
      success: true,
      data: {
        accessToken: tokens.accessToken
      }
    })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/logout', async (request, response, next) => {
  try {
    const refreshToken = (request.cookies?.[REFRESH_COOKIE] as string | undefined) ?? ''
    await logout(refreshToken)
    response.clearCookie(REFRESH_COOKIE)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
})
