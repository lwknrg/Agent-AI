import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)

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

    // Yêu cầu AI trích xuất đúng với cấu trúc schema.prisma
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    const prompt = `Bạn là hệ thống AI phân tích hợp đồng ngân hàng. Đọc file hợp đồng đính kèm và trích xuất các thông tin sau bằng định dạng JSON:
    - "partner_name": Tên đối tác (Bên B)
    - "contract_value": Giá trị hợp đồng (trả về kiểu số thực float, ví dụ 500000000)
    - "sign_date": Ngày ký hoặc ngày hiệu lực (định dạng YYYY-MM-DD)
    - "expiry_date": Ngày hết hạn (định dạng YYYY-MM-DD)
    - "priority_level": Mức độ ưu tiên ("Cao", "Trung bình", hoặc "Thấp" dựa trên tính chất hợp đồng)
    - "status": Trạng thái (mặc định là "Đang hoạt động")
    - "summary": Tóm tắt ngắn gọn nội dung hợp đồng (khoảng 2-3 câu)
    - "renewal_terms": Điều khoản gia hạn (nếu có, không có thì trả về rỗng)

    Chỉ trả về chuỗi JSON hợp lệ, không chứa markdown (như \`\`\`json) và không giải thích gì thêm.`

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

    // Khớp tuyệt đối với schema.prisma của bạn
    const newContract = await prisma.contract.create({
      data: {
        partner_name: contractData.partner_name || "Chưa xác định",
        contract_value: Number(contractData.contract_value) || 0,
        sign_date: new Date(contractData.sign_date),
        expiry_date: new Date(contractData.expiry_date),
        priority_level: contractData.priority_level || "Trung bình",
        status: contractData.status || "Đang hoạt động",
        summary: contractData.summary || "",
        renewal_terms: contractData.renewal_terms || "",
      }
    })

    console.log(`Đã trích xuất và lưu thành công: ${filename}`)
    return NextResponse.json({ success: true, contract: newContract })

  } catch (error) {
    console.error("Lỗi Webhook:", error)
    return NextResponse.json({ error: "Lỗi máy chủ xử lý" }, { status: 500 })
  }
}