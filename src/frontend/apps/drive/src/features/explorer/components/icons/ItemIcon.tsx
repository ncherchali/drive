import {
  Item,
  ItemType,
  ItemUploadState,
  WorkspaceType,
} from "@/features/drivers/types";
import folderIcon from "@/assets/folder/folder.svg";
import folderPublicIcon from "@/assets/folder/folder-tiny-public.svg";
import folderSharedIcon from "@/assets/folder/folder-tiny-shared.svg";
import {
  FileIcon,
  FileIconContent,
  ICONS,
  IconSize,
  MimeCategory,
} from "@gouvfr-lasuite/ui-kit";
import { Building2, Folder, House, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { itemToPreviewFile, getWorkspaceType } from "../../utils/utils";
import { itemIsWorkspace } from "@/features/drivers/utils";
import {
  Icon as DsIcon,
  ICON_SIZE_PX,
  type IconSizeToken,
} from "@/components/ui/icon";
import {
  useFeatureFlag,
  FLAG_DS_EXPLORER_GRID,
} from "@/features/flags/useFeatureFlag";

type ItemIconProps = {
  item: Item;
  size?: IconSize;
  type?: "mini" | "normal";
};

// Global icon component for all items, same logic as the one in the ui-kit ( FileIcon )
// but provide support for folders.
export const ItemIcon = ({
  item,
  size = IconSize.MEDIUM,
  type = "normal",
}: ItemIconProps) => {
  // Repeinture DS (phase 12+) : derrière DS_EXPLORER_GRID, les icônes d'espaces /
  // dossiers / éléments suspects passent en lucide. Les icônes de TYPE MIME des
  // fichiers restent sur le set ui-kit (set complet, hors périmètre).
  const useDs = useFeatureFlag(FLAG_DS_EXPLORER_GRID);
  if (useDs) {
    // Les valeurs de l'enum IconSize sont identiques aux jetons de l'adaptateur.
    const token = size as unknown as IconSizeToken;
    // Espace partagé/public → tuile teintée (couleur dérivée du nom), façon
    // Linear/Notion : différencie chaque espace et le distingue d'un dossier.
    if (isTiledWorkspace(item)) {
      return <WorkspaceTile name={item.title || "?"} px={ICON_SIZE_PX[token]} />;
    }
    const dsIcon = getItemDsIcon(item);
    if (dsIcon) {
      return <DsIcon icon={dsIcon} size={token} />;
    }
  }

  const extendedIcon = getItemExtendedIcon(item, type);
  if (extendedIcon) {
    return <FileIconContent icon={extendedIcon} size={size} />;
  }
  return <FileIcon file={itemToPreviewFile(item)} size={size} />;
};

/** Un espace partagé/public (≠ espace perso, ≠ dossier imbriqué). */
const isTiledWorkspace = (item: Item): boolean =>
  item.type === ItemType.FOLDER &&
  itemIsWorkspace(item) &&
  getWorkspaceType(item) !== WorkspaceType.MAIN;

/**
 * Icône lucide (DS) pour un item, ou `null` pour les fichiers (qui retombent sur
 * les icônes de type MIME du ui-kit). Couvre espace perso, dossiers imbriqués et
 * fichiers suspects (les espaces partagés/publics sont rendus en tuile, cf.
 * `WorkspaceTile`).
 */
const getItemDsIcon = (item: Item): LucideIcon | null => {
  if (item.type === ItemType.FOLDER) {
    if (itemIsWorkspace(item)) {
      // Seul l'espace perso atteint ici (les autres → tuile).
      return House;
    }
    return Folder;
  }
  if (item.upload_state === ItemUploadState.SUSPICIOUS) {
    return ShieldAlert;
  }
  return null;
};

/** Teintes d'espaces, réparties sur la roue (oklch hue). */
const SPACE_HUES = [25, 60, 142, 192, 262, 296, 330];

/** Hue déterministe dérivé du nom de l'espace (stable entre rendus). */
const hueFromName = (name: string): number => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return SPACE_HUES[h % SPACE_HUES.length];
};

/** Tuile carrée teintée + glyphe d'espace, couleur dérivée du nom. */
const WorkspaceTile = ({ name, px }: { name: string; px: number }) => {
  const hue = hueFromName(name);
  const glyph = Math.round(px * 0.6);
  const radius = Math.max(4, Math.round(px * 0.28));
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      style={{
        width: px,
        height: px,
        borderRadius: radius,
        backgroundColor: `oklch(0.93 0.045 ${hue})`,
        color: `oklch(0.5 0.16 ${hue})`,
      }}
      aria-hidden
    >
      <Building2 size={glyph} strokeWidth={2.25} />
    </span>
  );
};

/**
 * The ui-kit already provides lots of icons for different mime types, but
 * on drive we support additional icons for suspicious items and folders.
 *
 * This function returns the appropriate icon for those extended cases, if
 * the item is not an extended case, it returns null. That way we can use the
 * ui-kit icon as a fallback.
 */
export const getItemExtendedIcon = (
  item: Item,
  type: "normal" | "mini",
): string | null => {
  if (item.type === ItemType.FOLDER) {
    // A workspace (root-level folder) gets a distinct icon from a nested folder.
    if (itemIsWorkspace(item)) {
      return getWorkspaceType(item) === WorkspaceType.PUBLIC
        ? folderPublicIcon.src
        : folderSharedIcon.src;
    }
    return folderIcon.src;
  }

  const uploadState = item.upload_state;
  if (uploadState === ItemUploadState.SUSPICIOUS) {
    return ICONS[type][MimeCategory.SUSPICIOUS];
  }

  return null;
};
