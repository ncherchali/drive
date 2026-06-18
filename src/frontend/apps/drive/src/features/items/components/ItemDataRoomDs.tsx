// Onglet « Espace » du panneau de droite (H1.7 / Sahla Rooms).
// Pages Router : pas de "use client".
//
// Active/désactive une data room view-only sur un dossier et règle l'autorisation
// de téléchargement. Réservé aux managers (l'onglet n'est monté que pour les
// dossiers, et pour les managers).
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useMutationDeleteDataRoom,
  useMutationSetDataRoom,
} from "@/features/explorer/hooks/useMutationsDataRoom";
import { useItemDataRoom } from "@/features/explorer/hooks/useQueries";

export type ItemDataRoomDsProps = {
  itemId: string;
};

export const ItemDataRoomDs = ({ itemId }: ItemDataRoomDsProps) => {
  const { t } = useTranslation();
  const { data: room, isLoading } = useItemDataRoom(itemId);
  const setRoom = useMutationSetDataRoom();
  const deleteRoom = useMutationDeleteDataRoom();

  const enabled = !!room;

  const toggleRoom = (checked: boolean) => {
    if (checked) {
      setRoom.mutate({ itemId, settings: { allow_download: false } });
    } else {
      deleteRoom.mutate({ itemId });
    }
  };

  const toggleDownload = (checked: boolean) => {
    setRoom.mutate({ itemId, settings: { allow_download: checked } });
  };

  if (isLoading) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        {t("explorer.rightPanel.data_room.loading")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-2 text-sm">
      <p className="text-muted-foreground">
        {t("explorer.rightPanel.data_room.description")}
      </p>

      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="room-enabled">
          {t("explorer.rightPanel.data_room.enable")}
        </Label>
        <Switch
          id="room-enabled"
          checked={enabled}
          onCheckedChange={toggleRoom}
          disabled={setRoom.isPending || deleteRoom.isPending}
        />
      </div>

      {enabled && (
        <div className="flex items-center justify-between gap-3 border-t border-solid border-border pt-3">
          <Label htmlFor="room-download">
            {t("explorer.rightPanel.data_room.allow_download")}
          </Label>
          <Switch
            id="room-download"
            checked={room.allow_download}
            onCheckedChange={toggleDownload}
            disabled={setRoom.isPending}
          />
        </div>
      )}
    </div>
  );
};
