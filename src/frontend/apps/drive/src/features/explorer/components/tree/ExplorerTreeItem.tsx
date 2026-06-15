import {
  Item,
  ItemType,
  TreeItem,
  TreeItemData,
} from "@/features/drivers/types";
import {
  NodeRendererProps,
  TreeDataItem,
  TreeViewDataType,
  TreeViewItem,
  TreeViewNodeTypeEnum,
} from "@/components/tree";
import { DroppableNodeTree } from "./DroppableNodeTree";
import {
  NavigationEventType,
  useGlobalExplorer,
} from "../GlobalExplorerContext";
import { ExplorerTreeItemActions } from "./ExplorerTreeItemActions";
import { useRouter } from "next/router";
import { DefaultRoute } from "@/utils/defaultRoutes";
import { setFromRoute } from "../../utils/utils";
import { Folder as FolderIcon, Star } from "lucide-react";
import { Icon as DsIcon } from "@/components/ui/icon";

type ExplorerTreeItemProps = NodeRendererProps<TreeDataItem<TreeItem>>;

export const ExplorerTreeItem = ({ ...props }: ExplorerTreeItemProps) => {
  const { onNavigate, setPreviewItem, setPreviewItems } = useGlobalExplorer();
  const router = useRouter();

  const item: TreeViewDataType<TreeItemData> = props.node.data.value;

  return (
    <>
      <DroppableNodeTree id={props.node.id} item={item} nodeTree={props}>
        <TreeViewItem
          {...props}
          testId={`tree_item`}
          onClick={() => {
            if (
              item.nodeType === TreeViewNodeTypeEnum.NODE &&
              item.type === ItemType.FILE
            ) {
              setPreviewItems([item as Item]);
              setPreviewItem(item as Item);
              return;
            }
            if (item.nodeType === TreeViewNodeTypeEnum.SIMPLE_NODE) {
              if (item.id === DefaultRoute.FAVORITES) {
                router.push("/explorer/items/favorites");
              }
              return;
            }
            setFromRoute(DefaultRoute.FAVORITES);
            onNavigate({
              type: NavigationEventType.ITEM,
              item: item as Item,
            });
          }}
        >
          <div className="explorer__tree__item" data-testid="tree_item_content">
            <div className="explorer__tree__item__content">
              <ExplorerTreeItemIcon item={item} />
              {/* 
                We need to check the nodeType because the generic type T in TreeViewDataType 
                is only available for nodes of type NODE
              */}
              {item.nodeType === TreeViewNodeTypeEnum.NODE && (
                <span className="explorer__tree__item__title">
                  {item.title}
                </span>
              )}
              {item.nodeType === TreeViewNodeTypeEnum.SIMPLE_NODE && (
                <>
                  <DsIcon icon={Star} size="small" />
                  <span className="explorer__tree__item__title">
                    {item.label}
                  </span>
                </>
              )}
            </div>

            {item?.nodeType === TreeViewNodeTypeEnum.NODE && (
              <ExplorerTreeItemActions item={item as Item} />
            )}
          </div>
        </TreeViewItem>
      </DroppableNodeTree>
    </>
  );
};

export const ExplorerTreeItemIcon = ({
  item,
}: {
  item: TreeViewDataType<TreeItem>;
}) => {
  if (item.nodeType === TreeViewNodeTypeEnum.NODE) {
    return <DsIcon icon={FolderIcon} size="small" />;
  }

  return null;
};
