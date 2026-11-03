# KONTEKS TETAP: Aplikasi "Komunitas Baca Alkitab"

UI Bahasa Indonesia, mobile-first.

**Stack:** Vite + React 18 + TypeScript + Tailwind CSS 3.4 + react-router-dom 6 + @supabase/supabase-js + lucide-react.
**Deploy:** Vercel.

## Aturan

- JANGAN pakai Next.js, shadcn/ui, Tailwind v4, atau library UI lain. Hanya Tailwind + lucide-react.
- JANGAN install package selain yang disebut di prompt.
- JANGAN menulis SQL/migrasi/RLS; database sudah dibuat di Supabase (tabel & RPC sudah ada).
- JANGAN menjalankan `npm run build` atau lint; cukup pastikan dev server berjalan tanpa error.
- Ubah HANYA file yang disebut di prompt. Di akhir, tulis daftar file yang dibuat/diubah (maks 10 baris), tanpa "langkah berikutnya".
- Tanggal selalu dihitung zona Asia/Jakarta. Semua teks UI Bahasa Indonesia.
- Env klien: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Jangan pernah memakai service role key di kode klien.
- Setiap pemanggilan Supabase wajib menangani error dan menampilkan pesan ramah (jangan crash/blank).

## Skema DB (ringkas)

- `profiles(id, display_name, avatar_url, phone_last4, preferred_version, is_super_admin)`
- `planner_templates(id, title, description, total_days, is_published)`
- `planner_items(id, template_id, day_number, seq, book_code, chapter)`
- `groups(id, name, description, cover_url, admin_id, template_id, start_date, end_date, default_version, inactive_after_days, invite_code)`
- `group_members(group_id, user_id, role 'admin' | 'member', status 'active' | 'left', joined_at)`
- `reading_logs(id, group_id, user_id, planner_item_id, completed_at)`
- View `group_sharing_feed(id, group_id, user_id, display_name, avatar_url, version, book_code, chapter, verse_start, verse_end, verse_text, note, note_visible_to_group, day_number, completed_at, created_at)`

## RPC

- `create_group(p_name, p_description, p_template_id, p_start_date, p_default_version)`
- `get_group_preview(p_code)`
- `join_group_by_code(p_code)`
- `leave_group(p_group_id)`
- `remove_member(p_group_id, p_user_id)`
- `regenerate_invite_code(p_group_id)`
- `update_group(p_group_id, p_name, p_description, p_cover_url, p_inactive_after_days, p_start_date, p_default_version)`
- `complete_reading(p_group_id, p_planner_item_id, p_favorites jsonb)`
- `update_favorite_note(p_id, p_note, p_visible)`
- `get_group_progress(p_group_id)`
