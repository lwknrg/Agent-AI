import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "Không tìm thấy tệp" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Tạo đường dẫn cứng chứa thư mục và đuôi .pdf
    const filePath = `contracts/contract_${Date.now()}.pdf`

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          resource_type: "raw", // Bắt buộc dùng raw cho tài liệu nguyên bản
          public_id: filePath,  // Gắn thẳng đường dẫn và tên file có đuôi .pdf
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    }) as any

    return NextResponse.json({ file_url: uploadResult.secure_url })
    
  } catch (error) {
    console.error("Lỗi upload Cloudinary:", error)
    return NextResponse.json({ error: "Lỗi tải tệp lên hệ thống lưu trữ" }, { status: 500 })
  }
}