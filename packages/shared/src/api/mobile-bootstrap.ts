import { z } from "zod";

export const MobileBootstrapSchema = z.object({
  api_version: z.string(),
  server_time: z.string(),
  min_supported_versions: z.object({
    ios: z.string(),
    android: z.string()
  }),
  feature_flags: z.object({
    quizzes_enabled: z.boolean(),
    wissen_enabled: z.boolean(),
    levi_voice_enabled: z.boolean(),
    fu_ring_native_enabled: z.boolean(),
    transit_polling_enabled: z.boolean()
  }),
  checkout: z.object({
    default_success_url: z.string(),
    default_cancel_url: z.string(),
    allowed_return_origins: z.array(z.string()),
    allowed_return_schemes: z.array(z.string()),
    app_scheme: z.string()
  }),
  voice: z.object({
    provider: z.string(),
    mode: z.string(),
    requires_premium: z.boolean(),
    agent_id: z.string().nullable(),
    profile_endpoint_template: z.string()
  })
});

export type MobileBootstrap = z.infer<typeof MobileBootstrapSchema>;
