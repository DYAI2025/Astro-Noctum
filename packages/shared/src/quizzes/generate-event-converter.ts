import type { DimensionSpec, EventConverterSpec } from './generator-types';

/**
 * Converts a snake_case or underscore-separated quiz ID to camelCase.
 * Also handles trailing digit groups (e.g. "01" stays as-is after camelCase join).
 */
function toCamelCase(id: string): string {
  return id.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

/**
 * Generates an EventConverterSpec that describes how quiz scores map to
 * ContributionEvent markers. The spec is a pure data structure — the actual
 * runtime converter function is generated from it in a later pipeline stage.
 *
 * @param quizId  - Internal quiz identifier (e.g. "shadow_archetype_01")
 * @param dimensions - The quiz's scoring dimensions with marker metadata
 * @returns EventConverterSpec with moduleId, functionName, and dimension-to-marker mappings
 */
export function generateEventConverter(
  quizId: string,
  dimensions: DimensionSpec[],
): EventConverterSpec {
  return {
    functionName: `${toCamelCase(quizId)}ToEvent`,
    moduleId: `quiz.${quizId}.v1`,
    dimensionToMarkers: dimensions.map((dim) => ({
      dimensionKey: dim.key,
      markers: dim.markerKeywords.map((kw) => ({
        id: `marker.${dim.markerDomain}.${kw}`,
        weightFormula: `normalize(scores.${dim.key})`,
      })),
    })),
  };
}
