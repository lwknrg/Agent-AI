import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Kiểm tra xem đã có user nào chưa để tránh tạo trùng lặp
    const adminExists = await prisma.user.findUnique({ where: { email: "admin@bank.com" } })
    
    if (adminExists) {
      return NextResponse.json({ message: "Tài khoản đã được tạo từ trước." })
    }

    // Mã hóa mật khẩu chung là: 123456
    const hashedPassword = await bcrypt.hash("123456", 10)

    // Tạo tài khoản Quản lý
    await prisma.user.create({
      data: {
        email: "admin@bank.com",
        password: hashedPassword,
        role: "admin",
      }
    })

    // Tạo tài khoản Nhân viên
    await prisma.user.create({
      data: {
        email: "staff@bank.com",
        password: hashedPassword,
        role: "staff",
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Tạo thành công 2 tài khoản: admin@bank.com (Quyền: admin) và staff@bank.com (Quyền: staff). Mật khẩu mặc định: 123456" 
    })
  } catch (error) {
    console.error("Lỗi tạo user:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}