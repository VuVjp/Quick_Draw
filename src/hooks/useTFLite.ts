import { useEffect, useRef, useState } from 'react';
import { loadTensorflowModel } from 'react-native-fast-tflite';

const LABELS = require('../../assets/labels.json');

export function useTFLite() {
    const modelRef = useRef<InstanceType<typeof TensorflowModel> | null>(null);
    const [isReady, setIsReady] = useState(false);
    const inputBufferRef = useRef(
        new Float32Array(1 * 64 * 64 * 1)
    );

    useEffect(() => {
        let mounted = true;
        async function load() {
            try {

                const model = await loadTensorflowModel(
                    require('../../assets/model.tflite'),
                    []
                );
                if (!mounted) {
                    model.dispose?.();
                    return;
                }
                modelRef.current = model;
                setIsReady(true);
                // console.log('TFLite model loaded');
            } catch (e) {
                // console.error('Failed to load TFLite model:', e);
            }
        }
        load();

        return () => {
            mounted = false;

            modelRef.current?.close?.();
            modelRef.current = null;
        };

    }, [])

    async function predict(
        tensor: Float32Array,
        topK = 3
    ): Promise<{ label: string; score: number }[]> {

        const model = modelRef.current;

        if (!model) {
            throw new Error('Model not loaded');
        }

        // Debug model info
        // console.log('INPUTS:', model.inputs);
        // console.log('OUTPUTS:', model.outputs);

        // Ensure exact input size
        const input = inputBufferRef.current;

        // tensor length phải = 4096
        input.set(tensor);

        // console.log('INPUT LENGTH:', input.length);
        // console.log('INPUT BYTES:', input.byteLength);

        try {

            // Use runSync for stable output
            const output = model.runSync([input.buffer]);

            // console.log('RAW OUTPUT:', output);

            // Validate output
            if (
                !output ||
                !Array.isArray(output) ||
                output.length === 0
            ) {
                throw new Error('Invalid model output');
            }


            const rawScores = output.map((o) => new Float32Array(o))[0];

            if (!rawScores) {
                throw new Error('Output tensor is empty');
            }


            // Convert output → JS array
            const scores = Array.from(rawScores as number[]);

            // console.log('SCORES:', scores.map((s, i) => `${LABELS?.[i] ?? `class_${i}`}: ${s.toFixed(4)}`).join(', '));

            if (scores.length === 0) {
                throw new Error('Scores array is empty');
            }

            // Map labels
            const labeled = scores.map((score, i) => ({
                label: LABELS?.[i] ?? `class_${i}`,
                score,
            }));

            // Sort descending
            labeled.sort((a, b) => b.score - a.score);

            const topPredictions = labeled.slice(0, topK);

            // console.log('TOP PREDICTIONS:', topPredictions);

            return topPredictions;

        } catch (e) {

            // console.error('Inference error:', e);

            return [];
        }
    }
    return { predict, isReady };
};