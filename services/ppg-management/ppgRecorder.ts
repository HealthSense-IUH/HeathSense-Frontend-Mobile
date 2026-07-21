import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useBleStore } from "../ble-management/bleStore";

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

const CSV_HEADER = "device_millis,red,ir,bpm,spo2";

const pad = (value: number) => value.toString().padStart(2, "0");

const buildTimestampFileName = (date: Date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());

  return `huywatch-ppg-${year}${month}${day}-${hour}${minute}${second}.csv`;
};

class PpgRecorder {
  private rows: string[] = [];
  private sampleIndex = 0;

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
      this.rows.push(
        [
          sample.deviceMillis ?? "",
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

  async stopAndExport(): Promise<PpgRecordingResult> {
    const store = useBleStore.getState();

    if (!store.isRecordingPpg) {
      throw new Error("Chưa có phiên ghi dữ liệu PPG đang chạy.");
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

      const canShare = await Sharing.isAvailableAsync().catch(() => false);

      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          UTI: "public.comma-separated-values-text",
          dialogTitle: "Xuất dữ liệu PPG CSV",
        }).catch(() => undefined);
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
}

export const ppgRecorder = new PpgRecorder();
