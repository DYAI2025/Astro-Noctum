import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams, origin } = requestUrl
  const code = searchParams.get('code')

  console.log("[Auth Callback] Request URL:", request.url);
  console.log("[Auth Callback] Code found:", !!code);

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("[Auth Callback] Success. User:", user?.id);
      
      if (user) {
         const { data: profile, error: profileError } = await supabase
            .from('astro_profiles')
            .select('user_id')
            .eq('user_id', user.id)
            .single();
         
         if (profileError && profileError.code !== 'PGRST116') {
             console.error("[Auth Callback] Profile Fetch Error:", profileError);
         }

         if (profile) {
             console.log("[Auth Callback] Profile found, redirecting to /astrosheet");
             return NextResponse.redirect(`${origin}/astrosheet`);
         } else {
             console.log("[Auth Callback] No profile, redirecting to /onboarding/astro");
             return NextResponse.redirect(`${origin}/onboarding/astro`);
         }
      }
    } else {
        console.error("[Auth Callback] Code Exchange Error:", error.message, error.status);
    }
  } else {
      console.warn("[Auth Callback] No code provided in URL");
  }

  // return the user to an error page with instructions
  console.log("[Auth Callback] Redirecting to error page");
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
