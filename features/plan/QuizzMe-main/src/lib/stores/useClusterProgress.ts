'use client';

import { useState, useEffect } from 'react';
import { ClusterProgress } from '@/lib/types/cluster';
import { CLUSTER_REGISTRY } from '@/lib/clusters/registry';

const STORAGE_KEY = 'quizzme_cluster_progress_v1';

export function useClusterProgress() {
  const [progress, setProgress] = useState<Record<string, ClusterProgress>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProgress(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load cluster progress:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever progress changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }
  }, [progress, isLoaded]);

  const initCluster = (clusterId: string) => {
    if (progress[clusterId]) return;

    const def = CLUSTER_REGISTRY[clusterId];
    if (!def) {
      console.warn(`Cluster definition not found for id: ${clusterId}`);
      return;
    }

    setProgress(prev => ({
      ...prev,
      [clusterId]: {
        clusterId,
        clusterName: def.name,
        totalQuizzes: def.quizzes.length,
        completedQuizzes: [],
        percentComplete: 0,
        isComplete: false,
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString()
      }
    }));
  };

  const completeQuiz = (clusterId: string, quizId: string, resultId: string, resultTitle: string) => {
    setProgress(prev => {
      const cluster = prev[clusterId] || {
        clusterId,
        clusterName: CLUSTER_REGISTRY[clusterId]?.name || 'Unknown',
        totalQuizzes: CLUSTER_REGISTRY[clusterId]?.quizzes.length || 0,
        completedQuizzes: [],
        percentComplete: 0,
        isComplete: false,
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString()
      };

      // Check if already completed
      if (cluster.completedQuizzes.some(q => q.quizId === quizId)) {
        return prev;
      }

      const completedQuizzes = [
        ...cluster.completedQuizzes,
        {
          quizId,
          completedAt: new Date().toISOString(),
          resultId,
          resultTitle
        }
      ];

      const percent = Math.round((completedQuizzes.length / cluster.totalQuizzes) * 100);
      const isComplete = completedQuizzes.length >= cluster.totalQuizzes;

      return {
        ...prev,
        [clusterId]: {
          ...cluster,
          completedQuizzes,
          percentComplete: percent,
          isComplete,
          lastActivityAt: new Date().toISOString()
        }
      };
    });
  };

  const getClusterProgress = (clusterId: string): ClusterProgress | null => {
    return progress[clusterId] || null;
  };

  return {
    progress,
    isLoaded,
    initCluster,
    completeQuiz,
    getClusterProgress
  };
}
