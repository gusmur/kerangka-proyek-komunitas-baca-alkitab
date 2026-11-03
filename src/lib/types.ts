export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  phone_last4: string | null;
  preferred_version: string | null;
  is_super_admin: boolean;
}

export interface PlannerTemplate {
  id: string;
  title: string;
  description: string | null;
  total_days: number;
  is_published: boolean;
}

export type GroupRole = 'admin' | 'member';

export type GroupMemberStatus = 'active' | 'left';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  start_date: string;
  end_date: string;
  admin_id: string;
  template_id: string | null;
  default_version: string;
  inactive_after_days: number | null;
  invite_code: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: GroupRole;
  status: GroupMemberStatus;
  joined_at: string;
}
