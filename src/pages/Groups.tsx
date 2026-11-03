import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Loader2, Plus, RefreshCw, Users } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Group, GroupRole } from '../lib/types';

interface MyGroupRow {
  role: GroupRole;
  groups: Pick<Group, 'id' | 'name' | 'description' | 'start_date' | 'end_date' | 'cover_url'> | null;
}

interface MyGroup {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  role: GroupRole;
}

const LOAD_ERROR_MESSAGE = 'Daftar grup belum bisa dimuat. Periksa koneksi lalu coba lagi.';
const CONFIG_ERROR_MESSAGE = 'Layanan belum dikonfigurasi. Hubungi pengelola aplikasi.';

export function formatDateId(value: string): string {
  return new Date(`${value}T00:00:00+07:00`).toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function Groups() {
  const { user } = useAuth();
  const userId = user?.id;

  const [groups, setGroups] = useState<MyGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setError(CONFIG_ERROR_MESSAGE);
      setLoading(false);
      return;
    }
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('group_members')
      .select('role, groups(id,name,description,start_date,end_date,cover_url)')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (queryError) {
      console.error('Gagal memuat grup:', queryError.message);
      setError(LOAD_ERROR_MESSAGE);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as unknown as MyGroupRow[];
    const mapped: MyGroup[] = rows.flatMap((row) =>
      row.groups
        ? [
            {
              id: row.groups.id,
              name: row.groups.name,
              start_date: row.groups.start_date,
              end_date: row.groups.end_date,
              role: row.role,
            },
          ]
        : [],
    );

    setGroups(mapped);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  let content: React.ReactNode;

  if (loading) {
    content = (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-neutral-500 dark:text-neutral-400">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        <p className="text-sm">Memuat grup Anda...</p>
      </div>
    );
  } else if (error) {
    content = (
      <div role="alert" className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/40">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/40"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Coba lagi
        </button>
      </div>
    );
  } else if (groups.length === 0) {
    content = (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
          <Users className="h-7 w-7" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <p className="text-base font-semibold">Belum ada grup</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Buat grup pertama Anda dan ajak keluarga atau teman membaca Alkitab bersama.
          </p>
        </div>
        <Link
          to="/groups/baru"
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Buat grup
        </Link>
      </div>
    );
  } else {
    content = (
      <ul className="grid gap-4 sm:grid-cols-2">
        {groups.map((group) => (
          <li key={group.id}>
            <Link
              to={`/groups/${group.id}`}
              className="group flex h-full flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-violet-500"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold leading-snug">{group.name}</h2>
                {group.role === 'admin' && (
                  <span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                    Admin
                  </span>
                )}
              </div>
              <p className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {formatDateId(group.start_date)} – {formatDateId(group.end_date)}
                </span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Grup</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Grup membaca Alkitab yang Anda ikuti</p>
        </div>
        <Link
          to="/groups/baru"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Buat grup
        </Link>
      </header>
      {content}
    </section>
  );
}
