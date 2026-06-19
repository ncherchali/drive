// Navigation entre les consoles d'administration (types / templates).
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";

const LINKS = [
  { href: "/admin/content-types", key: "content_types.menu_tab" },
  { href: "/admin/metadata-templates", key: "metadata_templates.menu_tab" },
];

export const AdminNav = () => {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <nav className="flex gap-1 border-b border-solid border-border">
      {LINKS.map((link) => {
        const active = router.pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "border-b-2 border-solid border-transparent px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground",
              active && "border-primary text-foreground",
            )}
          >
            {t(`admin.${link.key}`)}
          </Link>
        );
      })}
    </nav>
  );
};
