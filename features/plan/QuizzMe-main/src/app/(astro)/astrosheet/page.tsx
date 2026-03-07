'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AstroSheet from '@/components/astro-sheet/AstroSheet';
import { Loader2 } from 'lucide-react';

export default function AstroSheetPage() {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.replace('/login');
                    return;
                }

                const { data: profile } = await supabase
                    .from('astro_profiles')
                    .select('user_id')
                    .eq('user_id', session.user.id)
                    .single();

                if (!profile) {
                    router.replace('/onboarding/astro');
                    return;
                }

                setLoading(false);
            } catch (e) {
                console.error("Auth check failed:", e);
                router.replace('/login');
            }
        };

        checkAuth();
    }, [router, supabase]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F6F3EE]">
                <Loader2 className="animate-spin text-[#C9A46A]" size={32} />
            </div>
        );
    }

    return <AstroSheet />;
}
