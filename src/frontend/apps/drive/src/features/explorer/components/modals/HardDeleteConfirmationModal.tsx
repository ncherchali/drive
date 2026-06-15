// Confirmation de suppression définitive — Design System (DsConfirmDialog).
// La version Cunningham et le pont à flag ont été retirés (dépose totale) :
// ce composant délègue à HardDeleteConfirmationModalDs.
import { HardDeleteConfirmationModalDs } from "./HardDeleteConfirmationModalDs";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onDecide: (decision: "yes" | null) => void;
  count?: number;
};

export const HardDeleteConfirmationModal = (props: Props) => (
  <HardDeleteConfirmationModalDs {...props} />
);
