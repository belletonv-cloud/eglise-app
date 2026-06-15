import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../firebase', () => ({
  default: {},
  auth: {},
  googleProvider: {},
  firebaseReady: false,
}))

import {
  user,
  isAuthenticated,
  isDemoMode,
  isImpersonating,
  originalUser,
  authInitialized,
  waitForAuthInitialized,
  onLogin,
  startImpersonating,
  stopImpersonating,
  loginWithEmail,
  loginWithGoogle,
  logout,
} from '../stores/auth'

describe('auth store', () => {
  beforeEach(() => {
    user.value = null
    isAuthenticated.value = false
    isDemoMode.value = false
    isImpersonating.value = false
    originalUser.value = null
  })

  describe('initial state', () => {
    it('user is null', () => {
      expect(user.value).toBeNull()
    })

    it('isAuthenticated is false', () => {
      expect(isAuthenticated.value).toBe(false)
    })

    it('isDemoMode is false', () => {
      expect(isDemoMode.value).toBe(false)
    })

    it('isImpersonating is false', () => {
      expect(isImpersonating.value).toBe(false)
    })

    it('originalUser is null', () => {
      expect(originalUser.value).toBeNull()
    })

    it('authInitialized is true after module init (firebaseReady=false fallback)', () => {
      expect(authInitialized.value).toBe(true)
    })
  })

  describe('user ref', () => {
    it('can be set to a user object', () => {
      const testUser = { email: 'test@test.com', uid: 'abc123', displayName: 'Test User' }
      user.value = testUser
      expect(user.value).toEqual(testUser)
    })

    it('can be set to null', () => {
      user.value = { email: 'test@test.com', uid: 'abc123', displayName: 'Test' }
      user.value = null
      expect(user.value).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('can be toggled', () => {
      isAuthenticated.value = true
      expect(isAuthenticated.value).toBe(true)
      isAuthenticated.value = false
      expect(isAuthenticated.value).toBe(false)
    })
  })

  describe('waitForAuthInitialized', () => {
    it('resolves immediately when already initialized', async () => {
      authInitialized.value = true
      await expect(waitForAuthInitialized()).resolves.toBeUndefined()
    })

    it('resolves even if authInitialized is false (underlying promise already settled)', async () => {
      authInitialized.value = false
      await expect(waitForAuthInitialized()).resolves.toBeUndefined()
    })
  })

  describe('onLogin', () => {
    it('registers a callback without throwing', () => {
      let called = false
      expect(() => onLogin(() => { called = true })).not.toThrow()
      // The callback is stored internally and not invoked in this test
      // because onAuthStateChanged never fires (firebaseReady=false, auth mocked as {})
      expect(called).toBe(false)
    })

    it('can register multiple callbacks', () => {
      let count = 0
      onLogin(() => { count++ })
      onLogin(() => { count++ })
      expect(count).toBe(0)
    })
  })

  describe('startImpersonating', () => {
    const adminUser = { email: 'admin@test.com', uid: 'admin1', displayName: 'Admin' }
    const personaUser = { email: 'persona@test.com', uid: 'persona1', displayName: 'Persona' }

    it('saves original user and sets persona', () => {
      user.value = adminUser
      startImpersonating(personaUser)

      expect(user.value).toEqual(personaUser)
      expect(isImpersonating.value).toBe(true)
      expect(originalUser.value).toEqual(adminUser)
    })

    it('sets persona even when user is null', () => {
      startImpersonating(personaUser)

      expect(user.value).toEqual(personaUser)
      expect(isImpersonating.value).toBe(true)
      // originalUser stays null since user was null
      expect(originalUser.value).toBeNull()
    })

    it('does not overwrite originalUser when already impersonating', () => {
      user.value = adminUser
      startImpersonating(personaUser)

      const anotherPersona = { email: 'another@test.com', uid: 'p2', displayName: 'Another' }
      startImpersonating(anotherPersona)

      // originalUser should still be adminUser, not personaUser
      expect(originalUser.value).toEqual(adminUser)
      expect(user.value).toEqual(anotherPersona)
      expect(isImpersonating.value).toBe(true)
    })

    it('does not overwrite originalUser on re-impersonation after stop', () => {
      user.value = adminUser
      startImpersonating(personaUser)
      stopImpersonating()

      const anotherPersona = { email: 'another@test.com', uid: 'p2', displayName: 'Another' }
      startImpersonating(anotherPersona)

      // originalUser preserved (not overwritten since it's still truthy)
      expect(originalUser.value).toEqual(adminUser)
      expect(user.value).toEqual(anotherPersona)
    })
  })

  describe('stopImpersonating', () => {
    const adminUser = { email: 'admin@test.com', uid: 'admin1', displayName: 'Admin' }
    const personaUser = { email: 'persona@test.com', uid: 'persona1', displayName: 'Persona' }

    it('restores original user and clears impersonation flag', () => {
      user.value = adminUser
      startImpersonating(personaUser)
      stopImpersonating()

      expect(user.value).toEqual(adminUser)
      expect(isImpersonating.value).toBe(false)
    })

    it('preserves originalUser for re-impersonation', () => {
      user.value = adminUser
      startImpersonating(personaUser)
      stopImpersonating()

      expect(originalUser.value).toEqual(adminUser)

      // Can re-impersonate back to the same persona
      startImpersonating(personaUser)
      expect(user.value).toEqual(personaUser)
      expect(isImpersonating.value).toBe(true)
    })

    it('is a no-op when not impersonating (originalUser is null)', () => {
      user.value = adminUser
      stopImpersonating()

      expect(user.value).toEqual(adminUser)
      expect(isImpersonating.value).toBe(false)
    })
  })

  describe('loginWithEmail', () => {
    it('returns undefined when firebase is not ready', async () => {
      const result = await loginWithEmail('test@test.com', 'password')
      expect(result).toBeUndefined()
    })
  })

  describe('loginWithGoogle', () => {
    it('returns undefined when firebase is not ready', async () => {
      const result = await loginWithGoogle()
      expect(result).toBeUndefined()
    })
  })

  describe('logout', () => {
    it('clears user and isAuthenticated optimistically', async () => {
      user.value = { email: 'test@test.com', uid: 'abc123', displayName: 'Test' }
      isAuthenticated.value = true

      await logout()

      expect(user.value).toBeNull()
      expect(isAuthenticated.value).toBe(false)
    })

    it('does not throw when firebase is not ready', async () => {
      await expect(logout()).resolves.toBeUndefined()
    })
  })
})
