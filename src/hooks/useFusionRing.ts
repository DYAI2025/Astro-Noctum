import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ContributionEvent } from '@/src/lib/lme/types';
import type { ApiData } from '@/src/types/bafe';
import type { FusionRingSignal } from '@/src/lib/fusion-ring';
import {
  westernToSectors,
  baziToSectors,
  wuxingToSectors,
  fuseAllEvents,
  computeFusionSignal,
  findClusterForModule,
  isClusterComplete,
  CLUSTER_REGISTRY,
} from '@/src/lib/fusion-ring';
import { saveContributionEvent, loadUserEvents } from '@/src/services/contribution-events';

export function useFusionRing(
  apiResults: ApiData | null,
  userId?: string,
) {
  const [events, setEvents] = useState<ContributionEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  // Events aus Supabase laden (einmalig bei Mount)
  useEffect(() => {
    if (!userId || eventsLoaded) return;
    loadUserEvents(userId)
      .then(loaded => {
        setEvents(loaded);
        setEventsLoaded(true);
      })
      .catch(() => {
        setEventsLoaded(true); // Unblock UI even on failure
      });
  }, [userId, eventsLoaded]);

  // W(s) aus BAFE Western-Daten
  const W = useMemo(() => {
    if (!apiResults?.western) return new Array(12).fill(0);
    return westernToSectors(
      apiResults.western.zodiac_sign,
      apiResults.western.moon_sign,
      apiResults.western.ascendant_sign,
    );
  }, [apiResults?.western]);

  // B(s) aus BAFE BaZi-Daten
  const B = useMemo(() => {
    if (!apiResults?.bazi?.pillars) return new Array(12).fill(0);
    const p = apiResults.bazi.pillars;
    return baziToSectors({
      day: p.day?.animal,
      year: p.year?.animal,
      month: p.month?.animal,
      hour: p.hour?.animal,
    });
  }, [apiResults?.bazi]);

  // X(s) aus BAFE Wu-Xing-Daten
  const X = useMemo(() => {
    if (!apiResults?.wuxing?.elements) return new Array(12).fill(0);
    return wuxingToSectors(apiResults.wuxing.elements);
  }, [apiResults?.wuxing]);

  const completedIds = useMemo(
    () => new Set(events.map(e => e.source.moduleId)),
    [events],
  );

  // T(s) — only fire events whose cluster is complete (or standalone)
  const activeEvents = useMemo(() => {
    return events.filter(e => {
      const cluster = findClusterForModule(e.source.moduleId);
      if (!cluster) return true; // standalone → immediately active
      return isClusterComplete(cluster, completedIds);
    });
  }, [events, completedIds]);

  const T = useMemo(() => fuseAllEvents(activeEvents), [activeEvents]);

  // Finale Signal-Komposition
  const signal: FusionRingSignal | null = useMemo(() => {
    if (!apiResults) return null;
    const completedClusters = CLUSTER_REGISTRY.filter(c =>
      isClusterComplete(c, completedIds)
    ).length;
    return computeFusionSignal(W, B, X, T, completedClusters, CLUSTER_REGISTRY.length);
  }, [W, B, X, T, apiResults, completedIds]);

  // Quiz-Completion Handler
  const addQuizResult = useCallback((event: ContributionEvent) => {
    // Duplikat-Check: selbes moduleId nicht doppelt
    setEvents(prev => {
      const existing = prev.find(e => e.source.moduleId === event.source.moduleId);
      if (existing) {
        // Überschreibe vorheriges Ergebnis
        return prev.map(e => e.source.moduleId === event.source.moduleId ? event : e);
      }
      return [...prev, event];
    });
    saveContributionEvent(event, userId);
  }, [userId]);

  // Abgeschlossene Quiz-Module
  const completedModules = completedIds;

  return {
    signal,
    events,
    addQuizResult,
    completedModules,
    eventsLoaded,
  };
}
