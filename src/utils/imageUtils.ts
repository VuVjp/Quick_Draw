import { Skia, ColorType, AlphaType } from '@shopify/react-native-skia';

/**
 * Giải mã ảnh base64 PNG, resize về 64x64 bằng Skia, 
 * và chuyển đổi thành dạng Float32Array grayscale normalized [0, 1]
 * (Nền trắng -> 0.0, Nét vẽ đen -> 1.0)
 */
export async function base64ToTensor(base64: string): Promise<Float32Array> {
  // 1. Giải mã base64 sang Skia Image
  const data = Skia.Data.fromBase64(base64);
  const originalImage = Skia.Image.MakeImageFromEncoded(data);
  if (!originalImage) {
    throw new Error("Không thể giải mã hình ảnh từ chuỗi base64");
  }

  // 2. Tạo một 64x64 Skia Surface để thực hiện resize chất lượng cao trực tiếp trên native C++
  const surface = Skia.Surface.Make(64, 64);
  if (!surface) {
    throw new Error("Không thể khởi tạo Skia surface 64x64");
  }

  const canvas = surface.getCanvas();
  // Tô nền trắng chuẩn (theo cấu hình tập dữ liệu Quick Draw)
  canvas.drawColor(Skia.Color('#FFFFFF'));

  // Tính toán vùng vẽ và thực hiện drawImageRect để co dãn ảnh về đúng 64x64
  const src = Skia.XYWHRect(0, 0, originalImage.width(), originalImage.height());
  const dest = Skia.XYWHRect(0, 0, 64, 64);
  canvas.drawImageRect(originalImage, src, dest, Skia.Paint());

  // 3. Chụp lại snapshot từ surface đã được thu nhỏ
  const scaledImage = surface.makeImageSnapshot();

  // 4. Đọc dữ liệu điểm ảnh thô dưới định dạng RGBA_8888
  const pixels = scaledImage.readPixels(0, 0, {
    width: 64,
    height: 64,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  });

  if (!pixels) {
    throw new Error("Không thể đọc dữ liệu điểm ảnh (raw pixels) từ Skia image");
  }

  // 5. Chuyển đổi sang Grayscale Float32 normalized [0, 1] và đảo màu (Invert)
  const pixelCount = 64 * 64;
  const tensor = new Float32Array(pixelCount);

  // Vì định dạng là RGBA_8888, mỗi pixel chiếm 4 bytes (R, G, B, A)
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];
    
    // Tính toán độ xám theo công thức chuẩn luminance
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Chuẩn hóa về khoảng [0.0, 1.0] và đảo màu (1.0 - normalized_gray)
    // Nền trắng (255) -> 0.0, Nét vẽ đen (0) -> 1.0
    tensor[i] = 1.0 - (gray / 255.0);
  }

  return tensor;
}
