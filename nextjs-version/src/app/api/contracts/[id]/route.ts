import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getToken } from "next-auth/jwt"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Kiểm tra quyền bảo mật: Chỉ admin mới được quyền XÓA
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { error: "Từ chối truy cập. Chỉ quản lý mới có quyền xóa hợp đồng." }, 
        { status: 403 }
      )
    }

    const resolvedParams = await params
    await prisma.contract.delete({
      where: { id: Number(resolvedParams.id) },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Lỗi xóa hợp đồng" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Kiểm tra xem người dùng đã đăng nhập chưa
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để thực hiện thao tác." }, { status: 401 })
    }

    const resolvedParams = await params
    const body = await request.json()

    // 2. Chuẩn bị dữ liệu cập nhật cơ bản (Ai cũng sửa được)
    const updateData: any = {
      partner_name: body.partner_name,
      contract_value: body.contract_value,
      sign_date: new Date(body.sign_date),
      expiry_date: new Date(body.expiry_date),
      priority_level: body.priority_level,
      file_url: body.file_url,
      renewal_terms: body.renewal_terms,
    }

    // 3. Khóa logic: Chỉ cấp quyền Admin mới có thể thay đổi trạng thái thông qua Edit Form
    if (token.role === "admin" && body.status) {
      updateData.status = body.status
    }

    const contract = await prisma.contract.update({
      where: { id: Number(resolvedParams.id) },
      data: updateData,
    })
    
    return NextResponse.json(contract)
  } catch (error) {
    return NextResponse.json({ error: "Lỗi cập nhật hợp đồng" }, { status: 500 })
  }
}

// THÊM MỚI: Phương thức PATCH để cập nhật nhanh trạng thái
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Kiểm tra quyền bảo mật: Chỉ admin mới được duyệt/đổi trạng thái nhanh
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { error: "Từ chối truy cập. Chỉ quản lý mới có quyền phê duyệt hợp đồng." }, 
        { status: 403 }
      )
    }

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