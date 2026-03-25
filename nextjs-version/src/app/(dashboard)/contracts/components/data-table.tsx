"use client"

import { EditContractDialog } from "./edit-contract-dialog"
import { ViewContractDialog } from "./view-contract-dialog"
import { useState } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type Row,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronDown,
  EllipsisVertical,
  Eye,
  Pencil,
  Trash2,
  Download,
  Search,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ContractFormDialog } from "./contract-form-dialog"
import { Contract, ContractFormValues } from "../page"

interface DataTableProps {
  contracts: Contract[]
  role: string
  onDeleteContract: (id: number) => void
  onEditContract: (contract: Contract) => void
  onAddContract: (contractData: ContractFormValues) => void
  onDeleteMultipleContracts: (ids: number[]) => void
}

export function DataTable({ contracts, role, onDeleteContract, onEditContract, onAddContract, onDeleteMultipleContracts }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  const handleSendReminderEmail = async (contract: Contract) => {
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `[Hệ thống] Nhắc nhở kiểm tra hợp đồng: ${contract.partner_name}`,
          htmlContent: `
            <h3>Thông tin hợp đồng cần lưu ý:</h3>
            <ul>
              <li><strong>Đối tác:</strong> ${contract.partner_name}</li>
              <li><strong>Giá trị:</strong> ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(contract.contract_value)}</li>
              <li><strong>Ngày hết hạn:</strong> ${contract.expiry_date}</li>
              <li><strong>Mức độ:</strong> ${contract.priority_level}</li>
              <li><strong>Trạng thái:</strong> ${contract.status}</li>
            </ul>
            <p>Vui lòng đăng nhập vào hệ thống để xem xét các điều khoản tái tục.</p>
          `,
        }),
      })

      if (response.ok) {
        alert(`Đã gửi email nhắc nhở hợp đồng ${contract.partner_name} tới lwknrg@gmail.com`)
      } else {
        alert("Có lỗi xảy ra khi gửi email.")
      }
    } catch (error) {
      console.error("Lỗi khi gọi API gửi email:", error)
      alert("Lỗi kết nối máy chủ.")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Đang hoạt động":
        return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
      case "Chờ đánh giá":
        return "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20"
      case "Đã tái tục":
        return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20"
      default:
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Cao":
        return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20"
      case "Trung bình":
        return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20"
      case "Thấp":
        return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
      default:
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20"
    }
  }

  const exactFilter = (row: Row<Contract>, columnId: string, value: string) => {
    return row.getValue(columnId) === value
  }

  const columns: ColumnDef<Contract>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center px-2">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Chọn tất cả"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center px-2">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Chọn hàng"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
    {
      accessorKey: "partner_name",
      header: "Đối tác",
      cell: ({ row }) => {
        return <span className="font-medium">{row.getValue("partner_name")}</span>
      },
    },
    {
      accessorKey: "contract_value",
      header: "Giá trị (VNĐ)",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("contract_value"))
        const formatted = new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(amount)
        return <span className="font-medium">{formatted}</span>
      },
    },
    {
      accessorKey: "sign_date",
      header: "Ngày ký",
      cell: ({ row }) => {
        const dateStr = row.getValue("sign_date") as string
        if (!dateStr) return <span></span>
        const [year, month, day] = dateStr.split('-')
        return <span>{`${day}-${month}-${year}`}</span>
      },
    },
    {
      accessorKey: "expiry_date",
      header: "Ngày hết hạn",
      cell: ({ row }) => {
        const dateStr = row.getValue("expiry_date") as string
        if (!dateStr) return <span></span>
        const [year, month, day] = dateStr.split('-')
        return <span>{`${day}-${month}-${year}`}</span>
      },
    },
    {
      accessorKey: "priority_level",
      header: "Mức độ",
      cell: ({ row }) => {
        const priority = row.getValue("priority_level") as string
        return (
          <Badge variant="secondary" className={getPriorityColor(priority)}>
            {priority}
          </Badge>
        )
      },
      filterFn: exactFilter,
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant="secondary" className={getStatusColor(status)}>
            {status}
          </Badge>
        )
      },
      filterFn: exactFilter,
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const contract = row.original
        return (
          <div className="flex items-center gap-2">
            <ViewContractDialog contract={contract} />
            <EditContractDialog contract={contract} onUpdateContract={onEditContract} />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                  <EllipsisVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {contract.file_url && (
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <a href={contract.file_url} target="_blank" rel="noopener noreferrer">
                      Xem tệp đính kèm
                    </a>
                  </DropdownMenuItem>
                )}
                
                {/* Chỉ hiển thị các nút này nếu là Admin */}
                {role === "admin" && (
                  <>
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => handleSendReminderEmail(contract)}
                    >
                      Gửi email nhắc nhở
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      className="cursor-pointer"
                      onClick={() => onDeleteContract(contract.id)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Xóa hợp đồng
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: contracts,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  const priorityFilter = table.getColumn("priority_level")?.getFilterValue() as string
  const statusFilter = table.getColumn("status")?.getFilterValue() as string

  const handleExportCSV = () => {
    if (!contracts || contracts.length === 0) {
      alert("Không có dữ liệu để xuất")
      return
    }

    const headers = ["ID", "Đối tác", "Giá trị hợp đồng", "Ngày ký", "Ngày hết hạn", "Mức độ", "Trạng thái"]

    const csvRows = contracts.map(c => [
      c.id,
      `"${c.partner_name}"`,
      c.contract_value,
      c.sign_date,
      c.expiry_date,
      c.priority_level,
      c.status
    ])

    const csvContent = [
      headers.join(","),
      ...csvRows.map(row => row.join(","))
    ].join("\n")

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `Danh_sach_hop_dong_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm hợp đồng..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Nút Xóa hàng loạt cũng bị ẩn đối với staff */}
          {role === "admin" && table.getFilteredSelectedRowModel().rows.length > 0 && (
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={() => {
                const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id)
                onDeleteMultipleContracts(selectedIds)
                table.toggleAllRowsSelected(false) 
              }}
            >
              <Trash2 className="mr-2 size-4" />
              Xóa đã chọn ({table.getFilteredSelectedRowModel().rows.length})
            </Button>
          )}
          <Button variant="outline" className="cursor-pointer" onClick={handleExportCSV}>
            <Download className="mr-2 size-4" />
            Xuất file
          </Button>
          <ContractFormDialog onAddContract={onAddContract} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 sm:gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority-filter" className="text-sm font-medium">Mức độ</Label>
          <Select
            value={priorityFilter || ""}
            onValueChange={(value) =>
              table.getColumn("priority_level")?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="cursor-pointer w-full" id="priority-filter">
              <SelectValue placeholder="Chọn mức độ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="Cao">Cao</SelectItem>
              <SelectItem value="Trung bình">Trung bình</SelectItem>
              <SelectItem value="Thấp">Thấp</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status-filter" className="text-sm font-medium">Trạng thái</Label>
          <Select
            value={statusFilter || ""}
            onValueChange={(value) =>
              table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="cursor-pointer w-full" id="status-filter">
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="Đang hoạt động">Đang hoạt động</SelectItem>
              <SelectItem value="Chờ đánh giá">Chờ đánh giá</SelectItem>
              <SelectItem value="Đã tái tục">Đã tái tục</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="column-visibility" className="text-sm font-medium">Hiển thị cột</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild id="column-visibility">
              <Button variant="outline" className="cursor-pointer w-full">
                Cột <ChevronDown className="ml-2 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id === "partner_name" ? "Đối tác" : 
                       column.id === "contract_value" ? "Giá trị" :
                       column.id === "sign_date" ? "Ngày ký" :
                       column.id === "expiry_date" ? "Ngày hết hạn" :
                       column.id === "priority_level" ? "Mức độ" :
                       column.id === "status" ? "Trạng thái" : column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Không có kết quả.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="page-size" className="text-sm font-medium">Hiển thị</Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="w-20 cursor-pointer" id="page-size">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 text-sm text-muted-foreground hidden sm:block">
          Đã chọn {table.getFilteredSelectedRowModel().rows.length} /{" "}
          {table.getFilteredRowModel().rows.length} hàng.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="hidden items-center space-x-2 sm:flex">
            <p className="text-sm font-medium">Trang</p>
            <strong className="text-sm">
              {table.getState().pagination.pageIndex + 1} / {" "}
              {table.getPageCount()}
            </strong>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="cursor-pointer"
            >
              Trang trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="cursor-pointer"
            >
              Trang sau
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}