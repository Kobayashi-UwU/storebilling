import imageCompression from 'browser-image-compression';

export async function compressFile(file: File, maxSizeMB = 1): Promise<File> {
  const options = {
    maxSizeMB,
    maxWidthOrHeight: 1024,
    useWebWorker: true
  };
  return imageCompression(file, options);
}

export async function fileToBase64(file: File): Promise<string> {
  const compressed = await compressFile(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(compressed);
  });
}
