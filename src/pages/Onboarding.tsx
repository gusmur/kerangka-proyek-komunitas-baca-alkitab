import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Loader2, UserRound } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { BIBLE_VERSIONS, DEFAULT_VERSION, type BibleVersionCode } from '../lib/bible/versions';

const NAME_MIN = 1;
const NAME_MAX = 50;
const SAVE_ERROR_MESSAGE = 'Profil belum bisa disimpan. Periksa koneksi lalu coba lagi.';

export default function Onboarding() {
  const { session, profile, loading, profileError, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [version, setVersion] = useState<BibleVersionCode>(DEFAULT_VERSION);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-dvh items-center justify-center bg-neutral-50 dark:bg-neutral-950"
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

  if (profile?.display_name?.trim()) {
    return <Navigate to="/" replace />;
  }

  const trimmedLength = name.trim().length;
  const isNameValid = trimmedLength >= NAME_MIN && trimmedLength <= NAME_MAX;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !isNameValid) return;

    if (!supabase) {
      setError('Layanan belum dikonfigurasi. Hubungi pengelola aplikasi.');
      return;
    }

    setBusy(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: name.trim(), preferred_version: version })
      .eq('id', session.user.id);

    if (updateError) {
      console.error('Gagal menyimpan onboarding:', updateError.message);
      setError(SAVE_ERROR_MESSAGE);
      setBusy(false);
      return;
    }

    await refreshProfile();
    navigate('/', { replace: true });
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4 py-10 dark:bg-neutral-950">
      <section className="w-full max-w-sm space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <header className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
            <UserRound className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold">Selamat datang</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Lengkapi profil Anda untuk mulai membaca bersama.
          </p>
        </header>

        {profileError && (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 rounded-lg bg-red-50 px-3 py-3 text-center text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400"
          >
            <p>{profileError}</p>
            <button
              type="button"
              onClick={() => void refreshProfile()}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
            >
              Coba lagi
            </button>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <label htmlFor="display-name" className="text-sm font-medium">
              Nama tampilan
            </label>
            <input
              id="display-name"
              name="displayName"
              type="text"
              autoComplete="name"
              maxLength={NAME_MAX}
              placeholder="Nama yang akan terlihat di grup"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={busy}
              aria-invalid={name.length > 0 && !isNameValid}
              aria-describedby="display-name-hint"
              className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-3 text-base outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60 dark:border-neutral-700"
            />
            <p id="display-name-hint" className="text-xs text-neutral-500 dark:text-neutral-400">
              {trimmedLength}/{NAME_MAX} karakter
            </p>
          </div>

          <fieldset className="space-y-2" disabled={busy}>
            <legend className="text-sm font-medium">Versi Alkitab favorit</legend>
            {BIBLE_VERSIONS.map((item) => {
              const selected = version === item.code;
              return (
                <label
                  key={item.code}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-violet-500 ${
                    selected
                      ? 'border-violet-600 bg-violet-50 dark:border-violet-400 dark:bg-violet-900/30'
                      : 'border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span className="flex flex-col">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs uppercase text-neutral-500 dark:text-neutral-400">
                      {item.code} · {item.lang}
                    </span>
                  </span>
                  <input
                    type="radio"
                    name="preferredVersion"
                    value={item.code}
                    checked={selected}
                    onChange={() => setVersion(item.code)}
                    className="h-4 w-4 accent-violet-600"
                  />
                </label>
              );
            })}
          </fieldset>

          <button
            type="submit"
            disabled={busy || !isNameValid}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {busy ? 'Menyimpan...' : 'Simpan dan lanjutkan'}
          </button>
        </form>
      </section>
    </main>
  );
}
