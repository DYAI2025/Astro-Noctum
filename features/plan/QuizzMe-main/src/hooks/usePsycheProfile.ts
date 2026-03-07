import { useState, useEffect, useCallback, useMemo } from 'react';
import { PsycheProfileV1, PsycheDelta } from '@/lib/types/psyche';
import { MOCK_PSYCHE_PROFILE } from '@/data/mocks/psyche';
import { getDeviceId } from '@/lib/device-id';
import { createClient } from '@/lib/supabase/client';

interface Mover {
    dimension: string;
    delta: number;
    magnitude: number;
}

interface UsePsycheProfileResult {
    profile: PsycheProfileV1 | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    saveProfile: (profile: Partial<PsycheProfileV1>) => Promise<boolean>;
    // Banner-related state
    showBanner: boolean;
    dismissBanner: () => void;
    movers: Mover[];
    delta: PsycheDelta | null;
    isSignificantChange: boolean;
}

const BANNER_DURATION_MS = 10000; // 10 seconds

/**
 * Hook to fetch and manage psyche profile data
 * Uses Supabase directly from the client (for static export compatibility)
 */
export function usePsycheProfile(): UsePsycheProfileResult {
    const [profile, setProfile] = useState<PsycheProfileV1 | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const supabase = useMemo(() => createClient(), []);

    // Compute movers from delta
    const movers = useMemo<Mover[]>(() => {
        if (!profile?.last_delta?.stats_delta) return [];
        
        const deltas = profile.last_delta.stats_delta;
        const moverList: Mover[] = [];
        
        for (const [dimension, delta] of Object.entries(deltas)) {
            if (delta !== undefined && delta !== 0) {
                moverList.push({
                    dimension,
                    delta,
                    magnitude: Math.abs(delta),
                });
            }
        }
        
        // Sort by magnitude descending
        return moverList.sort((a, b) => b.magnitude - a.magnitude);
    }, [profile?.last_delta?.stats_delta]);

    const isSignificantChange = useMemo(() => {
        return movers.some(m => m.magnitude >= 0.05); // 5% threshold
    }, [movers]);

    const dismissBanner = useCallback(() => {
        setShowBanner(false);
    }, []);

    const fetchProfile = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const deviceId = getDeviceId();
            
            if (!deviceId) {
                // No device ID (SSR) - use mock
                setProfile(MOCK_PSYCHE_PROFILE);
                setIsLoading(false);
                return;
            }

            const { data, error: fetchError } = await supabase
                .from('psyche_profiles')
                .select('*')
                .eq('device_id', deviceId)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (fetchError) {
                throw fetchError;
            }

            if (data) {
                setProfile(rowToProfile(data));
            } else {
                // No profile exists yet - use mock as default
                setProfile(MOCK_PSYCHE_PROFILE);
            }
            
        } catch (err) {
            console.error('Error fetching psyche profile:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
            // Fallback to mock on error
            setProfile(MOCK_PSYCHE_PROFILE);
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    const saveProfile = useCallback(async (profileData: Partial<PsycheProfileV1>): Promise<boolean> => {
        try {
            const deviceId = getDeviceId();
            
            if (!deviceId) {
                console.warn('Cannot save profile without device ID');
                return false;
            }

            // Merge with existing profile
            const mergedStats = {
                clarity: profileData.stats?.clarity ?? profile?.stats?.clarity ?? 0.5,
                courage: profileData.stats?.courage ?? profile?.stats?.courage ?? 0.5,
                connection: profileData.stats?.connection ?? profile?.stats?.connection ?? 0.5,
                order: profileData.stats?.order ?? profile?.stats?.order ?? 0.5,
                shadow: profileData.stats?.shadow ?? profile?.stats?.shadow ?? 0.5,
            };
            
            const mergedState = {
                shadow_light: profileData.state?.shadow_light ?? profile?.state?.shadow_light ?? 0.5,
                cold_warm: profileData.state?.cold_warm ?? profile?.state?.cold_warm ?? 0.5,
                surface_depth: profileData.state?.surface_depth ?? profile?.state?.surface_depth ?? 0.5,
                me_we: profileData.state?.me_we ?? profile?.state?.me_we ?? 0.5,
                mind_heart: profileData.state?.mind_heart ?? profile?.state?.mind_heart ?? 0.5,
            };

            // Check if profile exists
            const { data: existing } = await supabase
                .from('psyche_profiles')
                .select('id')
                .eq('device_id', deviceId)
                .limit(1)
                .maybeSingle();

            const insertData = {
                device_id: deviceId,
                ...mergedStats,
                ...mergedState,
                meta_stats: profileData.meta_stats ?? profile?.meta_stats ?? null,
                archetype_params: profileData.archetype_params ?? profile?.archetype_params ?? null,
                narrative_snippet: profileData.narrative_snippet ?? profile?.narrative_snippet ?? null,
                last_delta: profileData.last_delta ?? profile?.last_delta ?? null,
            };

            let resultData;
            let resultError;

            if (existing?.id) {
                // Update existing profile
                const result = await supabase
                    .from('psyche_profiles')
                    .update(insertData)
                    .eq('id', existing.id)
                    .select()
                    .single();
                resultData = result.data;
                resultError = result.error;
            } else {
                // Insert new profile
                const result = await supabase
                    .from('psyche_profiles')
                    .insert(insertData)
                    .select()
                    .single();
                resultData = result.data;
                resultError = result.error;
            }

            if (resultError) {
                throw resultError;
            }

            if (resultData) {
                const savedProfile = rowToProfile(resultData);
                setProfile(savedProfile);
                
                // Show banner if there's a significant change
                if (savedProfile.last_delta) {
                    setShowBanner(true);
                }
            }
            
            return true;
            
        } catch (err) {
            console.error('Error saving psyche profile:', err);
            return false;
        }
    }, [profile, supabase]);

    // Auto-dismiss banner after timeout
    useEffect(() => {
        if (showBanner) {
            const timer = setTimeout(() => {
                setShowBanner(false);
            }, BANNER_DURATION_MS);
            
            return () => clearTimeout(timer);
        }
    }, [showBanner]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    useEffect(() => {
        const deviceId = getDeviceId();
        if (!deviceId) return;

        const channel = supabase
            .channel(`psyche-profiles-realtime-${deviceId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'psyche_profiles', filter: `device_id=eq.${deviceId}` },
                (payload) => {
                    if (payload.new) {
                        setProfile(rowToProfile(payload.new as PsycheProfileRow));
                    }
                }
            );

        channel.subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    return { 
        profile, 
        isLoading, 
        error, 
        refetch: fetchProfile,
        saveProfile,
        showBanner,
        dismissBanner,
        movers,
        delta: profile?.last_delta ?? null,
        isSignificantChange,
    };
}

// Define row type for Supabase response
interface PsycheProfileRow {
    id: string;
    user_id: string | null;
    device_id: string | null;
    clarity: number;
    courage: number;
    connection: number;
    order: number;
    shadow: number;
    shadow_light: number;
    cold_warm: number;
    surface_depth: number;
    me_we: number;
    mind_heart: number;
    meta_stats: unknown;
    archetype_params: unknown;
    narrative_snippet: string | null;
    last_delta: unknown;
    created_at: string;
    updated_at: string;
}

/**
 * Transform database row to PsycheProfileV1
 */
function rowToProfile(row: PsycheProfileRow): PsycheProfileV1 {
    return {
        id: row.id,
        user_id: row.user_id ?? undefined,
        created_at: row.created_at,
        updated_at: row.updated_at,
        
        stats: {
            clarity: row.clarity,
            courage: row.courage,
            connection: row.connection,
            order: row.order,
            shadow: row.shadow,
        },
        
        state: {
            shadow_light: row.shadow_light,
            cold_warm: row.cold_warm,
            surface_depth: row.surface_depth,
            me_we: row.me_we,
            mind_heart: row.mind_heart,
        },
        
        meta_stats: row.meta_stats as PsycheProfileV1['meta_stats'],
        archetype_params: row.archetype_params as PsycheProfileV1['archetype_params'],
        narrative_snippet: row.narrative_snippet ?? undefined,
        last_delta: row.last_delta as PsycheProfileV1['last_delta'],
    };
}
