import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    // 1. Kiểm tra bảo mật
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Truy cập bị từ chối" }, { status: 401 })
    }

    // 2. Nhận dữ liệu từ Google Script
    const body = await req.json()
    const { filename, content, mimeType } = body

    if (!content || mimeType !== "application/pdf") {
      return NextResponse.json({ error: "Định dạng file không hợp lệ" }, { status: 400 })
    }

    // 3. Chuyển đổi dữ liệu Base64 thành Buffer để xử lý
    const fileBuffer = Buffer.from(content, "base64")

    // TO-DO: Tại đây, bạn sẽ gọi hàm AI Gemini để đọc fileBuffer
    // và dùng Prisma để lưu vào cơ sở dữ liệu Neon.
    // (Phần này sẽ ráp logic AI bạn đang có sẵn vào sau).

    console.log(`Đã nhận file: ${filename}`)

    return NextResponse.json({ success: true, message: "Đã xử lý hợp đồng thành công" })
  } catch (error) {
    console.error("Lỗi Webhook:", error)
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 })
  }
}