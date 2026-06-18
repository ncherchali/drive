// Variante Design System du panneau de droite (infos / méta).
// Pages Router : pas de "use client".
//
// Réécrit la coquille du panneau (états vide / sélection multiple / item) en DS
// (Tailwind + Button DS + ScrollArea), SANS wrapper `.sahla-ds` : les composants
// DS employés ici sont auto-suffisants (pas de bordure dépendant du reset), ce
// qui laisse `ItemInfo` (InfoRow/UserRow Cunningham) et la modale de partage
// intacts. La modale de partage (ItemShareModal) reste Cunningham — sa réécriture
// DS (RBAC) est une phase dédiée (cf. docs/ds-migration-plan.md, phase 10b).
import { X, Users } from "lucide-react";
import { useModal } from "@/components/use-modal";
import { useTranslation } from "react-i18next";
import { IconSize } from "@/features/ui/components/icon/Icon";
import { Item, ItemType, ItemUploadState } from "@/features/drivers/types";
import { ItemIcon } from "../icons/ItemIcon";
import { useGlobalExplorer } from "../GlobalExplorerContext";
import { useSelectedItems } from "../../stores/selectionStore";
import { ItemShareModal } from "../modals/share/ItemShareModal";
import { ItemInfoDs } from "@/features/items/components/ItemInfoDs";
import { ItemActivityDs } from "@/features/items/components/ItemActivityDs";
import { ItemShareLinksDs } from "@/features/items/components/ItemShareLinksDs";
import { ItemVersionsDs } from "@/features/items/components/ItemVersionsDs";
import { ItemComplianceDs } from "@/features/items/components/ItemComplianceDs";
import { ItemDataRoomDs } from "@/features/items/components/ItemDataRoomDs";
import { ItemSignaturesDs } from "@/features/items/components/ItemSignaturesDs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import multipleSelection from "@/assets/mutliple-selection.png";
import emptySelection from "@/assets/empty-selection.png";

type ExplorerRightPanelContentDsProps = {
  item?: Item;
};

export const ExplorerRightPanelContentDs = ({
  item,
}: ExplorerRightPanelContentDsProps) => {
  const { setRightPanelOpen } = useGlobalExplorer();
  const selectedItems = useSelectedItems();
  const shareModal = useModal();
  const { t } = useTranslation();

  const firstSelectedItem = item ?? selectedItems[0];

  const showWarning =
    firstSelectedItem?.upload_state === ItemUploadState.SUSPICIOUS ||
    firstSelectedItem?.upload_state ===
      ItemUploadState.FILE_TOO_LARGE_TO_ANALYZE;

  const closeButton = (
    <Button
      variant="ghost"
      size="icon"
      className="size-8"
      aria-label={t("explorer.rightPanel.empty.alt")}
      onClick={() => setRightPanelOpen(false)}
    >
      <X />
    </Button>
  );

  if (!firstSelectedItem) {
    return (
      <div className="flex h-full flex-col bg-card text-card-foreground">
        <div className="flex justify-end p-2">{closeButton}</div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <img
            src={emptySelection.src}
            alt={t("explorer.rightPanel.empty.alt")}
            className="max-w-[12rem]"
          />
          <p className="text-sm text-muted-foreground">
            {t("explorer.rightPanel.empty.text")}
          </p>
        </div>
      </div>
    );
  }

  if (selectedItems.length > 1) {
    return (
      <div className="flex h-full flex-col bg-card text-card-foreground">
        <div className="flex justify-end p-2">{closeButton}</div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <img
            src={multipleSelection.src}
            alt={selectedItems[0].title}
            className="max-w-[12rem]"
          />
          <p className="text-sm text-muted-foreground">
            {t("explorer.rightPanel.multipleSelection.text")}
          </p>
        </div>
      </div>
    );
  }

  const hasSharedAccesses =
    !!firstSelectedItem?.nb_accesses && firstSelectedItem.nb_accesses > 1;

  return (
    <>
      <ScrollArea
        className="h-full bg-card text-card-foreground"
        data-testid="right-panel"
      >
        <div className="flex flex-col gap-4 p-4">
          {/* En-tête : fermeture + titre + grande icône */}
          <div className="flex items-start gap-2">
            <div className="mt-0.5 shrink-0">
              <ItemIcon
                item={firstSelectedItem}
                size={IconSize.SMALL}
                type="mini"
              />
            </div>
            <div className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {firstSelectedItem.title}
            </div>
            {closeButton}
          </div>

          <div className="flex justify-center py-2">
            <ItemIcon item={firstSelectedItem} size={IconSize.X_LARGE} />
          </div>

          {showWarning && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {t(`explorer.rightPanel.${firstSelectedItem.upload_state}.text`)}
            </div>
          )}

          {/* Ligne de partage */}
          <div className="flex items-center justify-between gap-2 border-t border-solid border-border pt-3">
            <span className="text-sm text-muted-foreground">
              {t("explorer.rightPanel.sharing")}
            </span>
            {hasSharedAccesses ? (
              <Button variant="secondary" size="sm" onClick={shareModal.open}>
                <Users />
                {firstSelectedItem.nb_accesses}
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={shareModal.open}>
                {t("explorer.rightPanel.share")}
              </Button>
            )}
          </div>

          {/* Métadonnées + Activité en onglets DS. L'onglet Activité (journal
              d'audit) n'est proposé qu'aux managers (owner/admin) ; le backend
              renvoie 403 sinon. */}
          {firstSelectedItem.abilities?.accesses_manage ? (
            <Tabs defaultValue="info" className="border-t border-solid border-border pt-3">
              <TabsList className="w-full">
                <TabsTrigger value="info">
                  {t("explorer.rightPanel.tabs.info")}
                </TabsTrigger>
                <TabsTrigger value="activity">
                  {t("explorer.rightPanel.tabs.activity")}
                </TabsTrigger>
                <TabsTrigger value="links">
                  {t("explorer.rightPanel.tabs.links")}
                </TabsTrigger>
                {firstSelectedItem.type === ItemType.FILE && (
                  <TabsTrigger value="versions">
                    {t("explorer.rightPanel.tabs.versions")}
                  </TabsTrigger>
                )}
                {firstSelectedItem.type === ItemType.FILE && (
                  <TabsTrigger value="signatures">
                    {t("explorer.rightPanel.tabs.signatures")}
                  </TabsTrigger>
                )}
                <TabsTrigger value="compliance">
                  {t("explorer.rightPanel.tabs.compliance")}
                </TabsTrigger>
                {firstSelectedItem.type === ItemType.FOLDER && (
                  <TabsTrigger value="data-room">
                    {t("explorer.rightPanel.tabs.data_room")}
                  </TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="info">
                <ItemInfoDs item={firstSelectedItem} />
              </TabsContent>
              <TabsContent value="activity">
                <ItemActivityDs itemId={firstSelectedItem.id} />
              </TabsContent>
              <TabsContent value="links">
                <ItemShareLinksDs itemId={firstSelectedItem.id} />
              </TabsContent>
              {firstSelectedItem.type === ItemType.FILE && (
                <TabsContent value="versions">
                  <ItemVersionsDs
                    itemId={firstSelectedItem.id}
                    filename={
                      firstSelectedItem.filename ?? firstSelectedItem.title
                    }
                  />
                </TabsContent>
              )}
              {firstSelectedItem.type === ItemType.FILE && (
                <TabsContent value="signatures">
                  <ItemSignaturesDs itemId={firstSelectedItem.id} />
                </TabsContent>
              )}
              <TabsContent value="compliance">
                <ItemComplianceDs itemId={firstSelectedItem.id} />
              </TabsContent>
              {firstSelectedItem.type === ItemType.FOLDER && (
                <TabsContent value="data-room">
                  <ItemDataRoomDs itemId={firstSelectedItem.id} />
                </TabsContent>
              )}
            </Tabs>
          ) : (
            <div className="border-t border-solid border-border pt-3">
              <ItemInfoDs item={firstSelectedItem} />
            </div>
          )}
        </div>
      </ScrollArea>

      {firstSelectedItem && shareModal.isOpen && (
        <ItemShareModal
          isOpen={shareModal.isOpen}
          onClose={shareModal.close}
          item={firstSelectedItem}
        />
      )}
    </>
  );
};
