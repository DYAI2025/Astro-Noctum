import { createClient } from '@/lib/supabase/client';

export type ProfileInput = {
    username: string;
    birth_date: string;
    birth_time: string;
    birth_place_name: string;
    birth_place_country?: string;
    birth_lat: number;
    birth_lng: number;
    iana_time_zone: string;
    fold?: number | null;
};

function assertRequiredFields(data: ProfileInput) {
    const missing: string[] = [];
    if (!data.birth_date) missing.push('birth_date');
    if (!data.birth_time) missing.push('birth_time');
    if (typeof data.birth_lat !== 'number' || Number.isNaN(data.birth_lat)) missing.push('birth_lat');
    if (typeof data.birth_lng !== 'number' || Number.isNaN(data.birth_lng)) missing.push('birth_lng');
    if (!data.iana_time_zone) missing.push('iana_time_zone');

    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
}

export async function upsertProfile(data: ProfileInput) {
    assertRequiredFields(data);

    const supabase = createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    const timeHHMMRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    const normalizedTime = timeHHMMRegex.test(data.birth_time)
        ? `${data.birth_time}:00`
        : data.birth_time;

    const payload = {
        user_id: user.id,
        username: data.username,
        birth_date: data.birth_date,
        birth_time: normalizedTime,
        birth_time_local: normalizedTime,
        birth_place_name: data.birth_place_name,
        birth_place_country: data.birth_place_country ?? null,
        birth_lat: data.birth_lat,
        birth_lng: data.birth_lng,
        iana_time_zone: data.iana_time_zone,
        fold: data.fold ?? null,
        input_status: 'ready',
        astro_validation_status: null,
        astro_compute_hash: null,
        astro_computed_at: null,
        updated_at: new Date().toISOString()
    };

    const { error } = await supabase
        .from('astro_profiles')
        .upsert(payload)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to save profile: ${error.message}`);
    }

    return { success: true };
}
