import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Lấy danh sách hợp đồng
export async function GET() {
  try {
    const contracts = await prisma.contract.findMany({
      orderBy: { created_at: "desc" },
    })
    return NextResponse.json(contracts)
  } catch (error) {
    return NextResponse.json({ error: "Lỗi truy xuất dữ liệu" }, { status: 500 })
  }
}

// Thêm hợp đồng mới
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("Dữ liệu từ giao diện gửi lên:", body) // In dữ liệu ra terminal để kiểm tra

    const contract = await prisma.contract.create({
      data: {
        partner_name: body.partner_name,
        contract_value: body.contract_value,
        sign_date: new Date(body.sign_date),
        expiry_date: new Date(body.expiry_date),
        priority_level: body.priority_level,
        status: body.status,
        file_url: body.file_url, // Thêm dòng này để ghi vào DB
        renewal_terms: body.renewal_terms, // Thêm dòng này
      },
    })
    return NextResponse.json(contract)
  } catch (error) {
    console.error("LỖI KHI LƯU DATABASE:", error) // In lỗi màu đỏ ra terminal
    return NextResponse.json({ error: "Lỗi tạo hợp đồng" }, { status: 500 })
  }
}
// Xóa hợp đồng
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID hợp đồng" }, { status: 400 })
    }

    await prisma.contract.delete({
      where: { id: Number(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Lỗi xóa hợp đồng" }, { status: 500 })
  }
}