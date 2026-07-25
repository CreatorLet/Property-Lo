import { supabase } from "./supabase.js";
import { logger } from "./logger.js";

/**
 * Upload a base64-encoded image to Supabase Storage and return its public URL.
 * If Supabase is not configured or the upload fails, returns the original string.
 */
export async function uploadBase64(
  base64: string,
  bucket: string,
  storagePath: string
): Promise<string> {
  if (!supabase || !base64.startsWith("data:")) return base64;

  const match = base64.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return base64;

  const [, mimeType, data] = match;
  const ext = (mimeType.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
  const fullPath = `${storagePath}.${ext}`;
  const buffer = Buffer.from(data, "base64");

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fullPath, buffer, { contentType: mimeType, upsert: true });

  if (error) {
    logger.warn({ error, bucket, fullPath }, "Storage upload failed — keeping base64");
    return base64;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(fullPath);

  return publicUrl;
}

/**
 * Process a list of images: base64 strings get uploaded to Supabase Storage.
 * URLs are passed through unchanged.
 */
export async function processImages(
  images: string[],
  listingId: string
): Promise<string[]> {
  if (!images || images.length === 0) return [];
  return Promise.all(
    images.map((img, i) =>
      img.startsWith("data:")
        ? uploadBase64(img, "property-images", `listings/${listingId}/${i}`)
        : img
    )
  );
}
