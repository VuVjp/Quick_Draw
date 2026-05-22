import { Buffer } from 'buffer'; // Đảm bảo đã cài hoặc có sẵn trong môi trường
import { ImageManipulator } from 'expo-image-manipulator';
import { decode as decodePng } from 'fast-png';

export async function base64ToTensor(base64: string): Promise<Float32Array> {
    // ── 1. Resize về 64×64 (Đã sửa lỗi Deprecated) ──────────────────────
    const context = ImageManipulator.manipulate(`data:image/png;base64,${base64}`);

    // Thực hiện hành động resize
    context.resize({ width: 64, height: 64 });

    // Render ảnh vào bộ nhớ tạm
    const imageRef = await context.renderAsync();

    // Lưu ảnh kèm cấu hình nén và định dạng đầu ra
    const result = await imageRef.saveAsync({
        compress: 1,
        format: ImageManipulator.SaveFormat.PNG,
        base64: true
    });

    if (!result.base64) {
        throw new Error("Không thể lấy chuỗi Base64 từ ImageManipulator");
    }

    // ── 2. Decode base64 → Uint8Array (Sửa lỗi giải mã trên Mobile) ──────
    // Không dùng atob() vì nó sẽ bị crash hoặc lỗi font chữ/ký tự đặc biệt trên React Native
    const pngBytes = new Uint8Array(Buffer.from(result.base64, 'base64'));

    // ── 3. Decode PNG → raw pixel data ──────────────────────────────
    const png = decodePng(pngBytes);
    const ch = png.channels;
    const pngData = png.data;

    // ── 4. Convert sang grayscale Float32 normalized [0, 1] ─────────
    const pixelCount = 64 * 64;
    const tensor = new Float32Array(pixelCount);

    // Tối ưu hóa hiệu năng bằng cách đưa điều kiện ch (channels) ra ngoài vòng lặp
    if (ch === 1) {
        for (let i = 0; i < pixelCount; i++) {
            tensor[i] = 1.0 - (pngData[i] / 255.0);
        }
    } else if (ch === 3) {
        for (let i = 0; i < pixelCount; i++) {
            const idx = i * 3;
            const gray = 0.299 * pngData[idx] + 0.587 * pngData[idx + 1] + 0.114 * pngData[idx + 2];
            tensor[i] = 1.0 - (gray / 255.0);
        }
    } else { // RGBA (ch === 4)
        for (let i = 0; i < pixelCount; i++) {
            const idx = i * 4;
            const gray = 0.299 * pngData[idx] + 0.587 * pngData[idx + 1] + 0.114 * pngData[idx + 2];
            tensor[i] = 1.0 - (gray / 255.0);
        }
    }

    return tensor;
}
