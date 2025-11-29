import sharp from 'sharp';

function parseBase64(input) {
  if (!input) {
    return null;
  }
  const matches = input.match(/^data:(.*);base64,(.*)$/);
  if (matches) {
    return {
      mime: matches[1],
      data: Buffer.from(matches[2], 'base64')
    };
  }
  return {
    mime: 'image/jpeg',
    data: Buffer.from(input, 'base64')
  };
}

export async function compressBase64Image(base64, maxBytes = 1024 * 1024) {
  if (!base64) return null;
  const parsed = parseBase64(base64);
  if (!parsed) return null;

  let { data, mime } = parsed;
  let buffer = Buffer.from(data);
  let quality = 85;
  let width = null;

  while (buffer.length > maxBytes && quality >= 40) {
    const transformer = sharp(data).rotate();
    if (!width) {
      const metadata = await transformer.metadata();
      width = metadata.width && metadata.width > 1024 ? 1024 : metadata.width;
    }
    const pipeline = sharp(data)
      .rotate()
      .resize(width, null, { fit: 'inside', withoutEnlargement: true });

    if (mime === 'image/png') {
      buffer = await pipeline.png({ quality, compressionLevel: 9 }).toBuffer();
    } else {
      buffer = await pipeline.jpeg({ quality }).toBuffer();
      mime = 'image/jpeg';
    }
    quality -= 5;
  }

  if (buffer.length > maxBytes) {
    throw new Error('Unable to compress image below 1MB');
  }
  return `data:${mime};base64,${buffer.toString('base64')}`;
}
