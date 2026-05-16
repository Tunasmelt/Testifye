/**
 * Project service — browser-side CRUD using the anon/user Supabase client.
 * All operations require an authenticated user (RLS enforces ownership).
 */
'use client';

import { createClient } from '@/lib/supabase/client';
import type { Project, AppType, UserRole, Platform } from '@/lib/supabase/types';

// ── Create ────────────────────────────────────────────────────────────────────

export interface CreateProjectInput {
  name:            string;
  description:     string;
  scope?:          string;
  target_audience?: string;
  app_type?:       AppType;
  user_role?:      UserRole;
  platform?:       Platform;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id:     user.id,
      name:        input.name,
      description: input.description,
      scope:       input.scope       ?? null,
      target_audience: input.target_audience ?? null,
      app_type:    input.app_type    ?? null,
      user_role:   input.user_role   ?? null,
      platform:    input.platform    ?? null,
      status:      'active',
      manifest_snapshot: {},
      extended_providers_enabled: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'active')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  return data as Project | null;
}

// ── Update ────────────────────────────────────────────────────────────────────

export type UpdateProjectInput = Partial<CreateProjectInput>;

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('projects')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

// ── Archive (soft-delete) ─────────────────────────────────────────────────────

export async function archiveProject(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('projects')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// ── Assets ────────────────────────────────────────────────────────────────────

export async function getProjectAssets(projectId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('project_assets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
