"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const contractFormSchema = z.object({
  partner_name: z.string().min(2, {
    message: "Tên đối tác phải có ít nhất 2 ký tự.",
  }),
  contract_value: z.number().min(0, {
    message: "Giá trị hợp đồng phải lớn hơn hoặc bằng 0.",
  }),
  sign_date: z.string().min(1, {
    message: "Vui lòng chọn ngày ký.",
  }),
  expiry_date: z.string().min(1, {
    message: "Vui lòng chọn ngày hết hạn.",
  }),
  priority_level: z.string().min(1, {
    message: "Vui lòng chọn mức độ.",
  }),
  status: z.string().min(1, {
    message: "Vui lòng chọn trạng thái.",
  }),
  file_url: z.string().optional(),
  renewal_terms: z.string().optional(), // THÊM DÒNG NÀY
})

export type ContractFormValues = z.infer<typeof contractFormSchema>

interface ContractFormDialogProps {
  onAddContract: (contract: ContractFormValues) => void
}

export function ContractFormDialog({ onAddContract }: ContractFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      partner_name: "",
      contract_value: 0,
      sign_date: "",
      expiry_date: "",
      priority_level: "",
      status: "",
      renewal_terms: "", // THÊM DÒNG NÀY
    },
  })

  async function onSubmit(data: ContractFormValues) {
    setIsUploading(true)
    try {
      let finalData = { ...data }

      if (selectedFile) {
        const formData = new FormData()
        formData.append("file", selectedFile)

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          finalData.file_url = uploadData.file_url
        } else {
          console.error("Tải tệp thất bại")
        }
      }

      await onAddContract(finalData)
      form.reset()
      setSelectedFile(null)
      setOpen(false)
    } catch (error) {
      console.error("Lỗi khi thêm hợp đồng:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleExtractAI = async () => {
    if (!selectedFile) return
    setIsExtracting(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        form.reset({
          ...form.getValues(),
          ...data
        })
      } else {
        console.error("Lỗi khi đọc file")
      }
    } catch (error) {
      console.error("Lỗi hệ thống:", error)
    } finally {
      setIsExtracting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      form.reset()
      setSelectedFile(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Thêm hợp đồng
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thêm hợp đồng mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin chi tiết và đính kèm tệp hợp đồng.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="partner_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Đối tác</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên đối tác" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contract_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giá trị hợp đồng (VNĐ)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Nhập giá trị hợp đồng" 
                      {...field}
                      onChange={(e) => {
                        const val = e.target.value
                        field.onChange(val === "" ? 0 : Number(val))
                      }} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sign_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày ký</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày hết hạn</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mức độ</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue placeholder="Chọn mức độ ưu tiên" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cao">Cao</SelectItem>
                        <SelectItem value="Trung bình">Trung bình</SelectItem>
                        <SelectItem value="Thấp">Thấp</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trạng thái</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Đang hoạt động">Đang hoạt động</SelectItem>
                        <SelectItem value="Chờ đánh giá">Chờ đánh giá</SelectItem>
                        <SelectItem value="Đã tái tục">Đã tái tục</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <FormLabel>Tệp hợp đồng (PDF) - Khuyên dùng</FormLabel>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".pdf"
                  className="cursor-pointer"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setSelectedFile(e.target.files[0])
                    } else {
                      setSelectedFile(null)
                    }
                  }}
                />
                {selectedFile && (
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleExtractAI}
                    disabled={isExtracting}
                  >
                    {isExtracting ? "Đang đọc..." : "Quét AI"}
                  </Button>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" className="cursor-pointer" disabled={isUploading}>
                {isUploading ? "Đang xử lý..." : "Lưu hợp đồng"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}