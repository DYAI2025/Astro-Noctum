/**
 * Synastry service — partner profile management + aspect computation.
 * DEC-synastry-architecture: synastry is a separate system, premium-only.
 */

import { supabase } from '@/src/lib/supabase';
import type { AspectDefinition } from '@/src/lib/synastry/aspects';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PartnerProfile {
  id: string;
  display_name: string;
  birth_date: string;        // ISO date string YYYY-MM-DD
  birth_time: string | null; // HH:MM, null if unknown
  iana_time_zone: string | null;
  birth_place: string | null;
  birth_lat: number | null;
  birth_lon: number | null;
  created_at: string;
}

export interface NewPartner {
  display_name: string;
  birth_date: string;
  birth_time: string | null;
  iana_time_zone: string | null;
  birth_place: string | null;
  birth_lat: number | null;
  birth_lon: number | null;
}

export interface SynastryAspectResult {
  planet1: string;
  planet2: string;
  type: AspectDefinition['name'];
  angle: number;
  orb: number;
  exact: boolean;
  narrative: string;
}

export interface SynastryResult {
  partner: { id: string; display_name: string; birth_place: string | null };
  aspects: SynastryAspectResult[];
  synastry_summary: string;
  narrative_source: 'template' | 'gemini';
  user_positions: Record<string, number>;
  partner_positions: Record<string, number>;
}

// ── Partner CRUD ──────────────────────────────────────────────────────────────

export async function getPartners(): Promise<PartnerProfile[]> {
  const { data, error } = await supabase
    .from('partner_profiles')
    .select('id, display_name, birth_date, birth_time, iana_time_zone, birth_place, birth_lat, birth_lon, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PartnerProfile[];
}

export async function addPartner(partner: NewPartner): Promise<PartnerProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('partner_profiles')
    .insert({ ...partner, user_id: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as PartnerProfile;
}

export async function deletePartner(id: string): Promise<void> {
  // Defence-in-depth: scope the delete to the authenticated user's rows even
  // though RLS already enforces this server-side (DEC-supabase-backend).
  // If RLS were ever misconfigured, a bare .eq('id', id) would allow any
  // authenticated user to delete any partner row by guessing its UUID.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('partner_profiles')
    .delete()
    .eq('user_id', user.id)
    .eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Synastry computation ──────────────────────────────────────────────────────

export async function computeSynastry(partnerId: string): Promise<SynastryResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  const res = await fetch('/api/synastry', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ partner_id: partnerId }),
  });

  if (res.status === 403) throw new Error('premium_required');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Server error ${res.status}`);
  }

  return res.json() as Promise<SynastryResult>;
}
