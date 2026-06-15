// Modale de création d'espace — Design System (DsPromptDialog).
// La version Cunningham et le pont à flag ont été retirés (dépose totale) :
// ce composant délègue à ExplorerCreateWorkspaceModalDs. Interface publique
// inchangée → call sites intacts.
import {
  ExplorerCreateWorkspaceModalDs,
  ExplorerCreateWorkspaceModalDsProps,
} from "./ExplorerCreateWorkspaceModalDs";

export const ExplorerCreateWorkspaceModal = (
  props: ExplorerCreateWorkspaceModalDsProps,
) => <ExplorerCreateWorkspaceModalDs {...props} />;
