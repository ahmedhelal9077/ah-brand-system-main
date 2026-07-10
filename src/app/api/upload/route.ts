import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'xlgpboze';
const apiKey = process.env.CLOUDINARY_API_KEY || '883246922612925';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'ae3r0fhuMb2cQ2lm2SxsccyQHiQ';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
    }

    // Skip base64 conversion for faster upload
    // The 'file' object is already a Blob/File from Next.js request.formData()


    // Upload to Cloudinary
    const timestamp = Math.round((new Date()).getTime() / 1000);
    const signatureString = `timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', timestamp.toString());
    cloudinaryFormData.append('signature', signature);

    const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: cloudinaryFormData
    });

    const result = await cloudinaryResponse.json();

    if (!result.secure_url) {
      throw new Error(result.error?.message || "Cloudinary upload failed");
    }
    
    return NextResponse.json({ success: true, imageUrl: result.secure_url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, message: "Upload failed" }, { status: 500 });
  }
}
