// Confirmation d'annulation d'upload — Design System (DsConfirmDialog).
// La version Cunningham et le pont à flag ont été retirés (dépose totale) :
// ce composant délègue à CancelUploadConfirmationModalDs.
import { CancelUploadConfirmationModalDs } from "./CancelUploadConfirmationModalDs";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const CancelUploadConfirmationModal = (props: Props) => (
  <CancelUploadConfirmationModalDs {...props} />
);
