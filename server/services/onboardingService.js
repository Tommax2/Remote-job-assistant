export function nextOnboardingPath(steps) {
  if (!steps.profile) return '/profile'
  if (!steps.resume) return '/resume'
  if (!steps.preferences) return '/preferences'
  return '/dashboard'
}
