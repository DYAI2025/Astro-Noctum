import { motion } from "motion/react";
import { useLanguage } from "@/src/contexts/LanguageContext";
import { usePremium } from "@/src/hooks/usePremium";
import { Card } from "@/src/components/ui/card";
import { UpgradeButton } from "@/src/components/UpgradeButton";

interface Props {
  /** Optional fade-in delay for staged dashboard reveal. */
  delay?: number;
}

/**
 * The single prime upgrade CTA on `/` for free users.
 *
 * Renders nothing for premium users (they have no upgrade flow).
 * The TASK-1.3 single-CTA invariant requires this to be the ONLY
 * upgrade button visible on the dashboard for a free user — all
 * other surfaces (PremiumGate, AgentSection, AgentFloatingWidget,
 * nav-locks) are now lock-only or hidden.
 *
 * Mirrors the SignaturUpgradeCard pattern from Phase E so the test
 * surface is small and isolated. Replaces the previous inline JSX
 * block in Dashboard.tsx (lines 486–499 pre-Phase F-final).
 *
 * Note: the framer-motion wrapper here actually animates — the
 * previous inline version spread `fadeIn(0.28)` onto `<Card>` directly,
 * which is a plain `<div>` and silently no-ops the animation props.
 */
export function DashboardBottomUpgradeCard({ delay = 0.28 }: Props) {
  const { t } = useLanguage();
  const { isPremium } = usePremium();

  if (isPremium) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      data-testid="dashboard-bottom-upgrade-card"
      className="w-full max-w-6xl"
    >
      <Card
        variant="gold"
        className="p-6 flex items-center justify-between gap-4"
      >
        <div>
          <p className="text-sm font-medium text-ink">
            {t("dashboard.upgradeCard.title")}
          </p>
          <p className="text-xs text-ink/50 mt-1">
            {t("dashboard.upgradeCard.subtitle")}
          </p>
        </div>
        <UpgradeButton />
      </Card>
    </motion.div>
  );
}
