// Modale de création de dossier — Design System (DsPromptDialog).
// La version Cunningham et le pont à flag ont été retirés (dépose totale) :
// ce composant délègue à ExplorerCreateFolderModalDs. Interface publique
// inchangée → call sites intacts.
import {
  ExplorerCreateFolderModalDs,
  ExplorerCreateFolderModalDsProps,
} from "./ExplorerCreateFolderModalDs";

export const ExplorerCreateFolderModal = (
  props: ExplorerCreateFolderModalDsProps,
) => <ExplorerCreateFolderModalDs {...props} />;
