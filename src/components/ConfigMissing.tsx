export default function ConfigMissing() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <section
        role="alert"
        className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h1 className="text-xl font-semibold">Konfigurasi Supabase belum lengkap</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Aplikasi belum dapat terhubung ke database. Isi variabel berikut di file{' '}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs dark:bg-neutral-800">.env.local</code>{' '}
          pada folder utama proyek:
        </p>
        <ul className="mt-4 space-y-2 rounded-xl bg-neutral-100 p-4 font-mono text-xs dark:bg-neutral-800">
          <li>VITE_SUPABASE_URL=...</li>
          <li>VITE_SUPABASE_ANON_KEY=...</li>
        </ul>
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-neutral-600 dark:text-neutral-400">
          <li>Simpan file `.env.local` setelah mengisi kedua nilai di atas.</li>
          <li>Hentikan server pengembangan, lalu jalankan ulang dengan `npm run dev`.</li>
          <li>Muat ulang halaman ini di browser.</li>
        </ol>
      </section>
    </div>
  );
}
