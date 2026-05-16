export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type ArtifactType =
  | 'test_suite'
  | 'ux_review'
  | 'bug_report'
  | 'gap_analysis'
  | 'semantic_link'
  | 'test_data'
  | 'persona_friction'
  | 'i18n_audit'
  | 'launch_readiness'
  | 'vision_map'
  | 'chat_response';

export type AppType  = 'mobile' | 'web' | 'desktop' | 'responsive' | 'pwa';
export type UserRole = 'manual_tester' | 'automation_engineer' | 'qa_lead' | 'product_manager' | 'ux_designer';
export type Platform = 'ios' | 'android' | 'web' | 'cross_platform';
export type AssetType = 'screenshot' | 'document' | 'prd';
export type PlanType  = 'free' | 'pro' | 'team';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  plan: PlanType;
  settings: Json;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  scope: string | null;
  target_audience: string | null;
  app_type: AppType | null;
  user_role: UserRole | null;
  platform: Platform | null;
  status: 'active' | 'archived' | 'deleted';
  manifest_snapshot: ManifestSnapshot;
  extended_providers_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ManifestSnapshot {
  test_suite?:     { artifact_id: string; tc_count?: number; coverage_score?: number; generated_at: string; model_used: string; is_verified: boolean };
  ux_review?:      { artifact_id: string; overall_score?: number; issues_count?: number; generated_at: string; model_used: string; is_verified: boolean };
  gap_analysis?:   { artifact_id: string; gaps_count?: number; generated_at: string; model_used: string; is_verified: boolean };
  vision_map?:     { artifact_id: string; generated_at: string; model_used: string; is_verified: boolean };
  screen_count?:   number;
  last_generation_at?: string;
}

export interface ProjectAsset {
  id: string;
  project_id: string;
  user_id: string;
  asset_type: AssetType;
  file_name: string;
  storage_path: string;
  content_hash: string;
  perceptual_hash: string | null;
  file_size: number | null;
  mime_type: string | null;
  metadata: {
    label?: string;
    order?: number;
    dimensions?: { width: number; height: number };
    vision_map_status?: 'pending' | 'ready' | 'stale';
  };
  is_dirty: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface GeneratedArtifact {
  id: string;
  project_id: string;
  user_id: string;
  artifact_type: ArtifactType;
  version: number;
  content: Json;
  input_snapshot: Json;
  prompt_version: string;
  model_used: string;
  provider: string;
  token_count: number | null;
  generation_time_ms: number | null;
  is_verified: boolean;
  verification_notes: string | null;
  is_latest: boolean;
  status: 'complete' | 'partial' | 'error';
  created_at: string;
}

export interface ChatSession {
  id: string;
  project_id: string;
  user_id: string;
  messages: ChatMessage[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
