export async function encryptAttachment(
  file: File,
  passphrase: string,
): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const b64 = btoa(String.fromCharCode(...bytes));
  const { encryptMessage } = await import("./crypto");
  return encryptMessage(
    JSON.stringify({
      name: file.name,
      mime: file.type,
      data: b64,
    }),
    passphrase,
  );
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export function isVideoFile(file: File): boolean {
  return VIDEO_TYPES.includes(file.type) || /\.(mp4|webm|mov)$/i.test(file.name);
}

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
