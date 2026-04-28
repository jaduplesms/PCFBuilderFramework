import type { HarnessStore } from '../store/harness-store';

interface PickedFile {
  fileContent: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

/** Open a transient file input, await selection, and return the selected files. */
function openPicker(options: {
  accept?: string;
  capture?: 'user' | 'environment';
  multiple?: boolean;
}): Promise<File[]> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    if (options.accept) input.accept = options.accept;
    if (options.capture) input.setAttribute('capture', options.capture);
    if (options.multiple) input.multiple = true;
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    let resolved = false;
    const finish = (files: File[]) => {
      if (resolved) return;
      resolved = true;
      input.remove();
      resolve(files);
    };
    input.addEventListener('change', () => finish(input.files ? Array.from(input.files) : []));
    // Resolve with empty list if the dialog is dismissed (best-effort via window focus).
    window.addEventListener('focus', () => setTimeout(() => finish([]), 500), { once: true });
    document.body.appendChild(input);
    input.click();
  });
}

async function fileToPicked(file: File): Promise<PickedFile> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return {
    fileContent: btoa(binary),
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}

export function createDeviceShim(getState: () => HarnessStore) {
  const log = (method: string, args?: any) =>
    getState().addLogEntry({ category: 'device', method, args });

  return {
    async captureAudio(): Promise<PickedFile | null> {
      log('captureAudio');
      const [file] = await openPicker({ accept: 'audio/*', capture: 'user' });
      return file ? fileToPicked(file) : null;
    },
    async captureImage(options?: any): Promise<PickedFile | null> {
      log('captureImage', options);
      const [file] = await openPicker({ accept: 'image/*', capture: 'environment' });
      return file ? fileToPicked(file) : null;
    },
    async captureVideo(): Promise<PickedFile | null> {
      log('captureVideo');
      const [file] = await openPicker({ accept: 'video/*', capture: 'environment' });
      return file ? fileToPicked(file) : null;
    },
    getBarcodeValue(): Promise<string> {
      log('getBarcodeValue');
      return Promise.resolve('MOCK-BARCODE-12345');
    },
    getCurrentPosition(): Promise<any> {
      log('getCurrentPosition');
      return new Promise(resolve => {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            pos => resolve({
              coords: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
              },
              timestamp: pos.timestamp,
            }),
            () => resolve({
              coords: { latitude: 51.5074, longitude: -0.1278, accuracy: 10 },
              timestamp: Date.now(),
            }),
            { timeout: 5000 },
          );
        } else {
          resolve({
            coords: { latitude: 51.5074, longitude: -0.1278, accuracy: 10 },
            timestamp: Date.now(),
          });
        }
      });
    },
    async pickFile(options?: any): Promise<PickedFile[]> {
      log('pickFile', options);
      const accept = options?.accept;
      const acceptHeader = Array.isArray(accept) ? accept.join(',') : accept;
      const files = await openPicker({
        accept: acceptHeader,
        multiple: options?.maximumAllowedFileSize !== 1 && options?.allowMultipleFiles !== false,
      });
      return Promise.all(files.map(fileToPicked));
    },
  };
}
