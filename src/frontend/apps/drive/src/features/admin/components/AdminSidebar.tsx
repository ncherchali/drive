// Sidebar de la console d'administration (Design System / shadcn Sidebar).
// Nav secondaire verticale : gouvernance (types / templates) + retour vers
// l'application end-user, séparés par hiérarchie (rules nav-hierarchy,
// nav-state-active, persistent-nav du skill ui-ux-pro-max).
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import {
  Boxes,
  FileSliders,
  Timer,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { useAuth, logout } from "@/features/auth/Auth";

const NAV = [
  { href: "/admin/content-types", icon: Boxes, key: "content_types.menu_tab" },
  {
    href: "/admin/metadata-templates",
    icon: FileSliders,
    key: "metadata_templates.menu_tab",
  },
  {
    href: "/admin/retention-policies",
    icon: Timer,
    key: "retention_policies.menu_tab",
  },
];

const APP_HREF = "/explorer/items/my-files";

export const AdminSidebar = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  return (
    <Sidebar collapsible="offcanvas" className="border-sidebar-border">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" />
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold text-sidebar-foreground">
              Sahla
            </span>
            <span className="truncate text-xs text-sidebar-foreground/60">
              {t("admin.content_types.menu")}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("admin.governance")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const active = router.pathname === item.href;
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      onClick={() => router.push(item.href)}
                    >
                      <Icon />
                      <span>{t(`admin.${item.key}`)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => router.push(APP_HREF)}>
              <ArrowLeft />
              <span>{t("admin.back_to_app")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {user && (
          <div className="flex items-center gap-2 px-1 py-1">
            <UserMenu name={user.email} email={user.email} onLogout={logout} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-sidebar-foreground">
              {user.email}
            </span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};
