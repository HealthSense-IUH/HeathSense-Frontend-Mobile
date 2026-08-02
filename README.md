# HealthSense Frontend Mobile

## Tiếng Việt

**HealthSense Frontend Mobile** là ứng dụng di động theo dõi sức khỏe cá nhân trong hệ sinh thái HealthSense, được xây dựng bằng React Native, Expo SDK 57, Expo Router, Gluestack UI v5 và NativeWind v5. Ứng dụng kết nối với đồng hồ đeo tay HuyWatch qua Bluetooth Low Energy (BLE) để đo nhịp tim (BPM), nồng độ oxy trong máu (SpO2) và thu thập tín hiệu sóng PPG theo thời gian thực.

### Chức năng chính
- **Kết nối BLE tự động:** Tự động phát hiện, ghép đôi và tự động khôi phục kết nối với thiết bị đeo HuyWatch qua BLE.
- **Theo dõi chỉ số thời gian thực:** Thu thập và hiển thị các chỉ số nhịp tim (BPM), nồng độ oxy trong máu (SpO2), số bước chân và calo tiêu thụ.
- **Ghi & Export dữ liệu PPG:** Ghi lại chuỗi dữ liệu tín hiệu PPG tần số cao và xuất file dữ liệu đẩy lên hệ thống phân tích.
- **Xác thực người dùng:** Đăng nhập, đăng ký và quản lý phiên làm việc bảo mật (SecureStore token & session management).
- **Giao diện hiện đại:** Thiết kế giao diện cao cấp với chế độ sáng/tối (Light/Dark mode), hoạt họa mượt mà và hỗ trợ đa nền tảng (Android, iOS).

### Công nghệ
- **Framework:** Expo SDK 57, React Native 0.86, React 19
- **Routing:** Expo Router (File-based Routing)
- **UI Component System:** Gluestack UI v5
- **Styling:** NativeWind v5 với Tailwind CSS v4 tokens
- **State Management:** Zustand
- **Kết nối BLE:** `react-native-ble-manager`
- **Thông báo & Background Service:** Notifee (`@notifee/react-native`)
- **Lưu trữ bảo mật:** Expo SecureStore, MMKV (`react-native-mmkv`)
- **Ngôn ngữ:** TypeScript

### Cấu trúc dự án
- `src/app/`: Định nghĩa các màn hình và tuyến đường (Routes) của ứng dụng bằng Expo Router (`(public)`, `(tabs)`, `_layout.tsx`).
- `src/components/`: Chứa các component giao diện UI (`ui/`) và component tính năng (`features/`).
- `src/context/`: Context quản lý kết nối và trạng thái dữ liệu BLE (`BLEContext.tsx`).
- `services/`: Động cơ xử lý dịch vụ chính:
  - `ble-management/`: Dịch vụ điều khiển kết nối BLE, tự động kết nối lại và lưu trữ thiết bị đã ghép đôi.
  - `ppg-management/`: Dịch vụ thu âm, xử lý và xuất dữ liệu PPG.
  - `authentication/`: Quản lý store xác thực và API Auth.
  - `notifee-management/`: Quản lý thông báo chạy ngầm Foreground Service.
- `types/`: Khai báo kiểu dữ liệu TypeScript (DTO, Request/Response, Authentication, PPG).
- `utils/`: Các tiện ích kiểm tra quyền Android/iOS runtime (`blePermissions.ts`), Axios Client (`axiosClient.ts`).

### Cài đặt và Sử dụng
1. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
2. Khởi động Development Server:
   ```bash
   npm run start
   ```
3. Xóa cache Metro khi thay đổi cấu hình Babel, Metro hoặc Tailwind:
   ```bash
   npx expo start -c
   ```
4. Chạy trên thiết bị hoặc máy ảo:
   ```bash
   npm run android
   npm run ios
   npm run web
   ```

---

## English

**HealthSense Frontend Mobile** is the mobile health tracking app for the HealthSense ecosystem, built with React Native, Expo SDK 57, Expo Router, Gluestack UI v5, and NativeWind v5. The app connects to the HuyWatch wearable device via Bluetooth Low Energy (BLE) to monitor heart rate (BPM), blood oxygen saturation (SpO2), and record real-time PPG signal data.

### Key Features
- **Automatic BLE Connectivity:** Automatic detection, pairing, and background reconnection with the HuyWatch wearable device.
- **Real-Time Health Monitoring:** Displays live heart rate (BPM), blood oxygen saturation (SpO2), step count, and calorie burn.
- **PPG Recording & Export:** Records high-frequency PPG sensor signal streams and exports/uploads data for AI analysis.
- **User Authentication:** Secure login, registration, and session management using Expo SecureStore and token refresh logic.
- **Modern UI & UX:** Premium dark/light mode support, smooth animations, and cross-platform compatibility (Android & iOS).

### Tech Stack
- **Framework:** Expo SDK 57, React Native 0.86, React 19
- **Routing:** Expo Router (File-based Routing)
- **UI Components:** Gluestack UI v5
- **Styling:** NativeWind v5 with Tailwind CSS v4 tokens
- **State Management:** Zustand
- **BLE Connectivity:** `react-native-ble-manager`
- **Background & Notifications:** Notifee (`@notifee/react-native`)
- **Secure Storage:** Expo SecureStore, MMKV (`react-native-mmkv`)
- **Language:** TypeScript

### Project Structure
- `src/app/`: Screen definitions and routes via Expo Router (`(public)`, `(tabs)`, `_layout.tsx`).
- `src/components/`: Design system components (`ui/`) and feature-specific views (`features/`).
- `src/context/`: Context provider for BLE state management (`BLEContext.tsx`).
- `services/`: Core application services:
  - `ble-management/`: Service for BLE connection lifecycle, auto-reconnection, and device storage.
  - `ppg-management/`: Signal recorder, buffer processor, and PPG file exporter.
  - `authentication/`: Auth Zustand store and API integration.
  - `notifee-management/`: Foreground service notification handler.
- `types/`: TypeScript definitions for DTOs, API requests/responses, auth, and PPG.
- `utils/`: Runtime Android/iOS permission handlers (`blePermissions.ts`), Axios HTTP client (`axiosClient.ts`).

### Installation and Usage
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run start
   ```
3. Start with a clean Metro cache after updating Babel, Metro, or Tailwind config:
   ```bash
   npx expo start -c
   ```
4. Run on a specific platform:
   ```bash
   npm run android
   npm run ios
   npm run web
   ```
