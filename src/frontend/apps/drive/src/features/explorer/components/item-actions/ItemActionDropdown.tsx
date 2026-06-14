import { Item } from "@/features/drivers/types";
import { MenuDropdown } from "@/components/ds-menu";
import { useItemActionMenuItems } from "../../hooks/useItemActionMenuItems";

export type ItemActionDropdownProps = {
  item: Item;
  itemId?: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  trigger: React.ReactNode;
  onModalOpenChange?: (isModalOpen: boolean) => void;
  minimal?: boolean;
  allowCreate?: boolean;
};

export const ItemActionDropdown = ({
  item,
  itemId,
  isOpen,
  setIsOpen,
  trigger,
  onModalOpenChange,
  minimal = false,
  allowCreate = false,
}: ItemActionDropdownProps) => {
  const { getMenuItems, modals } = useItemActionMenuItems({
    onModalOpenChange,
  });
  const menuItems = getMenuItems(item, { minimal, itemId, allowCreate });

  return (
    <>
      <MenuDropdown options={menuItems} isOpen={isOpen} onOpenChange={setIsOpen}>
        {trigger}
      </MenuDropdown>
      {modals}
    </>
  );
};
