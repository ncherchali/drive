import { Item } from "@/features/drivers/types";
import { ExplorerRightPanelContentDs } from "./ExplorerRightPanelContentDs";

type ExplorerRightPanelContentProps = {
  item?: Item;
};

/**
 * Panneau de droite de l'explorateur — version DS unique. (L'ancienne bascule
 * vers une implémentation Cunningham a été retirée : dépose totale de l'ui-kit.)
 */
export const ExplorerRightPanelContent = (
  props: ExplorerRightPanelContentProps,
) => {
  return <ExplorerRightPanelContentDs item={props.item} />;
};
