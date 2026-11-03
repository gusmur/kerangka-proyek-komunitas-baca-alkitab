import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Loader2, Phone, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { normalizePhone } from '../lib/phone';
import { supabase } from '../lib/supabase';

const RESEND_SECONDS = 60;

type Stage = 'phone' | 'otp';

function toFriendlyError(error: unknown, stage: 'send' | 'verify'): string {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  const status = (error as { status?: number } | null)?.status;

  if (
    (typeof navigator !== 'undefined' && !navigator.onLine) ||
    message.includes('fetch') ||
    message.includes('network')
  ) {
    return 'Gangguan jaringan. Periksa koneksi Anda lalu coba lagi.';
  }

  if (
    status === 429 ||
    message.includes('rate limit') ||
    message.includes('too many') ||
    message.includes('seconds')
  ) {
    return 'Terlalu sering meminta kode. Tunggu beberapa saat lalu coba lagi.';
  }

  if (stage === 'verify') {
    if (message.includes('expired')) {
      return 'Kode sudah kedaluwarsa. Silakan kirim ulang kode.';
    }
    return 'Kode salah. Periksa kembali kode verifikasi Anda.';
  }

  if (message.includes('invalid') || message.includes('phone')) {
    return 'Nomor tidak valid. Periksa kembali nomor Anda.';
  }

  return 'Gagal mengirim kode. Silakan coba lagi.';
}

export default function Login() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setInterval(() => {
      setCountdown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  if (!loading && session) {
    return <Navigate to="/" replace />;
  }

  const requestOtp = async (target: string): Promise<boolean> => {
    if (!supabase) {
      setError('Layanan belum dikonfigurasi. Hubungi pengelola aplikasi.');
      return false;
    }
    const { error: sendError } = await supabase.auth.signInWithOtp({ phone: target });
    if (sendError) {
      console.error('Gagal mengirim OTP:', sendError.message);
      setError(toFriendlyError(sendError, 'send'));
      return false;
    }
    return true;
  };

  const handleSendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const normalized = normalizePhone(phoneInput);
    if (!normalized) {
      setError('Nomor tidak valid. Gunakan format 0812… atau +62812….');
      return;
    }

    setBusy(true);
    setError(null);
    const ok = await requestOtp(normalized);
    setBusy(false);

    if (ok) {
      setPhone(normalized);
      setOtp('');
      setStage('otp');
      setCountdown(RESEND_SECONDS);
    }
  };

  const handleResend = async () => {
    if (busy || countdown > 0) return;

    setBusy(true);
    setError(null);
    const ok = await requestOtp(phone);
    setBusy(false);

    if (ok) {
      setOtp('');
      setCountdown(RESEND_SECONDS);
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    if (otp.length !== 6) {
      setError('Kode verifikasi terdiri dari 6 digit.');
      return;
    }
    if (!supabase) {
      setError('Layanan belum dikonfigurasi. Hubungi pengelola aplikasi.');
      return;
    }

    setBusy(true);
    setError(null);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });
    setBusy(false);

    if (verifyError) {
      console.error('Gagal verifikasi OTP:', verifyError.message);
      setError(toFriendlyError(verifyError, 'verify'));
      return;
    }

    navigate('/', { replace: true });
  };

  const handleChangeNumber = () => {
    if (busy) return;
    setStage('phone');
    setOtp('');
    setError(null);
    setCountdown(0);
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4 py-10 dark:bg-neutral-950">
      <section className="w-full max-w-sm space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <header className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
            {stage === 'phone' ? (
              <Phone className="h-6 w-6" aria-hidden="true" />
            ) : (
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            )}
          </div>
          <h1 className="text-2xl font-bold">Masuk</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {stage === 'phone'
              ? 'Masukkan nomor telepon Anda untuk mulai.'
              : `Masukkan 6 digit kode yang dikirim ke ${phone}.`}
          </p>
        </header>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400"
          >
            {error}
          </p>
        )}

        {stage === 'phone' ? (
          <form className="space-y-4" onSubmit={handleSendCode} noValidate>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Nomor telepon
              </label>
              <div className="flex overflow-hidden rounded-lg border border-neutral-300 focus-within:ring-2 focus-within:ring-violet-500 dark:border-neutral-700">
                <span className="flex items-center bg-neutral-100 px-3 text-sm font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  +62
                </span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="0812…"
                  value={phoneInput}
                  onChange={(event) => setPhoneInput(event.target.value)}
                  disabled={busy}
                  className="w-full bg-transparent px-3 py-3 text-base outline-none disabled:opacity-60"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {busy ? 'Mengirim kode...' : 'Kirim kode'}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleVerify} noValidate>
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium">
                Kode verifikasi
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={busy}
                className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-3 text-center text-lg tracking-[0.5em] outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60 dark:border-neutral-700"
              />
              <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
                Kode verifikasi dikirim lewat WhatsApp.
              </p>
            </div>

            <button
              type="submit"
              disabled={busy || otp.length !== 6}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {busy ? 'Memverifikasi...' : 'Masuk'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={handleResend}
                disabled={busy || countdown > 0}
                className="font-medium text-violet-600 hover:underline disabled:cursor-not-allowed disabled:text-neutral-400 disabled:no-underline dark:text-violet-400"
              >
                {countdown > 0 ? `Kirim ulang (${countdown}s)` : 'Kirim ulang'}
              </button>
              <button
                type="button"
                onClick={handleChangeNumber}
                disabled={busy}
                className="font-medium text-neutral-600 hover:underline disabled:opacity-60 dark:text-neutral-400"
              >
                Ganti nomor
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
