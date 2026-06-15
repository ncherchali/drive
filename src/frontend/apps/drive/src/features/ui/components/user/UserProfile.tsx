import { useAuth, logout } from "@/features/auth/Auth";
import { UserMenu } from "@/components/layout/user-menu";
import { LanguagePickerUserMenu } from "@/features/layouts/components/header/Header";
import { LoginButton } from "@/features/auth/components/LoginButton";

// Profil utilisateur (chemin non-DS) — anciennement UserMenu d'ui-kit, désormais
// le menu utilisateur DS (components/layout/user-menu). Le sélecteur de langue
// (DS) est inséré comme contenu du menu.
export const UserProfile = () => {
  const { user } = useAuth();

  if (!user) {
    return <LoginButton />;
  }

  return (
    <UserMenu name={user.email} onLogout={logout}>
      <LanguagePickerUserMenu />
    </UserMenu>
  );
};
