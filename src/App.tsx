import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import ConfigMissing from './components/ConfigMissing';
import RequireAuth from './components/RequireAuth';
import { AuthProvider, useAuth } from './lib/auth';
import { supabase } from './lib/supabase';

function Placeholder({ title }: { title: string }) {
  return <h1 className="py-10 text-center text-2xl font-bold">{title}</h1>;
}

function ProfilePage() {
  const { user, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setBusy(true);
    setError(null);
    const message = await signOut();
    if (message) {
      setError(message);
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-md space-y-6">
      <h1 className="text-center text-2xl font-bold">Profil</h1>

      <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Email</p>
          <p className="break-all text-sm font-medium">{user?.email ?? 'Tidak tersedia'}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">ID Pengguna</p>
          <p className="break-all font-mono text-xs">{user?.id ?? 'Tidak tersedia'}</p>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={busy}
        className="w-full rounded-lg bg-violet-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
      >
        {busy ? 'Sedang keluar...' : 'Keluar'}
      </button>
    </section>
  );
}

export default function App() {
  if (!supabase) {
    return <ConfigMissing />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/masuk" element={<Placeholder title="Masuk" />} />
          <Route path="/onboarding" element={<Placeholder title="Onboarding" />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<Placeholder title="Beranda" />} />
              <Route path="/groups" element={<Placeholder title="Grup" />} />
              <Route path="/baca" element={<Placeholder title="Baca" />} />
              <Route path="/profil" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
