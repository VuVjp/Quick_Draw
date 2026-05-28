import { Skia, ColorType, AlphaType } from '@shopify/react-native-skia';
import {
  documentDirectory,
  writeAsStringAsync,
} from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

/**
 * Base64 PNG -> Float32Array tensor [64x64]
 *
 * Pipeline:
 * 1. Decode image
 * 2. Detect bounding box
 * 3. Crop stroke region
 * 4. Pad thành square
 * 5. Center content
 * 6. Resize về 64x64
 * 7. Normalize grayscale [0,1]
 *
 * Output:
 * - background white => 0.0
 * - stroke black => 1.0
 */
export async function base64ToTensor(
  base64: string
): Promise<Float32Array> {
  // =====================================================
  // 1. Decode image
  // =====================================================

  const data = Skia.Data.fromBase64(base64);
  const originalImage = Skia.Image.MakeImageFromEncoded(data);

  if (!originalImage) {
    throw new Error('Không thể decode image');
  }

  const W = originalImage.width();
  const H = originalImage.height();

  // =====================================================
  // 2. Draw image lên surface để đọc pixels
  // =====================================================

  const originalSurface = Skia.Surface.Make(W, H);

  if (!originalSurface) {
    throw new Error('Không thể tạo original surface');
  }

  const originalCanvas = originalSurface.getCanvas();

  // nền trắng
  originalCanvas.drawColor(Skia.Color('#FFFFFF'));

  // draw image
  originalCanvas.drawImage(
    originalImage,
    0,
    0,
    Skia.Paint()
  );

  const originalSnapshot =
    originalSurface.makeImageSnapshot();

  const originalPixels = originalSnapshot.readPixels(0, 0, {
    width: W,
    height: H,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  });

  if (!originalPixels) {
    throw new Error('Không thể đọc pixels');
  }

  // =====================================================
  // 3. Detect bounding box
  // =====================================================

  const THRESHOLD = 245;

  let minX = W;
  let minY = H;
  let maxX = 0;
  let maxY = 0;

  let hasStroke = false;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;

      const r = originalPixels[idx];
      const g = originalPixels[idx + 1];
      const b = originalPixels[idx + 2];

      const gray =
        0.299 * r +
        0.587 * g +
        0.114 * b;

      // pixel tối => stroke
      if (gray < THRESHOLD) {
        hasStroke = true;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;

        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // =====================================================
  // 4. Empty canvas
  // =====================================================

  if (!hasStroke) {
    //console.warn('Canvas trống');

    return new Float32Array(64 * 64);
  }

  // =====================================================
  // 5. Add padding
  // =====================================================

  const strokeW = maxX - minX + 1;
  const strokeH = maxY - minY + 1;

  const pad = Math.max(
    20,
    Math.round(Math.max(strokeW, strokeH) * 0.15)
  );

  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);

  const cropW = Math.min(
    W - cropX,
    strokeW + pad * 2
  );

  const cropH = Math.min(
    H - cropY,
    strokeH + pad * 2
  );

  // console.log(
  //   `[Tensor] bbox: (${minX},${minY}) -> (${maxX},${maxY})`
  // );

  // console.log(
  //   `[Tensor] crop: (${cropX},${cropY}) ${cropW}x${cropH}`
  // );

  // =====================================================
  // 6. Create square canvas
  // =====================================================

  const squareSize = Math.max(cropW, cropH);

  const squareSurface =
    Skia.Surface.Make(squareSize, squareSize);

  if (!squareSurface) {
    throw new Error('Không thể tạo square surface');
  }

  const squareCanvas = squareSurface.getCanvas();

  // background trắng
  squareCanvas.drawColor(Skia.Color('#FFFFFF'));

  // Center content
  const offsetX = (squareSize - cropW) / 2;
  const offsetY = (squareSize - cropH) / 2;

  // Source rect
  const src = Skia.XYWHRect(
    cropX,
    cropY,
    cropW,
    cropH
  );

  // Destination rect centered
  const dest = Skia.XYWHRect(
    offsetX,
    offsetY,
    cropW,
    cropH
  );

  // Draw crop centered vào square canvas
  squareCanvas.drawImageRect(
    originalSnapshot,
    src,
    dest,
    Skia.Paint()
  );

  const squareImage =
    squareSurface.makeImageSnapshot();

  // =====================================================
  // 7. Resize về 64x64
  // =====================================================

  const MODEL_SIZE = 64;

  const finalSurface =
    Skia.Surface.Make(MODEL_SIZE, MODEL_SIZE);

  if (!finalSurface) {
    throw new Error('Không thể tạo final surface');
  }

  const finalCanvas = finalSurface.getCanvas();

  finalCanvas.drawColor(Skia.Color('#FFFFFF'));

  finalCanvas.drawImageRect(
    squareImage,
    Skia.XYWHRect(
      0,
      0,
      squareSize,
      squareSize
    ),
    Skia.XYWHRect(
      0,
      0,
      MODEL_SIZE,
      MODEL_SIZE
    ),
    Skia.Paint()
  );

  const finalImage =
    finalSurface.makeImageSnapshot();

  // =====================================================
  // 8. Read final pixels
  // =====================================================

  const finalPixels = finalImage.readPixels(0, 0, {
    width: MODEL_SIZE,
    height: MODEL_SIZE,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  });

  if (!finalPixels) {
    throw new Error('Không thể đọc final pixels');
  }

  // =====================================================
  // 9. Convert -> tensor
  // =====================================================

  const tensor = new Float32Array(
    MODEL_SIZE * MODEL_SIZE
  );

  for (let i = 0; i < MODEL_SIZE * MODEL_SIZE; i++) {
    const idx = i * 4;

    const r = finalPixels[idx];
    const g = finalPixels[idx + 1];
    const b = finalPixels[idx + 2];

    const gray =
      0.299 * r +
      0.587 * g +
      0.114 * b;

    // invert:
    // white -> 0
    // black -> 1
    tensor[i] = 1.0 - gray / 255.0;
  }

  // =====================================================
  // 10. Debug image
  // =====================================================

  //await saveDebugImage(tensor);

  return tensor;
}

/**
 * Save tensor image ra Gallery để debug
 */
async function saveDebugImage(
  tensor: Float32Array
): Promise<void> {
  const size = 64;

  const surface = Skia.Surface.Make(size, size);

  if (!surface) return;

  const canvas = surface.getCanvas();

  for (let i = 0; i < size * size; i++) {
    const x = i % size;
    const y = Math.floor(i / size);

    // invert lại để nhìn đúng:
    // tensor=1 => black stroke
    // tensor=0 => white bg

    const brightness = Math.round(
      (tensor[i]) * 255
    );

    const hex = brightness
      .toString(16)
      .padStart(2, '0');

    const color = `#${hex}${hex}${hex}FF`;

    const paint = Skia.Paint();

    paint.setColor(Skia.Color(color));

    canvas.drawRect(
      Skia.XYWHRect(x, y, 1, 1),
      paint
    );
  }

  const image = surface.makeImageSnapshot();

  const pngBytes = image.encodeToBytes();

  const binary = Array.from(pngBytes)
    .map((b) => String.fromCharCode(b))
    .join('');

  const base64Png = btoa(binary);

  const path =
    documentDirectory + `debug_tensor_${Date.now()}.png`;

  await writeAsStringAsync(path, base64Png, {
    encoding: 'base64',
  });

  const { status } =
    await MediaLibrary.requestPermissionsAsync();

  if (status === 'granted') {
    await MediaLibrary.saveToLibraryAsync(path);

    console.log(
      '✅ Debug tensor image saved'
    );
  }
}