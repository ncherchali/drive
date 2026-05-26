import { Item, ItemType } from "./types";

export const itemIsWorkspace = (item: Item) => {
  if (item.main_workspace) {
    return false;
  }
  // `path` can be missing on partial items (loading placeholders, breadcrumb
  // entries…). Treat such items as non-workspaces rather than crashing.
  return item.type === ItemType.FOLDER && (item.path?.split(".").length ?? 0) === 1;
};
