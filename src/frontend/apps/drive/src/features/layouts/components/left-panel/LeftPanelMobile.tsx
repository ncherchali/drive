import { UserProfile } from "@/features/ui/components/user/UserProfile";
import { useIsMobile } from "@/hooks/use-mobile";

export const LeftPanelMobile = () => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return (
    <div className="drive__home__left-panel">
      <div className="drive__home__left-panel__gaufre">
        <UserProfile />
      </div>
    </div>
  );
};
