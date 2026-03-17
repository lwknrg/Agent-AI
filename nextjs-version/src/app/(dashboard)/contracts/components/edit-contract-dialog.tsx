"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const contractFormSchema = z.object({
  partner_name: z.string().min(2),
  contract_value: z.number().min(0),
  sign_date: z.string().min(1),
  expiry_date: z.string().min(1),
  priority_level: z.string().min(1),
  status: z.string().min(1),
  file_url: z.string().optional(),
  renewal_terms: z.string().optional(), // THÊM DÒNG NÀY
})

export function EditContractDialog({ contract, onUpdateContract }: { contract: any, onUpdateContract: (data: any) => void }) {
  const [open, setOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Hàm chuyển đổi định dạng ngày ISO sang YYYY-MM-DD cho thẻ Input
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    return new Date(dateString).toISOString().split("T")[0]
  }

  const form = useForm<z.infer<typeof contractFormSchema>>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      partner_name: contract.partner_name,
      contract_value: contract.contract_value,
      sign_date: formatDate(contract.sign_date),
      expiry_date: formatDate(contract.expiry_date),
      priority_level: contract.priority_level,
      status: contract.status,
      file_url: contract.file_url || "",
      renewal_terms: contract.renewal_terms || "", // THÊM DÒNG NÀY
    },
  })

  // Đặt lại dữ liệu khi mở form (tránh lỗi cache dữ liệu cũ)
  useEffect(() => {
    if (open) {
      form.reset({
        partner_name: contract.partner_name,
        contract_value: contract.contract_value,
        sign_date: formatDate(contract.sign_date),
        expiry_date: formatDate(contract.expiry_date),
        priority_level: contract.priority_level,
        status: contract.status,
        file_url: contract.file_url || "",
        renewal_terms: contract.renewal_terms || "", // THÊM DÒNG NÀY
      })
      setSelectedFile(null)
    }
  }, [open, contract, form])

  async function onSubmit(data: z.infer<typeof contractFormSchema>) {
    setIsUploading(true)
    try {
      let finalData = { ...data, id: contract.id }

      if (selectedFile) {
        const formData = new FormData()
        formData.append("file", selectedFile)
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          finalData.file_url = uploadData.file_url
        }
      }

      await onUpdateContract(finalData)
      setOpen(false)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sửa hợp đồng</DialogTitle>
          <DialogDescription>Cập nhật thông tin chi tiết hợp đồng.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="partner_name" render={({ field }) => (
              <FormItem><FormLabel>Đối tác</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="contract_value" render={({ field }) => (
              <FormItem>
                <FormLabel>Giá trị hợp đồng (VNĐ)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="sign_date" render={({ field }) => (
                <FormItem><FormLabel>Ngày ký</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="expiry_date" render={({ field }) => (
                <FormItem><FormLabel>Ngày hết hạn</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="priority_level" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mức độ</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Cao">Cao</SelectItem><SelectItem value="Trung bình">Trung bình</SelectItem><SelectItem value="Thấp">Thấp</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Đang hoạt động">Đang hoạt động</SelectItem><SelectItem value="Chờ đánh giá">Chờ đánh giá</SelectItem><SelectItem value="Đã tái tục">Đã tái tục</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>
            {/* THÊM KHỐI NÀY VÀO */}
            <FormField 
              control={form.control} 
              name="renewal_terms" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Điều khoản tái tục</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập điều kiện gia hạn (nếu có)..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />
            {/* KẾT THÚC KHỐI THÊM */}
            <div className="space-y-2">
              <FormLabel>Cập nhật tệp hợp đồng (Tùy chọn)</FormLabel>
              <Input type="file" accept=".pdf" className="cursor-pointer" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              {contract.file_url && !selectedFile && (
                <p className="text-sm text-muted-foreground">Tệp hiện tại: <a href={contract.file_url} target="_blank" className="underline">Xem tệp</a></p>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" className="cursor-pointer" disabled={isUploading}>
                {isUploading ? "Đang lưu..." : "Cập nhật"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}