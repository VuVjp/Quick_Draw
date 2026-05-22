import { useEffect, useRef, useState } from 'react';
import { loadTensorflowModel } from 'react-native-fast-tflite';

const LABELS = require('../../assets/labels.json');

export function useTFLite() {
    const modelRef = useRef<InstanceType<typeof TensorflowModel> | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        async function load() {
            try {

                const model = await loadTensorflowModel(
                    require('../../assets/model.tflite'),
                    []
                );
                modelRef.current = model;
                setIsReady(true);
                console.log('TFLite model loaded');
            } catch (e) {
                console.error('Failed to load TFLite model:', e);
            }
        }
        load();
    }, [])

    async function predict(
        tensor: Float32Array,
        topK = 3
    ): Promise<{ label: string; score: number }[]> {
        const model = modelRef.current;
        if (!model) throw new Error('Model not loaded');

        // Input shape: [1, 64, 64, 1]
        const output = await model.run([tensor]);

        // output[0] là Float32Array với length = số class
        const scores = Array.from(output[0] as Float32Array);

        // Gắn label và sort
        const labeled = scores.map((score, i) => ({
            label: LABELS[i] ?? `class_${i}`,
            score,
        }));

        labeled.sort((a, b) => b.score - a.score);
        return labeled.slice(0, topK);
    }

    return { predict, isReady };
};