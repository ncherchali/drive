// Modale de renommage — Design System (DsPromptDialog).
// La version Cunningham et le pont à flag ont été retirés (dépose totale) :
// ce composant délègue à ExplorerRenameItemModalDs. Interface publique
// inchangée → call sites intacts.
import {
  ExplorerRenameItemModalDs,
  ExplorerRenameItemModalDsProps,
} from "./ExplorerRenameItemModalDs";

export const ExplorerRenameItemModal = (
  props: ExplorerRenameItemModalDsProps,
) => <ExplorerRenameItemModalDs {...props} />;
