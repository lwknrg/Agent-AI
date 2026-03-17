import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Tài khoản Quản trị",
      credentials: {
        username: { label: "Tên đăng nhập", type: "text", placeholder: "admin" },
        password: { label: "Mật khẩu", type: "password" }
      },
      async authorize(credentials) {
        if (
          credentials?.username === process.env.ADMIN_USERNAME &&
          credentials?.password === process.env.ADMIN_PASSWORD
        ) {
          // Trả về thông tin người dùng nếu đúng tài khoản/mật khẩu
          return { id: "1", name: "Admin" }
        }
        // Trả về null nếu sai
        return null
      }
    })
  ],
  pages: {
    // Điều hướng NextAuth sử dụng giao diện đăng nhập tùy chỉnh
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }