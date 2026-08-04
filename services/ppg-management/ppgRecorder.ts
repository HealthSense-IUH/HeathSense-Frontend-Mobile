import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { HealthRecordResponse } from "@/types/response";
import { useBleStore } from "@/services/ble-management/bleStore";

export type PpgSample = {
  deviceMillis: number | null;
  red: number;
  ir: number;
  bpm?: number | null;
  spo2?: number | null;
};

export type PpgRecordingResult = {
  uri: string;
  fileName: string;
  sampleCount: number;
};

const CSV_HEADER = "Time(ms),Red,IR,Bpm,SpO2";

const pad = (value: number) => value.toString().padStart(2, "0");

const buildTimestampFileName = (date: Date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());

  return `healthsense-ppg-${year}${month}${day}-${hour}${minute}${second}.csv`;
};

class PpgRecorder {
  private rows: string[] = [];
  private sampleIndex = 0;

  /**
   * Khoảng cách giữa 2 mẫu PPG (ms). Thiết bị lấy mẫu mỗi ~10ms = 100Hz.
   */
  private static readonly SAMPLE_INTERVAL_MS = 10;

  /**
   * Số mẫu tối thiểu cho 1 phút đo Pha 1 hợp lệ (~45 giây = 4500 mẫu ở 100Hz).
   * Nếu ít hơn 4500 mẫu (do bị ngắt bởi chuyển động/tháo thiết bị), phiên ghi sẽ bị hủy.
   */
  private static readonly MIN_VALID_SAMPLES = 4500;

  start() {
    const now = Date.now();

    this.rows = [];
    this.sampleIndex = 0;

    useBleStore.getState().setRecordingState({
      isRecordingPpg: true,
      isExportingRecording: false,
      recordingStartedAt: now,
      recordingSampleCount: 0,
      lastRecordingFileUri: null,
      lastRecordingFileName: null,
      recordingError: null,
    });
  }

  appendSamples(samples: PpgSample[]) {
    const store = useBleStore.getState();

    if (!store.isRecordingPpg || samples.length === 0) {
      return;
    }

    samples.forEach((sample) => {
      // Lọc bỏ mẫu rác / giai đoạn cảm biến chưa ổn định (AGC warm-up hoặc tháo thiết bị)
      if (!sample.red || !sample.ir || sample.red < 10000 || sample.ir < 30000 || sample.red > 250000 || sample.ir > 250000) {
        return;
      }

      // Timestamp tương đối liên tục: 0, 10, 20, 30, ... (ms)
      const normalizedTimestamp = this.sampleIndex * PpgRecorder.SAMPLE_INTERVAL_MS;

      this.rows.push(
        [
          normalizedTimestamp,
          sample.red,
          sample.ir,
          sample.bpm ?? "",
          sample.spo2 ?? "",
        ].join(","),
      );
      this.sampleIndex += 1;
    });

    store.setRecordingState({
      recordingSampleCount: this.sampleIndex,
    });
  }

  /**
   * Hủy phiên ghi PPG hiện tại mà không tạo file CSV hay upload S3
   */
  cancelRecording(reason?: string) {
    const store = useBleStore.getState();

    this.rows = [];
    this.sampleIndex = 0;

    store.setRecordingState({
      isRecordingPpg: false,
      isExportingRecording: false,
      recordingStartedAt: null,
      recordingSampleCount: 0,
      lastRecordingFileUri: null,
      lastRecordingFileName: null,
      recordingError: reason || "Đã hủy phiên ghi PPG.",
    });

    console.log("[PpgRecorder] Hủy phiên ghi PPG:", reason);
  }

  /**
   * Đóng gói dữ liệu PPG và lưu file CSV âm thầm vào bộ nhớ máy (mặc định không mở popup Share của Hệ điều hành)
   */
  async stopAndExport(options?: { enableSharing?: boolean }): Promise<PpgRecordingResult> {
    const store = useBleStore.getState();

    if (!store.isRecordingPpg) {
      throw new Error("Chưa có phiên ghi dữ liệu PPG đang chạy.");
    }

    // Kiểm tra đủ số lượng mẫu cho 1 phút đo Pha 1 hợp lệ
    if (this.sampleIndex < PpgRecorder.MIN_VALID_SAMPLES) {
      const msg = `Dữ liệu không đủ 1 phút (${this.sampleIndex}/${PpgRecorder.MIN_VALID_SAMPLES} mẫu). Hủy xuất file.`;
      this.cancelRecording(msg);
      throw new Error(msg);
    }

    store.setRecordingState({
      isExportingRecording: true,
      recordingError: null,
    });

    const fileName = buildTimestampFileName(new Date());

    try {
      const directory = new Directory(Paths.document, "huywatch-recordings");
      directory.create({ idempotent: true, intermediates: true });

      const file = new File(directory, fileName);
      file.create({ overwrite: true, intermediates: true });
      file.write([CSV_HEADER, ...this.rows].join("\n") + "\n");

      // Chỉ mở Popup Share nếu người dùng bật tùy chọn enableSharing = true
      if (options?.enableSharing) {
        const canShare = await Sharing.isAvailableAsync().catch(() => false);
        if (canShare) {
          await Sharing.shareAsync(file.uri, {
            mimeType: "text/csv",
            UTI: "public.comma-separated-values-text",
            dialogTitle: "Xuất dữ liệu PPG CSV",
          }).catch(() => undefined);
        }
      }

      const result = {
        uri: file.uri,
        fileName,
        sampleCount: this.sampleIndex,
      };

      store.setRecordingState({
        isRecordingPpg: false,
        isExportingRecording: false,
        lastRecordingFileUri: result.uri,
        lastRecordingFileName: result.fileName,
        recordingError: null,
      });

      this.rows = [];
      this.sampleIndex = 0;

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể xuất file CSV.";

      store.setRecordingState({
        isRecordingPpg: false,
        isExportingRecording: false,
        recordingError: message,
      });

      throw error;
    }
  }

  async stopExportAndUpload(): Promise<{ recording: PpgRecordingResult; record?: HealthRecordResponse }> {
    const store = useBleStore.getState();
    // Xuất file CSV âm thầm (enableSharing = false)
    const recording = await this.stopAndExport({ enableSharing: false });
    let record: HealthRecordResponse | undefined;

    try {
      store.setRecordingState({ isAnalyzing: true, recordingError: null });
      // Dynamic import ppgApi để tránh phụ thuộc vòng
      const { uploadPpgRecord } = await import("./ppgApi");
      record = await uploadPpgRecord(recording);
      console.log("[PpgRecorder] Upload & Confirm thành công, Record ID:", record?.id);
      
      store.setRecordingState({
        isAnalyzing: false,
        aiAnalysisResult: record
      });
    } catch (err) {
      console.error("[PpgRecorder] Lỗi khi upload PPG record lên Backend/S3:", err);
      store.setRecordingState({
        isAnalyzing: false,
        recordingError: err instanceof Error ? err.message : "Lỗi phân tích AI"
      });
    }

    return { recording, record };
  }
}

export const ppgRecorder = new PpgRecorder();
