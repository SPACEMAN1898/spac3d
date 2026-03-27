import { loginSchema, registerSchema } from '@clinikchat/shared'
import { Router } from 'express'

import { validateObject } from '../middleware/validate.middleware.js'
import { login, logout, refreshSession, register } from '../services/auth.service.js'

const REFRESH_COOKIE = 'clinikchat_refresh_token'

export const authRouter = Router()

authRouter.post('/register', validateObject(registerSchema), async (request, response, next) => {
  try {
    const result = await register(request.body)
    response.cookie(REFRESH_COOKIE, result.tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/'
    })

    response.status(201).json({
      success: true,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.tokens.accessToken
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/login', validateObject(loginSchema), async (request, response, next) => {
  try {
    const result = await login(request.body)
    response.cookie(REFRESH_COOKIE, result.tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/'
    })

    response.json({
      success: true,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.tokens.accessToken
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/refresh', async (request, response, next) => {
  try {
    const refreshToken = request.cookies[REFRESH_COOKIE]
    const result = await refreshSession(refreshToken)

    response.cookie(REFRESH_COOKIE, result.tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/'
    })

    response.json({
      success: true,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.tokens.accessToken
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/logout', async (request, response, next) => {
  try {
    await logout(request.cookies[REFRESH_COOKIE])
    response.clearCookie(REFRESH_COOKIE, { path: '/' })
    response.status(204).send()
  } catch (error) {
    next(error)
  }
})
