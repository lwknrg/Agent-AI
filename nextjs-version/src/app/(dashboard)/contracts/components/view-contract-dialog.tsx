"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function ViewContractDialog({ contract }: { contract: any }) {
  const formattedValue = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(contract.contract_value)

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return ""
    const [year, month, day] = dateString.split("-")
    return `${day}-${month}-${year}`
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
          <Eye className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chi tiết hợp đồng</DialogTitle>
          <DialogDescription>Mã hệ thống: #{contract.id}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-bold text-sm text-right text-muted-foreground">Đối tác:</span>
            <span className="col-span-3 font-medium">{contract.partner_name}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-bold text-sm text-right text-muted-foreground">Giá trị:</span>
            <span className="col-span-3">{formattedValue}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-bold text-sm text-right text-muted-foreground">Ngày ký:</span>
            <span className="col-span-3">{formatDisplayDate(contract.sign_date)}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-bold text-sm text-right text-muted-foreground">Hết hạn:</span>
            <span className="col-span-3">{formatDisplayDate(contract.expiry_date)}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-bold text-sm text-right text-muted-foreground">Mức độ:</span>
            <span className="col-span-3">
              <Badge variant="outline">{contract.priority_level}</Badge>
            </span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-bold text-sm text-right text-muted-foreground">Trạng thái:</span>
            <span className="col-span-3">
              <Badge variant="outline">{contract.status}</Badge>
            </span>
          </div>
          {/* Thêm khối Điều khoản tái tục ở đây */}
          <div className="grid grid-cols-4 items-start gap-4">
            <span className="font-bold text-sm text-right text-muted-foreground mt-1">Tái tục:</span>
            <span className="col-span-3 text-sm text-muted-foreground bg-muted p-2 rounded-md">
              {contract.renewal_terms || "Không có quy định trong hợp đồng."}
            </span>
          </div>
          {contract.file_url && (
            <div className="grid grid-cols-4 items-center gap-4 mt-2 border-t pt-4">
              <span className="font-bold text-sm text-right text-muted-foreground">Tệp gốc:</span>
              <span className="col-span-3">
                <a href={contract.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                  Mở tệp đính kèm
                </a>
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}