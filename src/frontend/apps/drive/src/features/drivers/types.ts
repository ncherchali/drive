import type { TreeViewDataType } from "@/components/tree";
import { ColumnPreferences } from "../explorer/types/columns";

/**
 * Configuration d'un pied de page applicatif. Type local — anciennement
 * `FooterProps` de l'ui-kit DINUM (dépose totale, lot 6).
 */
type FooterLink = { label: string; href: string };
export type FooterProps = {
  externalLinks?: readonly FooterLink[];
  legalLinks?: readonly FooterLink[];
  license?: { label: string; link: FooterLink };
  logo?: { src: string; width?: string; height?: string; alt: string };
};

export enum ItemType {
  FILE = "file",
  FOLDER = "folder",
  // Objet structuré sans octets (ADR-0001 phase 4) : sa donnée = ses métadonnées.
  RECORD = "record",
}

export enum LinkReach {
  RESTRICTED = "restricted",
  AUTHENTICATED = "authenticated",
  PUBLIC = "public",
}

export enum LinkRole {
  READER = "reader",
  EDITOR = "editor",
}

export enum ItemUploadState {
  PENDING = "pending",
  DUPLICATING = "duplicating",
  ANALYZING = "analyzing",
  SUSPICIOUS = "suspicious",
  FILE_TOO_LARGE_TO_ANALYZE = "file_too_large_to_analyze",
  READY = "ready",
}

export type ItemBreadcrumb = {
  id: string;
  originalId?: string; // Used to identify all occurrences of the same item in the tree
  title: string;
  path: string;
  depth: number;
  main_workspace: boolean;
};

export type Item = {
  id: string;
  originalId?: string; // Used to identify all occurrences of the same item in the tree
  title: string;
  filename: string;
  creator: {
    id: string;
    full_name: string;
    short_name: string;
  };
  type: ItemType;
  ancestors_link_reach: LinkReach | null;
  ancestors_link_role: LinkRole | null;
  computed_link_reach: LinkReach | null;
  computed_link_role: LinkRole | null;
  deleted_at?: Date;
  upload_state: string;
  updated_at: Date;
  description: string;
  is_wopi_supported?: boolean;
  created_at: Date;
  is_favorite?: boolean;
  children?: Item[];
  parents?: Item[];
  breadcrumb?: ItemBreadcrumb[];
  numchild?: number;
  nb_accesses?: number;
  numchild_folder?: number;
  main_workspace?: boolean;
  path: string;
  url?: string;
  url_preview?: string;
  size?: number;
  mimetype?: string;
  user_roles?: Role[];
  user_role?: Role;
  link_reach?: LinkReach;
  link_role?: LinkRole;
  abilities: {
    accesses_manage: boolean;
    accesses_view: boolean;
    children_create: boolean;
    children_list: boolean;
    destroy: boolean;
    favorite: boolean;
    invite_owner: boolean;
    link_configuration: boolean;
    media_auth: boolean;
    move: boolean;
    link_select_options: Record<LinkReach, LinkRole[] | null>;
    partial_update: boolean;
    duplicate: boolean;
    restore: boolean;
    retrieve: boolean;
    tree: boolean;
    update: boolean;
    upload_ended: boolean;
  };
  policy?: string;
};

export type TreeItemData = Omit<Item, "children"> & {
  parentId?: string;
  /**
   * The original item ID (without tree path prefix).
   * Used to identify all occurrences of the same item in the tree.
   */
  originalId: string;
};

export type TreeItem = TreeViewDataType<TreeItemData>;

export type WopiInfo = {
  access_token: string;
  access_token_ttl: number;
  launch_url: string;
};

export type Access = {
  id: string;
  role: string;
  team: string;
  user: User;
  is_explicit: boolean;
  max_role: Role;
  max_ancestors_role: Role;
  max_ancestors_role_item_id: string;
  parent_id_max_role?: string; // Just for UI purposes
  item: {
    id: string;
    path: string;
    depth: number;
  };
  abilities: {
    destroy: boolean;
    partial_update: boolean;
    retrieve: boolean;
    set_role_to: Role[];
    update: boolean;
  };
};

export type Invitation = {
  team: string;
  user: User;
  id: string;
  role: Role;
  document: string;
  created_at: string;
  is_expired: boolean;
  issuer: string;
  email: string;
  abilities: {
    destroy: boolean;
    retrieve: boolean;
    partial_update: boolean;
    update: boolean;
  };
};

export enum Role {
  READER = "reader",
  EDITOR = "editor",
  ADMIN = "administrator",
  OWNER = "owner",
}

// Résumé des métriques de supervision (H1.9, staff).
export type MetricsSummary = {
  items_total: number;
  users_total: number;
  audit_events_total: number;
  legal_holds_active_total: number;
  data_rooms_total: number;
  celery_queue_length?: number;
};

export type User = {
  id: string;
  email: string;
  full_name: string;
  short_name: string;
  language: string;
  last_release_note_seen?: string | null;
  column_preferences?: ColumnPreferences | null;
};

export type AuditActorType = "user" | "system" | "api" | "anonymous";

// Une entrée du journal d'audit d'un item (A2-6). L'acteur est allégé
// (UserLightSerializer) et peut être null (action système/anonyme).
export type AuditEvent = {
  id: string;
  created_at: string;
  action: string;
  actor: Pick<User, "id" | "full_name" | "short_name"> | null;
  actor_type: AuditActorType;
  target_uuid: string | null;
  target_type: string;
  path_snapshot: string;
  metadata: Record<string, unknown>;
};

// Lien de partage avancé (H1.3) : token, mot de passe, expiration, plafond.
export type ShareLink = {
  id: string;
  token: string;
  role: string;
  has_password: boolean;
  expires_at: string | null;
  max_downloads: number | null;
  download_count: number;
  is_valid: boolean;
  created_at: string;
};

// Data room (H1.7) : réglages d'un espace view-only.
export type DataRoom = {
  id: string;
  allow_download: boolean;
  watermark_enabled: boolean;
  created_at: string;
};

// Conformité (H1.6) : rétention + legal holds.
export type RetentionStatus = {
  retention_until: string | null;
};

// Classification de sensibilité (p6 / ADR-0001 §5.4).
export type ClassificationLevel =
  | "public"
  | "internal"
  | "confidential"
  | "secret";

export type ClassificationStatus = {
  classification: ClassificationLevel | null;
  effective_classification: ClassificationLevel | null;
};

// Politique de rétention gouvernée (E3.1).
export type RetentionBasis = "creation" | "metadata_date";

export type RetentionPolicy = {
  id: string;
  key: string;
  name: string;
  duration_days: number;
  basis: RetentionBasis;
  metadata_template: string | null;
  metadata_field: string;
  is_active: boolean;
  description: string;
  created_at: string;
};

// Entrée d'écriture d'une politique de rétention (création / mise à jour).
export type RetentionPolicyInput = {
  key: string;
  name: string;
  duration_days: number;
  basis: RetentionBasis;
  metadata_template: string | null;
  metadata_field?: string;
  is_active?: boolean;
  description?: string;
};

// Accès effectif sur un composite (p4 / ADR-0001 §5.4).
export type AccessPolicyPart = {
  item_id: string;
  title: string;
  manifest_role: string;
  role: string | null;
  accessible: boolean;
};

export type AccessPolicy = {
  own_role: string | null;
  parts: AccessPolicyPart[];
  effective_role: string | null;
  fully_accessible: boolean;
  inaccessible_part_ids: string[];
};

export type LegalHold = {
  id: string;
  name: string;
  reason: string;
  is_active: boolean;
  created_at: string;
};

// Demande de signature électronique (H1.8).
export type SignatureRequest = {
  id: string;
  signer_email: string;
  status: "pending" | "signed" | "refused" | "cancelled";
  external_id: string;
  signed_at: string | null;
  created_at: string;
};

// Content Object Model (ADR-0001).
// Un champ typé d'un MetadataTemplate (E2.1).
export type TemplateField = {
  key: string;
  type: "string" | "number" | "boolean" | "date" | "enum";
  required?: boolean;
  options?: string[];
};

// Un schéma de métadonnées gouverné (E2.1).
export type MetadataTemplate = {
  id: string;
  key: string;
  name: string;
  fields: TemplateField[];
};

// Entrée d'écriture d'un template de métadonnées (création / mise à jour).
export type MetadataTemplateInput = {
  key: string;
  name: string;
  fields: TemplateField[];
};

// Type métier du registre (phases 1/4) + schéma de son template.
export type ContentObjectType = {
  id: string;
  key: string;
  label: string;
  base: ItemType;
  metadata_template: string | null;
  template_key: string | null;
  template_fields: TemplateField[];
  behavior_proxy: string;
  allowed_child_types: string[];
  required_roles: string[];
  is_active: boolean;
  description: string;
  created_at: string;
};

// Entrée d'écriture du registre (création / mise à jour d'un type).
export type ContentObjectTypeInput = {
  key: string;
  label: string;
  base: ItemType;
  metadata_template: string | null;
  behavior_proxy?: string;
  allowed_child_types?: string[];
  required_roles?: string[];
  is_active?: boolean;
  description?: string;
};

// Métadonnées gouvernées (E2.1) : instances par template, indexées par clé.
export type ItemMetadata = Record<string, Record<string, unknown>>;

// Type métier de l'objet de contenu (phases 1/4) ; null = simple fichier/dossier.
export type ContentTypeStatus = {
  content_type: string | null;
};

// Proposition d'enrichissement de métadonnées + provenance (phase 3, §6).
export type MetadataProposal = {
  id: string;
  template: string | null;
  template_key: string | null;
  values: Record<string, unknown>;
  source: "human" | "system" | "agent" | "extraction_job";
  source_ref: string;
  model: string;
  confidence: number | null;
  prompt: string;
  status: "proposed" | "accepted" | "rejected";
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
};

// Graphe de composition (ADR-0001 §5) : une arête / partie de manifeste.
export type ContentRelation = {
  id: string;
  to_item: string;
  to_item_title: string;
  to_item_missing: boolean;
  relation_type:
    | "part_of"
    | "references"
    | "derived_from"
    | "version_of"
    | "renders_to";
  role: string;
  order: number;
  pinned_version: string;
  created_at: string;
};

// Manifeste d'un document composé + état de complétude (§5.3/§5.4).
export type Manifest = {
  parts: ContentRelation[];
  required_roles: string[];
  present_roles: string[];
  missing_roles: string[];
  broken_part_ids: string[];
  complete: boolean;
};

// Une version S3 du fichier d'un item (H1.4).
export type ItemVersion = {
  version_id: string;
  last_modified: string;
  size: number;
  is_latest: boolean;
  etag: string;
};

// Réponse de la résolution publique d'un lien de partage.
export type ShareLinkResolution = {
  item: {
    id: string;
    title: string;
    filename: string | null;
    type: string;
  };
  role: string;
  download_url: string | null;
};

export type LocalizedThemeCustomization<T> = {
  default: T;
  [key: string]: T;
};

export interface ThemeCustomization {
  footer?: LocalizedThemeCustomization<FooterProps>;
}

export type ApiConfig = {
  DATA_UPLOAD_MAX_MEMORY_SIZE?: number;
  POSTHOG_KEY?: string;
  POSTHOG_HOST?: string;
  FRONTEND_MORE_LINK?: string;
  FRONTEND_FEEDBACK_BUTTON_SHOW?: boolean;
  FRONTEND_FEEDBACK_BUTTON_IDLE?: boolean;
  FRONTEND_FEEDBACK_ITEMS?: Record<string, { url: string }>;
  FRONTEND_FEEDBACK_MESSAGES_WIDGET_ENABLED?: boolean;
  FRONTEND_FEEDBACK_MESSAGES_WIDGET_API_URL?: string;
  FRONTEND_FEEDBACK_MESSAGES_WIDGET_CHANNEL?: string;
  FRONTEND_FEEDBACK_MESSAGES_WIDGET_PATH?: string;
  FRONTEND_THEME?: string;
  FRONTEND_HIDE_GAUFRE?: boolean;
  FRONTEND_SILENT_LOGIN_ENABLED?: boolean;
  FRONTEND_EXTERNAL_HOME_URL?: string;
  FRONTEND_RELEASE_NOTE_ENABLED?: boolean;
  FRONTEND_ENTITLEMENTS_DISCLAIMERS?: {
    "cannot_upload"?: {
      enabled: boolean;
      showPotentialOperators: boolean;
    };
  };
  FRONTEND_CSS_URL?: string;
  FRONTEND_JS_URL?: string;
  /** Bascules progressives du Design System (cf. useFeatureFlag). */
  FEATURES?: Record<string, boolean>;
  theme_customization?: ThemeCustomization;
};

export interface APIList<T> {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

export enum WorkspaceType {
  MAIN = "main",
  PUBLIC = "public",
  SHARED = "shared",
}
