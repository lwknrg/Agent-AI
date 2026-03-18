import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { PrismaClient } from "@prisma/client"

// Khởi tạo kết nối DB và AI
const prisma = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)

export async function POST(req: Request) {
  try {
    // 1. Kiểm tra xác thực Webhook
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Truy cập bị từ chối" }, { status: 401 })
    }

    // 2. Nhận dữ liệu
    const body = await req.json()
    const { filename, content, mimeType } = body

    if (!content || mimeType !== "application/pdf") {
      return NextResponse.json({ error: "Định dạng file không hợp lệ" }, { status: 400 })
    }

    // 3. Gọi Gemini API phân tích PDF (Base64)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const prompt = `Bạn là hệ thống trích xuất dữ liệu ngân hàng. Đọc file hợp đồng đính kèm và trích xuất các thông tin sau:
    1. contractNumber (Số hợp đồng)
    2. companyName (Tên đối tác/Bên B)
    3. value (Giá trị hợp đồng, chỉ lấy con số nguyên)
    4. startDate (Ngày hiệu lực, định dạng YYYY-MM-DD)
    5. endDate (Ngày hết hạn, định dạng YYYY-MM-DD)
    
    Chỉ trả về định dạng JSON chuẩn xác, không có markdown (như \`\`\`json) và không có văn bản giải thích nào khác.`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: content,
          mimeType: "application/pdf"
        }
      }
    ])

    // 4. Xử lý dữ liệu trả về
    const responseText = result.response.text()
    const cleanedJson = responseText.replace(/```json\n?|```/g, "").trim()
    const contractData = JSON.parse(cleanedJson)

    // 5. Lưu vào cơ sở dữ liệu Neon qua Prisma
    const newContract = await prisma.contract.create({
      data: {
        contractNumber: contractData.contractNumber || "Chưa xác định",
        companyName: contractData.companyName || "Chưa xác định",
        value: Number(contractData.value) || 0,
        startDate: new Date(contractData.startDate),
        endDate: new Date(contractData.endDate),
        status: "ACTIVE", // Mặc định trạng thái khi mới thêm
      }
    })

    console.log(`Đã trích xuất và lưu thành công: ${filename}`)
    return NextResponse.json({ success: true, contract: newContract })

  } catch (error) {
    console.error("Lỗi Webhook:", error)
    return NextResponse.json({ error: "Lỗi máy chủ xử lý" }, { status: 500 })
  }
}