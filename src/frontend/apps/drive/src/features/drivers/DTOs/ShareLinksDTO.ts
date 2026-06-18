// DTOs for advanced share links (H1.3).

export type DTOCreateShareLink = {
  itemId: string;
  role?: string;
  password?: string | null;
  expires_at?: string | null;
  max_downloads?: number | null;
};

export type DTODeleteShareLink = {
  itemId: string;
  linkId: string;
};
