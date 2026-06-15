// Catégorisation de type de fichier (mime) et nettoyage d'extension.
//
// Logique inlinée depuis @gouvfr-lasuite/ui-kit (preview/utils/mimeTypes.ts) pour
// la dépose totale — à l'identique (tables MIME + extensions connues). Les SVG
// d'icônes de fichier d'ui-kit ne sont PAS repris ici (l'icône de type est gérée
// par le système d'icônes DS, cf. ItemIcon).

export enum MimeCategory {
  CALC = "calc",
  DOC = "doc",
  IMAGE = "image",
  OTHER = "other",
  PDF = "pdf",
  POWERPOINT = "powerpoint",
  AUDIO = "audio",
  VIDEO = "video",
  ARCHIVE = "archive",
  SUSPICIOUS = "suspicious",
  SQLITE = "sqlite",
  GRIST = "grist",
}

const MIME_MAP: Partial<Record<MimeCategory, string[]>> = {
  [MimeCategory.CALC]: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.oasis.opendocument.spreadsheet",
    "text/csv",
  ],
  [MimeCategory.PDF]: ["application/pdf"],
  [MimeCategory.DOC]: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.oasis.opendocument.text",
  ],
  [MimeCategory.POWERPOINT]: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.oasis.opendocument.presentation",
  ],
  [MimeCategory.ARCHIVE]: [
    "application/zip",
    "application/x-7z-compressed",
    "application/x-rar-compressed",
    "application/x-tar",
    "application/x-rar",
    "application/octet-stream",
  ],
  [MimeCategory.SQLITE]: ["application/x-sqlite3", "application/vnd.sqlite3"],
};

const MIME_TO_CATEGORY: Record<string, MimeCategory> = {};
Object.entries(MIME_MAP).forEach(([category, mimes]) => {
  mimes?.forEach((mime) => {
    MIME_TO_CATEGORY[mime] = category as MimeCategory;
  });
});

const CALC_EXTENSIONS = ["numbers", "xlsx", "xls"];

const KNOWN_EXTENSIONS = new Set([
  "doc", "docx", "docm", "odt", "rtf", "txt", "pdf",
  "xls", "xlsx", "xlsm", "ods", "csv", "numbers",
  "ppt", "pptx", "pptm", "odp",
  "jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "ico",
  "tiff", "tif", "heic", "heif",
  "mp3", "wav", "flac", "aac", "ogg", "oga", "wma", "m4a",
  "mp4", "avi", "mov", "wmv", "flv", "webm", "mkv", "m4v", "3gp",
  "zip", "rar", "7z", "tar", "gz", "bz2", "xz",
  "db", "sqlite", "sqlite3", "grist",
  "html", "htm", "xml", "json", "js", "ts", "css", "scss",
  "py", "java", "cpp", "c", "h", "php", "rb", "go", "rs",
  "md", "yaml", "yml",
]);

export const getExtensionFromName = (str: string): string | null => {
  if (!str) {
    return null;
  }
  const parts = str.split(".");
  if (parts.length === 1) {
    return null;
  }
  return parts.pop()!;
};

export const getMimeCategory = (
  mimetype: string,
  extension?: string | null,
): MimeCategory => {
  // Certains fichiers calc ont un mime « archive » mais sont bien des calc.
  if (extension && CALC_EXTENSIONS.includes(extension)) {
    return MimeCategory.CALC;
  }
  if (mimetype === "application/vnd.sqlite3" && extension === "grist") {
    return MimeCategory.GRIST;
  }
  if (MIME_TO_CATEGORY[mimetype]) {
    return MIME_TO_CATEGORY[mimetype];
  }
  if (mimetype?.startsWith("image/")) {
    return MimeCategory.IMAGE;
  }
  if (mimetype?.startsWith("audio/")) {
    return MimeCategory.AUDIO;
  }
  if (mimetype?.startsWith("video/")) {
    return MimeCategory.VIDEO;
  }
  return MimeCategory.OTHER;
};

const isValidExtension = (extension: string): boolean => {
  if (!extension || extension.length === 0) {
    return false;
  }
  return KNOWN_EXTENSIONS.has(extension.toLowerCase());
};

/**
 * Retire l'extension d'un nom de fichier — uniquement si elle fait partie des
 * extensions connues (évite de tronquer un nom comme « rapport.2024 »).
 */
export const removeFileExtension = (filename: string): string => {
  if (!filename) {
    return filename;
  }
  if (filename.startsWith(".")) {
    return filename;
  }
  const extension = getExtensionFromName(filename);
  if (!extension) {
    return filename;
  }
  if (!isValidExtension(extension)) {
    return filename;
  }
  return filename.slice(0, -(extension.length + 1));
};
