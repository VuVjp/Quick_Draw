# Quick Draw

Ứng dụng vẽ và đoán hình theo thời gian thực, xây dựng bằng Expo, React Native,
Firebase và TensorFlow Lite.

## Yêu cầu

- Node.js LTS và npm
- Android Studio, Android SDK và một Android Emulator **hoặc** thiết bị Android
- JDK tương thích với phiên bản React Native/Expo đang sử dụng
- Tài khoản Firebase nếu cần đăng nhập, chơi nhiều người hoặc lưu dữ liệu

Các thư viện native như React Native Skia, Firebase và TensorFlow Lite yêu cầu
development build. Expo Go có thể không chạy đầy đủ ứng dụng này.

## Clone và cài đặt

```bash
git clone https://github.com/VuVjp/Quick_Draw.git
cd Quick_Draw
npm install
```

## Cấu hình Firebase

1. Tạo hoặc chọn một project trên [Firebase Console](https://console.firebase.google.com/).
2. Bật các dịch vụ cần thiết:
   - Authentication: Anonymous và Google (nếu sử dụng đăng nhập Google).
   - Cloud Firestore.
3. Tải file cấu hình Android `google-services.json`.
4. Đặt file vào thư mục gốc của dự án:

   ```text
   Quick_Draw/google-services.json
   ```

File này đã được thêm vào `.gitignore`, không commit file cấu hình riêng của
Firebase lên repository. Khi build bằng EAS, có thể truyền đường dẫn file qua
biến môi trường `GOOGLE_SERVICES_JSON`.

## Khởi chạy trên Android

Khởi động Metro Bundler:

```bash
npx expo start --dev-client
```

Hoặc build và cài development build trực tiếp lên emulator/thiết bị Android:

```bash
npm run android
```

Nếu dùng thiết bị thật, bật **Developer options** và **USB debugging**, sau đó
kết nối thiết bị trước khi chạy lệnh trên. Có thể dùng phím `a` trong cửa sổ
Expo để mở ứng dụng trên Android Emulator đang chạy.

## Các lệnh thường dùng

| Lệnh | Mục đích |
| --- | --- |
| `npm run start` | Khởi động Expo |
| `npm run android` | Build và chạy development build Android |
| `npm run ios` | Build và chạy trên iOS Simulator (macOS cần Xcode) |
| `npm run web` | Chạy bản web |
| `npm run lint` | Kiểm tra ESLint |

## Cấu trúc chính

- `app/`: màn hình và định tuyến bằng Expo Router.
- `src/hooks/`: logic xác thực, phòng chơi, lượt chơi và Firestore.
- `src/services/`: khởi tạo các dịch vụ dùng chung, bao gồm Firebase.
- `assets/model.tflite`: mô hình nhận diện nét vẽ.

## Xử lý lỗi thường gặp

- **Thiếu `google-services.json`**: đặt đúng file vào thư mục gốc hoặc truyền
  biến `GOOGLE_SERVICES_JSON` khi build.
- **Không đăng nhập được Google**: kiểm tra Google provider đã bật trong Firebase
  và Android app đã được đăng ký đúng package `com.BeHold.Quick_Draw`.
- **Không kết nối được thiết bị**: kiểm tra emulator đã khởi động, hoặc thiết bị
  thật đã bật USB debugging và được Android Studio nhận diện.

## Tài liệu tham khảo

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native Firebase](https://rnfirebase.io/)
