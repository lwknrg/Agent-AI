import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  try {
    const today = new Date()
    const next30Days = new Date()
    next30Days.setDate(today.getDate() + 30)

    // Lọc hợp đồng đang hoạt động và sắp hết hạn
    const expiringContracts = await prisma.contract.findMany({
      where: {
        status: "Đang hoạt động",
        expiry_date: {
          gte: today,
          lte: next30Days,
        },
      },
    })

    if (expiringContracts.length === 0) {
      return NextResponse.json({ message: "Không có hợp đồng nào sắp hết hạn." })
    }

    // Xây dựng nội dung email
    const listHtml = expiringContracts.map(c => {
      const formattedValue = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(c.contract_value))
      const formattedDate = c.expiry_date.toISOString().split('T')[0]
      return `<li><strong>${c.partner_name}</strong>: Giá trị ${formattedValue} - Hết hạn: ${formattedDate}</li>`
    }).join("")

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #d97706;">Báo cáo tự động từ Agent AI</h2>
        <p>Hệ thống ghi nhận các hợp đồng sau sẽ hết hạn trong vòng 30 ngày tới:</p>
        <ul>${listHtml}</ul>
        <p>Vui lòng truy cập hệ thống Dashboard để đánh giá và lên kế hoạch tái tục.</p>
      </div>
    `

    await resend.emails.send({
      from: "Contract Agent <onboarding@resend.dev>",
      to: [process.env.MY_PERSONAL_EMAIL as string],
      subject: `[Cảnh báo sớm] Có ${expiringContracts.length} hợp đồng sắp hết hạn`,
      html: htmlContent,
    })

    return NextResponse.json({ success: true, count: expiringContracts.length })
  } catch (error) {
    console.error("Lỗi Cron Job:", error)
    return NextResponse.json({ error: "Lỗi thực thi kiểm tra định kỳ" }, { status: 500 })
  }
}