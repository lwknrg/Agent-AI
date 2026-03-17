import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { subject, htmlContent } = body

    if (!subject || !htmlContent) {
      return NextResponse.json({ error: "Thiếu tiêu đề hoặc nội dung email" }, { status: 400 })
    }

    const data = await resend.emails.send({
      from: "Contract Agent <onboarding@resend.dev>",
      to: [process.env.MY_PERSONAL_EMAIL as string],
      subject: subject,
      html: htmlContent,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Lỗi gửi email:", error)
    return NextResponse.json({ error: "Không thể gửi email" }, { status: 500 })
  }
}