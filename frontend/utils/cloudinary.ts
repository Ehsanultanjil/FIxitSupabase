import Constants from 'expo-constants';

// Configure your Cloudinary credentials
// Prefer putting these in app.json/app.config under expo.extra
// {
//   "expo": {
//     "extra": {
//       "cloudinaryCloudName": "YOUR_CLOUD_NAME",
//       "cloudinaryUploadPreset": "YOUR_UNSIGNED_UPLOAD_PRESET"
//     }
//   }
// }

const CLOUD_NAME = (Constants.expoConfig?.extra as any)?.cloudinaryCloudName || 'duzmkhqaa';
const UPLOAD_PRESET = (Constants.expoConfig?.extra as any)?.cloudinaryUploadPreset || 'fixitdb';

export type CloudinaryUploadResponse = {
  asset_id?: string;
  public_id: string;
  version?: number;
  version_id?: string;
  signature?: string;
  width?: number;
  height?: number;
  format?: string;
  resource_type?: string; // 'image' | 'video' | 'raw'
  created_at?: string;
  bytes?: number;
  type?: string;
  etag?: string;
  url: string;
  secure_url: string;
  original_filename?: string;
  [key: string]: any;
};

function assertConfig() {
  if (!CLOUD_NAME || CLOUD_NAME === 'YOUR_CLOUD_NAME') {
    console.error('Cloudinary CLOUD_NAME is not set. Add expo.extra.cloudinaryCloudName in app.json or edit utils/cloudinary.ts');
    return false;
  }
  if (!UPLOAD_PRESET || UPLOAD_PRESET === 'YOUR_UNSIGNED_UPLOAD_PRESET') {
    console.error('Cloudinary UPLOAD_PRESET is not set. Add expo.extra.cloudinaryUploadPreset in app.json or edit utils/cloudinary.ts');
    return false;
  }
  return true;
}

// Upload an image from a local file URI (e.g., from Expo ImagePicker)
// Returns Cloudinary metadata including secure_url and public_id
export async function uploadImageAsync(uri: string, opts?: { folder?: string; uploadPreset?: string }): Promise<CloudinaryUploadResponse> {
  if (!assertConfig()) {
    throw new Error('Cloudinary credentials not configured');
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;

  const formData = new FormData();
  // react-native FormData expects a file-like object with uri, name, and type
  const file = {
    uri,
    // Fallback name/type; Cloudinary determines type server-side as well
    name: 'upload.jpg',
    type: 'image/jpeg',
  } as any;

  formData.append('file', file as any);
  formData.append('upload_preset', opts?.uploadPreset || UPLOAD_PRESET);
  // Only pass a Cloudinary-safe folder name; avoid accidental absolute paths
  const rawFolder = opts?.folder;
  if (rawFolder) {
    const safe = rawFolder.replace(/\\/g, '/');
    const allowed = /^[A-Za-z0-9_\/-]+$/;
    if (allowed.test(safe) && !safe.includes(':')) {
      formData.append('folder', safe);
    } else {
      console.warn('Skipping unsafe Cloudinary folder value:', rawFolder);
    }
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as CloudinaryUploadResponse;
  return json;
}

// Build a delivery URL using public_id and optional transformation string
// Example: getCloudinaryUrl('samples/cats/mycat', 'w_600,h_400,c_fill,q_auto')
export function getCloudinaryUrl(publicId: string, transformation?: string): string {
  if (!assertConfig()) {
    throw new Error('Cloudinary credentials not configured');
  }
  const base = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/`;
  const tx = transformation ? `${transformation}/` : '';
  return `${base}${tx}${publicId}`;
}

// Convenience helper for common responsive thumbnail
export function thumbnailUrl(publicId: string, size = 200): string {
  return getCloudinaryUrl(publicId, `c_fill,w_${size},h_${size},q_auto,f_auto`);
}

/*
Usage example (Expo ImagePicker):

import * as ImagePicker from 'expo-image-picker';
import { uploadImageAsync, thumbnailUrl } from '../utils/cloudinary';

const pickAndUpload = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
  if (result.canceled) return;
  const uri = result.assets[0].uri;
  const uploaded = await uploadImageAsync(uri, { folder: 'app-uploads' });
  console.log('Secure URL:', uploaded.secure_url);
  console.log('Public ID:', uploaded.public_id);
  const thumb = thumbnailUrl(uploaded.public_id, 300);
  console.log('Thumb URL:', thumb);
};
*/
