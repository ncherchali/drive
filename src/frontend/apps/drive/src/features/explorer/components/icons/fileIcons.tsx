// Icônes de type de fichier (mime) — Design System.
//
// Découplage FIDÈLE depuis @gouvfr-lasuite/ui-kit (preview/icons/FileIcon.tsx) :
// les 24 SVG mime ont été décodés depuis les data-URI du bundle ui-kit vers
// src/assets/files/icons/ et sont importés ici. Map ICONS + FileIcon/
// FileIconContent reproduits à l'identique. La taille est appliquée en width/
// height INLINE (auto-suffisant, indépendant des classes `icon--*` d'ui-kit).
import { MimeCategory, getMimeCategory, getExtensionFromName } from "@/features/explorer/utils/fileTypes";
import { IconSize, iconSizeMap } from "@/features/ui/components/icon/Icon";
import type { FilePreviewType } from "@/features/ui/preview/filePreviewType";

import mimeCalc from "@/assets/files/icons/mime-calc.svg";
import mimeDoc from "@/assets/files/icons/mime-doc.svg";
import mimeImage from "@/assets/files/icons/mime-image.svg";
import mimeOther from "@/assets/files/icons/mime-other.svg";
import mimePdf from "@/assets/files/icons/mime-pdf.svg";
import mimePowerpoint from "@/assets/files/icons/mime-powerpoint.svg";
import mimeAudio from "@/assets/files/icons/mime-audio.svg";
import mimeVideo from "@/assets/files/icons/mime-video.svg";
import mimeArchive from "@/assets/files/icons/mime-archive.svg";
import mimeSuspicious from "@/assets/files/icons/mime-suspicious.svg";
import mimeSqlite from "@/assets/files/icons/mime-sqlite.svg";
import mimeGrist from "@/assets/files/icons/mime-grist.svg";

import mimeCalcMini from "@/assets/files/icons/mime-calc-mini.svg";
import mimeDocMini from "@/assets/files/icons/mime-doc-mini.svg";
import mimeImageMini from "@/assets/files/icons/mime-image-mini.svg";
import mimeOtherMini from "@/assets/files/icons/mime-other-mini.svg";
import mimePdfMini from "@/assets/files/icons/mime-pdf-mini.svg";
import mimePowerpointMini from "@/assets/files/icons/mime-powerpoint-mini.svg";
import mimeAudioMini from "@/assets/files/icons/mime-audio-mini.svg";
import mimeVideoMini from "@/assets/files/icons/mime-video-mini.svg";
import mimeArchiveMini from "@/assets/files/icons/mime-archive-mini.svg";
import mimeSuspiciousMini from "@/assets/files/icons/mime-suspicious-mini.svg";
import mimeSqliteMini from "@/assets/files/icons/mime-sqlite-mini.svg";
import mimeGristMini from "@/assets/files/icons/mime-grist-mini.svg";

export const ICONS: Record<"mini" | "normal", Record<MimeCategory, string>> = {
  normal: {
    [MimeCategory.CALC]: mimeCalc.src,
    [MimeCategory.DOC]: mimeDoc.src,
    [MimeCategory.IMAGE]: mimeImage.src,
    [MimeCategory.OTHER]: mimeOther.src,
    [MimeCategory.PDF]: mimePdf.src,
    [MimeCategory.POWERPOINT]: mimePowerpoint.src,
    [MimeCategory.AUDIO]: mimeAudio.src,
    [MimeCategory.VIDEO]: mimeVideo.src,
    [MimeCategory.ARCHIVE]: mimeArchive.src,
    [MimeCategory.SUSPICIOUS]: mimeSuspicious.src,
    [MimeCategory.SQLITE]: mimeSqlite.src,
    [MimeCategory.GRIST]: mimeGrist.src,
  },
  mini: {
    [MimeCategory.CALC]: mimeCalcMini.src,
    [MimeCategory.DOC]: mimeDocMini.src,
    [MimeCategory.IMAGE]: mimeImageMini.src,
    [MimeCategory.OTHER]: mimeOtherMini.src,
    [MimeCategory.PDF]: mimePdfMini.src,
    [MimeCategory.POWERPOINT]: mimePowerpointMini.src,
    [MimeCategory.AUDIO]: mimeAudioMini.src,
    [MimeCategory.VIDEO]: mimeVideoMini.src,
    [MimeCategory.ARCHIVE]: mimeArchiveMini.src,
    [MimeCategory.SUSPICIOUS]: mimeSuspiciousMini.src,
    [MimeCategory.SQLITE]: mimeSqliteMini.src,
    [MimeCategory.GRIST]: mimeGristMini.src,
  },
};

const resolvePx = (size: IconSize | number): number =>
  typeof size === "number" ? size : (iconSizeMap[size] ?? 24);

export const FileIconContent = ({
  icon,
  size,
}: {
  icon: string;
  size: IconSize | number;
}) => {
  const px = resolvePx(size);
  return (
    <img
      src={icon}
      alt=""
      draggable="false"
      className="c__file-icon"
      style={{ width: `${px}px`, height: `${px}px` }}
    />
  );
};

type FileIconProps = {
  file: Partial<FilePreviewType> & Pick<FilePreviewType, "mimetype" | "title">;
  size?: IconSize | number;
  type?: "mini" | "normal";
};

export const FileIcon = ({
  file,
  size = IconSize.MEDIUM,
  type = "normal",
}: FileIconProps) => {
  const category = getMimeCategory(
    file.mimetype,
    getExtensionFromName(file.title),
  );
  return <FileIconContent icon={ICONS[type][category]} size={size} />;
};
