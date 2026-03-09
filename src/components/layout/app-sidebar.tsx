"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  History,
  Users,
  ArrowLeftRight,
  ClipboardList,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { CurrencySelector } from "./currency-selector";
import { Wallet } from "lucide-react";
import type { SupportedCurrency } from "@/lib/types";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Despesas", href: "/expenses", icon: Receipt },
  { title: "Receitas", href: "/income", icon: TrendingUp },
  { title: "Pendências", href: "/pendencias", icon: ClipboardList },
  { title: "Câmbio", href: "/exchange-rates", icon: ArrowLeftRight },
  { title: "Histórico", href: "/history", icon: History },
];

const adminItems = [
  { title: "Usuários", href: "/admin", icon: Users },
];

interface AppSidebarProps {
  isAdmin?: boolean;
  preferredCurrency?: SupportedCurrency;
}

export function AppSidebar({ isAdmin, preferredCurrency = "BRL" }: AppSidebarProps) {
  const pathname = usePathname();

  const items = isAdmin ? [...navItems, ...adminItems] : navItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-6 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Wallet className="h-6 w-6 shrink-0 text-primary" />
          <span className="text-lg font-bold group-data-[collapsible=icon]:hidden">Priority List</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Moeda</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2">
              <CurrencySelector current={preferredCurrency} />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
