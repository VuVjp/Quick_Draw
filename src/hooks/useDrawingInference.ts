// hooks/useDrawingInference.ts
import { useCallback, useRef } from 'react';
import { base64ToTensor } from '../utils/imageUtils';
import { useTFLite } from './useTFLite';

const CONFIDENCE_THRESHOLD_STANDARD = 0.85;
const CONFIDENCE_THRESHOLD_PEER_REVIEW = 0.90;

interface InferenceResult {
  label: string;
  score: number;
  accepted: boolean;
}

export function useDrawingInference(peerReviewMode: boolean) {
  const { predict, isReady } = useTFLite();
  const isRunning = useRef(false); // Debounce — tránh chạy đồng thời

  const runInference = useCallback(
    async (base64: string, targetTopic: string): Promise<InferenceResult | null> => {
      if (!isReady || isRunning.current) return null;

      isRunning.current = true;
      try {

        const tensor = await base64ToTensor(base64);
        const predictions = await predict(tensor, 3);
        const top1 = predictions[0];

        const threshold = peerReviewMode
          ? CONFIDENCE_THRESHOLD_PEER_REVIEW
          : CONFIDENCE_THRESHOLD_STANDARD;

        let acceptedLabel = null; // Default to null, will be set if any prediction meets criteria
        predictions.forEach((p) => {
          if (p.score >= 0.4 && p.label === targetTopic) {
            acceptedLabel = p.label;
          }
        });

        // Also accept if it is top 1 and has at least a small confidence (e.g. 0.2)
        const accepted = acceptedLabel !== null || (top1.label === targetTopic && top1.score >= 0.2);

        return {
          label: acceptedLabel ?? top1.label,
          score: top1.score,
          accepted,
        };
      } finally {
        isRunning.current = false;
      }
    },
    [isReady, predict, peerReviewMode]
  );

  return { runInference, isReady };
}