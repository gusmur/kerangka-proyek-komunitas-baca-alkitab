import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, CalendarDays, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BIBLE_VERSIONS, DEFAULT_VERSION, type BibleVersionCode } from '../lib/bible/versions';
import { formatDateId } from './Groups';
import type { PlannerTemplate } from '../lib/types';

const NAME_MIN = 3;
const NAME_MAX = 80;
const CONFIG_ERROR_MESSAGE = 'Layanan belum dikonfigurasi. Hubungi pengelola aplikasi.';
const TEMPLATES_ERROR_MESSAGE = 'Daftar planner belum bisa dimuat. Periksa koneksi lalu coba lagi.';
const SUBMIT_ERROR_MESSAGE = 'Grup belum bisa dibuat. Periksa koneksi lalu coba lagi.';

/** Tanggal hari ini di zona Asia/Jakarta dengan format YYYY-MM-DD. */
function todayJakarta(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

interface FormErrors {
  name?: string;
  template?: string;
  startDate?: string;
}

export default function NewGroup() {
  const navigate = useNavigate();
  const today = useMemo(() => todayJakarta(), []);

  const [templates, setTemplates] = useState<PlannerTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState<boolean>(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateId, setTemplateId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(today);
  const [version, setVersion] = useState<BibleVersionCode>(DEFAULT_VERSION);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadTemplates = async () => {
    if (!supabase) {
      setTemplatesError(CONFIG_ERROR_MESSAGE);
      setTemplatesLoading(false);
      return;
    }

    setTemplatesLoading(true);
    setTemplatesError(null);

    const { data, error } = await supabase
      .from('planner_templates')
      .select('*')
      .eq('is_published', true)
      .order('title', { ascending: true });

    if (error) {
      console.error('Gagal memuat planner:', error.message);
      setTemplatesError(TEMPLATES_ERROR_MESSAGE);
      setTemplatesLoading(false);
      return;
    }

    setTemplates((data ?? []) as PlannerTemplate[]);
    setTemplatesLoading(false);
  };

  useEffect(() => {
    void loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedTemplate = templates.find((item) => item.id === templateId) ?? null;

  const endDate = selectedTemplate ? addDays(startDate, selectedTemplate.total_days - 1) : null;

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    const trimmed = name.trim();
    if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX) {
      next.name = `Nama grup harus ${NAME_MIN}–${NAME_MAX} karakter.`;
    }
    if (!templateId) {
      next.template = 'Pilih salah satu planner terlebih dahulu.';
    }
    if (!startDate || startDate < today) {
      next.startDate = 'Tanggal mulai tidak boleh sebelum hari ini.';
    }
    return next;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    setSubmitError(null);
    if (Object.keys(nextErrors).length > 0) return;

    if (!supabase) {
      setSubmitError(CONFIG_ERROR_MESSAGE);
      return;
    }

    setBusy(true);

    const { data, error } = await supabase.rpc('create_group', {
      p_name: name.trim(),
      p_description: description.trim() || null,
      p_template_id: templateId,
      p_start_date: startDate,
      p_default_version: version,
    });

    if (error) {
      console.error('Gagal membuat grup:', error.message);
      setSubmitError(error.message || SUBMIT_ERROR_MESSAGE);
      setBusy(false);
      return;
    }

    const newId = typeof data === 'string' ? data : (data as { id?: string } | null)?.id;
    if (!newId) {
      setSubmitError(SUBMIT_ERROR_MESSAGE);
      setBusy(false);
      return;
    }

    navigate(`/groups/${newId}`, { replace: true });
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Link
        to="/groups"
        className="inline-flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-violet-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:text-neutral-400 dark:hover:text-violet-400"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke Grup
      </Link>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Buat grup baru</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Pilih planner, tentukan tanggal mulai, lalu undang anggota grup.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="space-y-2">
          <label htmlFor="group-name" className="block text-sm font-medium">
            Nama grup
          </label>
          <input
            id="group-name"
            type="text"
            value={name}
            maxLength={NAME_MAX}
            onChange={(event) => setName(event.target.value)}
            disabled={busy}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'group-name-error' : undefined}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950"
            placeholder="Contoh: Keluarga Lestari"
          />
          {errors.name && (
            <p id="group-name-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
              {errors.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="group-description" className="block text-sm font-medium">
            Deskripsi <span className="font-normal text-neutral-500">(opsional)</span>
          </label>
          <textarea
            id="group-description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={busy}
            className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950"
            placeholder="Ceritakan tujuan membaca bersama"
          />
        </div>

        <fieldset className="space-y-3" disabled={busy}>
          <legend className="text-sm font-medium">Pilih planner</legend>

          {templatesLoading && (
            <div className="flex items-center gap-2 py-4 text-sm text-neutral-500 dark:text-neutral-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Memuat planner...
            </div>
          )}

          {!templatesLoading && templatesError && (
            <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
              <p className="text-sm text-red-600 dark:text-red-400">{templatesError}</p>
              <button
                type="button"
                onClick={() => void loadTemplates()}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/40"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Coba lagi
              </button>
            </div>
          )}

          {!templatesLoading && !templatesError && templates.length === 0 && (
            <p className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
              Belum ada planner yang diterbitkan. Silakan hubungi pengelola aplikasi.
            </p>
          )}

          {!templatesLoading && !templatesError && templates.length > 0 && (
            <ul className="grid gap-3">
              {templates.map((template) => {
                const selected = templateId === template.id;
                return (
                  <li key={template.id}>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-200 focus-within:ring-2 focus-within:ring-violet-500/60 ${
                        selected
                          ? 'border-violet-600 bg-violet-50 shadow-md dark:border-violet-400 dark:bg-violet-900/30'
                          : 'border-neutral-300 hover:border-violet-400 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="template"
                        value={template.id}
                        checked={selected}
                        onChange={() => setTemplateId(template.id)}
                        className="mt-1 h-4 w-4 accent-violet-600"
                      />
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden="true" />
                          {template.title}
                        </span>
                        {template.description && (
                          <span className="text-sm text-neutral-500 dark:text-neutral-400">{template.description}</span>
                        )}
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                          {template.total_days} hari
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          {errors.template && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {errors.template}
            </p>
          )}
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="start-date" className="block text-sm font-medium">
              Tanggal mulai
            </label>
            <input
              id="start-date"
              type="date"
              min={today}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              disabled={busy}
              aria-invalid={Boolean(errors.startDate)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950"
            />
            {errors.startDate && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {errors.startDate}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="end-date" className="block text-sm font-medium">
              Tanggal selesai
            </label>
            <div
              id="end-date"
              className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
            >
              <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{endDate ? formatDateId(endDate) : 'Pilih planner terlebih dahulu'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="default-version" className="block text-sm font-medium">
            Versi Alkitab default
          </label>
          <select
            id="default-version"
            value={version}
            onChange={(event) => setVersion(event.target.value as BibleVersionCode)}
            disabled={busy}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950"
          >
            {BIBLE_VERSIONS.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name} ({item.code.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {submitError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || templatesLoading || Boolean(templatesError)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {busy ? 'Membuat grup...' : 'Buat grup'}
        </button>
      </form>
    </section>
  );
}
