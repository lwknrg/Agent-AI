import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY || ""
  
  if (!apiKey) {
    console.error("Lỗi: Không tìm thấy GEMINI_API_KEY trong .env")
    return NextResponse.json({ error: "Thiếu cấu hình API Key" }, { status: 500 })
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    // Sử dụng chính xác tên định danh này
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Không tìm thấy tệp" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ép kiểu mimeType. Nếu Windows/trình duyệt gửi rỗng, mặc định là PDF.
    const mimeType = file.type || "application/pdf"

    const prompt = `Trích xuất thông tin hợp đồng thành MỘT ĐỐI TƯỢNG JSON DUY NHẤT. KHÔNG dùng markdown. KHÔNG giải thích.
    
    Quy tắc phân tích:
    1. priority_level (Mức độ): Nếu trong văn bản ghi rõ thì lấy theo văn bản. Nếu không ghi, tự suy luận: >= 500.000.000 là "Cao", >= 100.000.000 là "Trung bình", còn lại là "Thấp".
    2. status (Trạng thái): Ngày hiện tại hệ thống là 2026-03-15. Nếu expiry_date < 2026-03-15, xuất "Chờ đánh giá". Nếu expiry_date >= 2026-03-15, xuất "Đang hoạt động".
    3. renewal_terms (Điều khoản tái tục): Tìm các câu văn về việc gia hạn, tự động tái tục, hoặc số ngày thông báo trước khi chấm dứt. Nếu không có, xuất "".

    Cấu trúc JSON bắt buộc:
    {
      "partner_name": "Tên đối tác (chuỗi)",
      "contract_value": Giá trị (số nguyên, không chữ),
      "sign_date": "YYYY-MM-DD",
      "expiry_date": "YYYY-MM-DD",
      "priority_level": "Cao" | "Trung bình" | "Thấp",
      "status": "Đang hoạt động" | "Chờ đánh giá",
      "renewal_terms": "Nội dung điều khoản gia hạn hoặc chuỗi rỗng"
    }`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: mimeType,
        },
      },
    ])

    const text = result.response.text()
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim()
    
    try {
      const extractedData = JSON.parse(cleanedText)
      return NextResponse.json(extractedData)
    } catch (parseError) {
      console.error("Lỗi Parse JSON. AI trả về:", text)
      return NextResponse.json({ error: "AI trả về sai định dạng" }, { status: 500 })
    }

  } catch (error) {
    console.error("Lỗi gọi Gemini API:", error)
    return NextResponse.json({ error: "Lỗi kết nối với AI" }, { status: 500 })
  }
}