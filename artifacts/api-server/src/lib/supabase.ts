import { createClient } from "@supabase/supabase-js";
import { logger } from "./logger.js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.warn(
    "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured — " +
      "file storage will fall back to inline base64"
  );
}

export const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

const BUCKETS = [
  { name: "property-images", fileSizeLimit: 10 * 1024 * 1024 },
  { name: "avatars", fileSizeLimit: 5 * 1024 * 1024 },
];

/** Create storage buckets if they don't already exist (idempotent). */
export async function initStorage() {
  if (!supabase) return;
  for (const { name, fileSizeLimit } of BUCKETS) {
    const { data } = await supabase.storage.getBucket(name);
    if (!data) {
      const { error } = await supabase.storage.createBucket(name, {
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        fileSizeLimit,
      });
      if (error) {
        logger.warn({ bucket: name, error }, "Could not create storage bucket");
      } else {
        logger.info({ bucket: name }, "Storage bucket created");
      }
    }
  }
}
