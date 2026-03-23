import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: Request) {
  // 1. Kiểm tra xác thực từ Vercel (bảo mật endpoint)
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Truy cập bị từ chối" }, { status: 401 })
  }

  try {
    // 2. Thiết lập mốc thời gian: Từ hôm nay đến 30 ngày sau
    const today = new Date()
    const next30Days = new Date()
    next30Days.setDate(today.getDate() + 30)

    // 3. Truy vấn cơ sở dữ liệu
    const expiringContracts = await prisma.contract.findMany({
      where: {
        status: "Đang hoạt động", // Chỉ quét các hợp đồng đang hiệu lực
        expiry_date: {
          gte: today,       // Lớn hơn hoặc bằng hôm nay
          lte: next30Days,  // Nhỏ hơn hoặc bằng 30 ngày tới
        },
      },
      select: {
        id: true,
        partner_name: true,
        expiry_date: true,
        contract_value: true,
      }
    })

    // 4. Xử lý kết quả (Tạm thời ghi log, sau này sẽ chèn hàm gửi email ở đây)
    console.log(`[CRON JOB] Tìm thấy ${expiringContracts.length} hợp đồng sắp hết hạn trong 30 ngày tới.`)
    
    if (expiringContracts.length > 0) {
      expiringContracts.forEach(c => {
        console.log(`- Cảnh báo: Đối tác ${c.partner_name} hết hạn vào ${c.expiry_date.toISOString().split('T')[0]}`)
      })
    }

    return NextResponse.json({ success: true, count: expiringContracts.length, data: expiringContracts })

  } catch (error) {
    console.error("Lỗi chạy Cron Job:", error)
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 })
  }
}