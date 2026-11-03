import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function RequireAuth() {
  const { session, profile, loading, profileError, refreshProfile } = useAuth();

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950"
      >
        <span className="sr-only">Memuat...</span>
        <div
          aria-hidden="true"
          className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600 dark:border-neutral-700 dark:border-t-violet-400"
        />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/masuk" replace />;
  }

  if (profileError) {
    return (
      <div
        role="alert"
        className="mx-auto mt-16 flex max-w-sm flex-col items-center gap-4 rounded-xl border border-neutral-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-900"
      >
        <p className="text-sm text-neutral-700 dark:text-neutral-300">{profileError}</p>
        <button
          type="button"
          onClick={() => void refreshProfile()}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  if (!profile?.display_name?.trim()) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
