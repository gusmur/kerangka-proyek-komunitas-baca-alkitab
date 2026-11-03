import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { BIBLE_VERSIONS, DEFAULT_VERSION, resolveVersion, type BibleVersionCode } from '../lib/bible/versions';

const SAVE_ERROR_MESSAGE = 'Perubahan belum bisa disimpan. Periksa koneksi lalu coba lagi.';
const SAVE_SUCCESS_MESSAGE = 'Versi Alkitab favorit tersimpan.';

export default function Profile() {
  const { profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [version, setVersion] = useState<BibleVersionCode>(DEFAULT_VERSION);
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setVersion(resolveVersion(profile?.preferred_version));
  }, [profile?.preferred_version]);

  const isDirty = version !== resolveVersion(profile?.preferred_version);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !isDirty || !profile) return;

    if (!supabase) {
      setError('Layanan belum dikonfigurasi. Hubungi pengelola aplikasi.');
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ preferred_version: version })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Gagal menyimpan versi:', updateError.message);
      setError(SAVE_ERROR_MESSAGE);
      setBusy(false);
      return;
    }

    await refreshProfile();
    setSuccess(SAVE_SUCCESS_MESSAGE);
    setBusy(false);
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setError(null);
    const message = await signOut();
    if (message) {
      setError(message);
      setSigningOut(false);
      return;
    }
    navigate('/masuk', { replace: true });
  };

  const maskedPhone = profile?.phone_last4 ? `••••${profile.phone_last4}` : 'Tidak tersedia';

  return (
    <section className="mx-auto max-w-md space-y-6 px-4 py-8">
      <h1 className="text-center text-2xl font-bold">Profil</h1>

      <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Nama</p>
          <p className="text-base font-medium">{profile?.display_name ?? 'Tidak tersedia'}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Nomor telepon</p>
          <p className="font-mono text-sm tracking-wider">{maskedPhone}</p>
        </div>
      </div>

      <form
        className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
        onSubmit={handleSave}
        noValidate
      >
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

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !isDirty}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {busy ? 'Menyimpan...' : 'Simpan versi'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={signingOut}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 px-4 py-3 text-sm font-medium transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        {signingOut ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <LogOut className="h-4 w-4" aria-hidden="true" />
        )}
        {signingOut ? 'Sedang keluar...' : 'Keluar'}
      </button>
    </section>
  );
}
