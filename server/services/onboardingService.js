export function nextOnboardingPath(steps) {
  if (!steps.resume) return '/resume'
  if (!steps.profile) return '/profile'
  if (!steps.preferences) return '/preferences'
  return '/dashboard'
}
