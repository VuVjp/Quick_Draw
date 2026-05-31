import { useEffect, useRef, useState } from 'react';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import { Asset } from 'expo-asset';

const LABELS = require('../../assets/labels.json');

// Khai báo kiểu dữ liệu cho Model nếu thư viện chưa tự suy luận tốt
type TensorflowModel = Awaited<ReturnType<typeof loadTensorflowModel>>;

export function useTFLite() {
    const modelRef = useRef<TensorflowModel | null>(null);
    const [isReady, setIsReady] = useState(false);
    const inputBufferRef = useRef(
        new Float32Array(1 * 64 * 64 * 1)
    );

    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                console.log('Starting to load TFLite model...');

                // 1. Phân giải file require thông qua expo-asset để lấy đường dẫn thực (localUri)
                const asset = Asset.fromModule(require('../../assets/model.tflite'));
                await asset.downloadAsync();

                const modelPath = asset.localUri || asset.uri;
                if (!modelPath) {
                    throw new Error('Could not resolve local URI for model.tflite');
                }

                console.log('Resolved model path:', modelPath);

                // 2. Nạp model bằng đường dẫn thật đã được trích xuất
                // Thêm cấu hình delegate mặc định "default" để chạy ổn định trên Release Android
                const model = await loadTensorflowModel({ url: modelPath }, [] );

                if (!mounted) {
                    // Nếu component đã unmount thì dọn dẹp bộ nhớ native ngay
                    // Lưu ý: react-native-fast-tflite bản mới dùng JSI, giải phóng qua bộ gom rác hoặc close()
                    return;
                }

                modelRef.current = model;
                setIsReady(true);
                console.log('TFLite model loaded successfully on Release/Debug!');
            } catch (e) {
                console.error('Failed to load TFLite model:', e);
            }
        }
        load();

        return () => {
            mounted = false;
            // Dọn dẹp model khi hook bị hủy (tránh rò rỉ bộ nhớ RAM native)
            if (modelRef.current) {
                console.log('Cleaning up TFLite model context...');
                modelRef.current = null;
            }
        };
    }, []);

    async function predict(
        tensor: Float32Array,
        topK = 3
    ): Promise<{ label: string; score: number }[]> {

        const model = modelRef.current;

        if (!model) {
            throw new Error('Model not loaded yet');
        }

        const input = inputBufferRef.current;

        // Đảm bảo dữ liệu đầu vào khớp chính xác cấu trúc
        input.set(tensor);

        try {
            // Chạy Inference trực tiếp qua ArrayBuffer mã hóa nhị phân
            const output = model.runSync([input.buffer]);

            // Validate dữ liệu đầu ra từ model native
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

            // Convert TypedArray sang mảng JavaScript chuẩn
            const scores = Array.from(rawScores as number[]);

            if (scores.length === 0) {
                throw new Error('Scores array is empty');
            }

            // Gắn nhãn phân loại từ file labels.json
            const labeled = scores.map((score, i) => ({
                label: LABELS?.[i] ?? `class_${i}`,
                score,
            }));

            // Sắp xếp giảm dần theo điểm số độ tự tin (Score)
            labeled.sort((a, b) => b.score - a.score);

            const topPredictions = labeled.slice(0, topK);

            return topPredictions;

        } catch (e) {
            console.error('Inference error during prediction:', e);
            return [];
        }
    }

    return { predict, isReady };
}