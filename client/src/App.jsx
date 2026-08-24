import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import ResumePage from './pages/ResumePage'
import PreferencesPage from './pages/PreferencesPage'
import JobsPage from './pages/JobsPage'
import JobDetailsPage from './pages/JobDetailsPage'
import TailoredResumePage from './pages/TailoredResumePage'
import ApplicationEmailPage from './pages/ApplicationEmailPage'
import ApplicationReviewPage from './pages/ApplicationReviewPage'
import GmailSettingsPage from './pages/GmailSettingsPage'
import ApplicationQueuePage from './pages/ApplicationQueuePage'
import ApplicationDetailsPage from './pages/ApplicationDetailsPage'
import SavedJobsPage from './pages/SavedJobsPage'
import { DashboardGate, OnboardingRouter } from './components/OnboardingGate'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingRouter />} />
        <Route path="/dashboard" element={<DashboardGate><DashboardPage /></DashboardGate>} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/resume" element={<ResumePage />} />
        <Route path="/preferences" element={<PreferencesPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:jobId" element={<JobDetailsPage />} />
        <Route path="/resumes/:resumeId/tailored" element={<TailoredResumePage />} />
        <Route path="/applications/:applicationId/email" element={<ApplicationEmailPage />} />
        <Route path="/applications/:applicationId/review" element={<ApplicationReviewPage />} />
        <Route path="/settings/email" element={<GmailSettingsPage />} />
        <Route path="/applications" element={<ApplicationQueuePage />} />
        <Route path="/applications/:applicationId" element={<ApplicationDetailsPage />} />
        <Route path="/saved-jobs" element={<SavedJobsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
