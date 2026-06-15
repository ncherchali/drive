// Confirmation de déplacement (arbre) — Design System (DsConfirmDialog).
// La version Cunningham et le pont à flag ont été retirés (dépose totale) :
// ce composant délègue à ExplorerTreeMoveConfirmationModalDs.
import { Item } from "@/features/drivers/types";
import { ExplorerTreeMoveConfirmationModalDs } from "./ExplorerTreeMoveConfirmationModalDs";

export type ConfirmationMoveState = {
  sourceItem: Item;
  targetItem: Item;
  moveCallback?: () => void;
};

type ExplorerTreeMoveConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  sourceItem: Item;
  targetItem: Item;
  onMove: () => void;
  itemsCount?: number;
  isMoveToRoot?: boolean;
};

export const ExplorerTreeMoveConfirmationModal = (
  props: ExplorerTreeMoveConfirmationModalProps,
) => <ExplorerTreeMoveConfirmationModalDs {...props} />;
