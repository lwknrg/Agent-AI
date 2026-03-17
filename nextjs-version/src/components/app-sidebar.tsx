"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Settings,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Admin",
    email: "admin@kienlongbank.com",
    avatar: "",
  },
  navGroups: [
    {
      label: "Quản lý",
      items: [
        {
          title: "Hợp đồng",
          url: "/contracts", 
          icon: FileText,
        },
      ],
    },
    {
      label: "Hệ thống",
      items: [
        {
          title: "Cài đặt",
          url: "#",
          icon: Settings,
          items: [
            {
              title: "Tài khoản",
              url: "/settings/account",
            },
            {
              title: "Giao diện",
              url: "/settings/appearance",
            },
          ],
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Logo size={24} className="text-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Quản lý Hợp đồng</span>
                  <span className="truncate text-xs">Agent AI</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
