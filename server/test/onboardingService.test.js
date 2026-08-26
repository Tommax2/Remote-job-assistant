import test from 'node:test'
import assert from 'node:assert/strict'
import { nextOnboardingPath } from '../services/onboardingService.js'

test('onboarding sends users to the first incomplete MVP setup step', () => {
  assert.equal(nextOnboardingPath({ profile: false, resume: false, preferences: false }), '/resume')
  assert.equal(nextOnboardingPath({ profile: false, resume: true, preferences: false }), '/profile')
  assert.equal(nextOnboardingPath({ profile: true, resume: false, preferences: false }), '/resume')
  assert.equal(nextOnboardingPath({ profile: true, resume: true, preferences: false }), '/preferences')
  assert.equal(nextOnboardingPath({ profile: true, resume: true, preferences: true }), '/dashboard')
})
