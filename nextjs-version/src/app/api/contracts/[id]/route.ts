import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    await prisma.contract.delete({
      where: { id: Number(resolvedParams.id) },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Lỗi xóa hợp đồng" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const contract = await prisma.contract.update({
      where: { id: Number(resolvedParams.id) },
      data: {
        partner_name: body.partner_name,
        contract_value: body.contract_value,
        sign_date: new Date(body.sign_date),
        expiry_date: new Date(body.expiry_date),
        priority_level: body.priority_level,
        status: body.status,
        file_url: body.file_url,
        renewal_terms: body.renewal_terms,
      },
    })
    return NextResponse.json(contract)
  } catch (error) {
    return NextResponse.json({ error: "Lỗi cập nhật hợp đồng" }, { status: 500 })
  }
}

// THÊM MỚI: Phương thức PATCH để cập nhật nhanh trạng thái
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    
    const contract = await prisma.contract.update({
      where: { id: Number(resolvedParams.id) },
      data: { status: body.status },
    })
    
    return NextResponse.json({ success: true, contract })
  } catch (error) {
    return NextResponse.json({ error: "Lỗi phê duyệt hợp đồng" }, { status: 500 })
  }
}