/**
 * useScrollProgress — Reusable hook that clamps a master progress
 * value into a local 0→1 range for a specific scroll phase.
 *
 * Example:
 *   const scanProgress = useScrollProgress(masterRef, 0.25, 0.45);
 *   // returns 0 below 25%, 1 above 45%, and linearly interpolates between.
 */
import { useRef, useCallback } from "react";

export function useScrollProgress(
  masterRef: React.MutableRefObject<{ value: number }>,
  start: number,
  end: number
) {
  const localRef = useRef({ value: 0 });

  const update = useCallback(() => {
    const p = masterRef.current.value;
    localRef.current.value = Math.min(Math.max((p - start) / (end - start), 0), 1);
  }, [masterRef, start, end]);

  return { ref: localRef, update };
}
