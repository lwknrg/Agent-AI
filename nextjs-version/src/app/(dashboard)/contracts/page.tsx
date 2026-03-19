"use client"

import { useState, useEffect } from "react"
import { StatCards } from "./components/stat-cards"
import { DataTable } from "./components/data-table"

export interface Contract {
  id: number
  partner_name: string
  contract_value: number
  sign_date: string
  expiry_date: string
  priority_level: string
  status: string
  file_url?: string | null
  renewal_terms?: string | null // Thêm dòng này
}

export interface ContractFormValues {
  partner_name: string
  contract_value: number
  sign_date: string
  expiry_date: string
  priority_level: string
  status: string
  file_url?: string // Thêm dòng này
  renewal_terms?: string // Thêm dòng này
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    try {
      const res = await fetch("/api/contracts")
      const data = await res.json()
      // Chuyển đổi định dạng ngày giờ chuẩn ISO về YYYY-MM-DD
      const formattedData = data.map((c: any) => ({
        ...c,
        sign_date: new Date(c.sign_date).toISOString().split('T')[0],
        expiry_date: new Date(c.expiry_date).toISOString().split('T')[0]
      }))
      setContracts(formattedData)
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddContract = async (data: ContractFormValues) => {
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        fetchContracts() // Tải lại danh sách sau khi thêm thành công
      }
    } catch (error) {
      console.error("Lỗi thêm hợp đồng:", error)
    }
  }

  const handleDeleteContract = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hợp đồng này?")) return
    try {
      const res = await fetch(`/api/contracts/${id}`, { method: "DELETE" })
      if (res.ok) {
        setContracts((prev) => prev.filter((c) => c.id !== id))
      } else {
        console.error("Xóa thất bại")
      }
    } catch (error) {
      console.error("Lỗi xóa hợp đồng:", error)
    }
  }

  const handleDeleteMultipleContracts = async (ids: number[]) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${ids.length} hợp đồng đã chọn?`)) return
    try {
      // Thực thi xóa song song tất cả các ID được truyền vào
      await Promise.all(ids.map(id => fetch(`/api/contracts/${id}`, { method: "DELETE" })))
      
      // Cập nhật lại giao diện sau khi xóa thành công
      setContracts(prev => prev.filter(c => !ids.includes(c.id)))
    } catch (error) {
      console.error("Lỗi hệ thống khi xóa nhiều hợp đồng:", error)
    }
  }

  const handleEditContract = async (contractData: any) => {
    try {
      const res = await fetch(`/api/contracts/${contractData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contractData),
      })
      if (res.ok) {
        const updatedContract = await res.json()
        // Format lại ngày tháng để bảng không bị lỗi hiển thị
        const formattedUpdated = {
          ...updatedContract,
          sign_date: new Date(updatedContract.sign_date).toISOString().split('T')[0],
          expiry_date: new Date(updatedContract.expiry_date).toISOString().split('T')[0]
        }
        setContracts((prev) =>
          prev.map((c) => (c.id === contractData.id ? formattedUpdated : c))
        )
      } else {
        console.error("Cập nhật thất bại")
      }
    } catch (error) {
      console.error("Lỗi cập nhật hợp đồng:", error)
    }
  }

  if (isLoading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6">
        <StatCards contracts={contracts} />
      </div>
      
      <div className="@container/main px-4 lg:px-6 mt-8 lg:mt-12">
        <DataTable 
          contracts={contracts}
          onDeleteContract={handleDeleteContract}
          onEditContract={handleEditContract}
          onAddContract={handleAddContract}
          onDeleteMultipleContracts={handleDeleteMultipleContracts}
        />
      </div>
    </div>
  )
}