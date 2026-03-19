import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { PrismaClient } from "@prisma/client"
import { v2 as cloudinary } from "cloudinary"

const prisma = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function parseSafeDate(dateStr: string, fallbackAddYears: number = 0) {
  const parsedDate = new Date(dateStr)
  if (isNaN(parsedDate.getTime())) {
    const fallbackDate = new Date()
    fallbackDate.setFullYear(fallbackDate.getFullYear() + fallbackAddYears)
    return fallbackDate
  }
  return parsedDate
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Truy cập bị từ chối" }, { status: 401 })
    }

    const body = await req.json()
    const { filename, content, mimeType } = body

    if (!content || mimeType !== "application/pdf") {
      return NextResponse.json({ error: "Định dạng file không hợp lệ" }, { status: 400 })
    }

    // 1. Upload file lên Cloudinary
    const base64Data = `data:application/pdf;base64,${content}`
    const uploadResponse = await cloudinary.uploader.upload(base64Data, {
      resource_type: "auto",
      folder: "agent_contracts",
      public_id: filename.replace(/\.pdf$/i, `_${Date.now()}`),
    })
    const fileUrl = uploadResponse.secure_url

    // 2. Trích xuất dữ liệu bằng AI
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    const prompt = `Bạn là hệ thống AI phân tích hợp đồng ngân hàng. Đọc file hợp đồng đính kèm và trích xuất các thông tin sau bằng định dạng JSON:
    - "partner_name": Tên đối tác (Bên B)
    - "contract_value": Giá trị hợp đồng (trả về kiểu số thực float, ví dụ 500000000). Nếu không có trả về 0.
    - "sign_date": Ngày ký hoặc ngày hiệu lực (định dạng YYYY-MM-DD). Nếu không có, bỏ trống.
    - "expiry_date": Ngày hết hạn (định dạng YYYY-MM-DD). Nếu không có, bỏ trống.
    - "priority_level": Mức độ ưu tiên ("Cao", "Trung bình", hoặc "Thấp").
    - "summary": Tóm tắt ngắn gọn nội dung hợp đồng (khoảng 2-3 câu).
    - "renewal_terms": Điều khoản gia hạn (nếu có, không thì bỏ trống).
    Chỉ trả về chuỗi JSON hợp lệ, không chứa markdown và không giải thích.`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: content,
          mimeType: "application/pdf"
        }
      }
    ])

    const responseText = result.response.text()
    const cleanedJson = responseText.replace(/```json\n?|```/g, "").trim()
    const contractData = JSON.parse(cleanedJson)

    // 3. Lưu vào cơ sở dữ liệu với trạng thái "Chờ duyệt"
    const newContract = await prisma.contract.create({
      data: {
        partner_name: contractData.partner_name || "Chưa xác định",
        contract_value: Number(contractData.contract_value) || 0,
        sign_date: parseSafeDate(contractData.sign_date, 0),
        expiry_date: parseSafeDate(contractData.expiry_date, 1),
        priority_level: contractData.priority_level || "Trung bình",
        status: "Chờ duyệt",
        summary: contractData.summary || "",
        renewal_terms: contractData.renewal_terms || "",
        file_url: fileUrl,
      }
    })

    return NextResponse.json({ success: true, contract: newContract })

  } catch (error) {
    console.error("Lỗi Webhook:", error)
    return NextResponse.json({ error: "Lỗi máy chủ xử lý" }, { status: 500 })
  }
}