import { APIError } from "@/features/api/APIError";
import { getDriver } from "@/features/config/Config";
import { ItemFilters } from "@/features/drivers/Driver";
import { Item } from "@/features/drivers/types";
import { HookUseQueryOptions } from "@/utils/useQueries";
import {
  useInfiniteQuery,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";

export const useFavoriteItems = () => {
  return useQuery({
    queryKey: ["items", "favorites"],
    queryFn: () => getDriver().getFavoriteItems(),
  });
};

export const useItemAccesses = (itemId: string) => {
  return useQuery({
    queryKey: ["itemAccesses", itemId],
    queryFn: () => getDriver().getItemAccesses(itemId),
    staleTime: 0,
    gcTime: 0,
  });
};

export const useItemAudit = (itemId: string, page: number = 1) => {
  return useQuery({
    queryKey: ["itemAudit", itemId, page],
    queryFn: () => getDriver().getItemAudit(itemId, page),
    staleTime: 0,
    gcTime: 0,
  });
};

export const useItemShareLinks = (itemId: string) => {
  return useQuery({
    queryKey: ["itemShareLinks", itemId],
    queryFn: () => getDriver().getItemShareLinks(itemId),
    staleTime: 0,
    gcTime: 0,
  });
};

export const useItemVersions = (itemId: string) => {
  return useQuery({
    queryKey: ["itemVersions", itemId],
    queryFn: () => getDriver().getItemVersions(itemId),
    staleTime: 0,
    gcTime: 0,
  });
};

export const useItemRetention = (itemId: string) => {
  return useQuery({
    queryKey: ["itemRetention", itemId],
    queryFn: () => getDriver().getItemRetention(itemId),
    staleTime: 0,
    gcTime: 0,
  });
};

export const useItemLegalHolds = (itemId: string) => {
  return useQuery({
    queryKey: ["itemLegalHolds", itemId],
    queryFn: () => getDriver().getItemLegalHolds(itemId),
    staleTime: 0,
    gcTime: 0,
  });
};

export const useItemDataRoom = (itemId: string) => {
  return useQuery({
    queryKey: ["itemDataRoom", itemId],
    queryFn: () => getDriver().getItemDataRoom(itemId),
    staleTime: 0,
    gcTime: 0,
  });
};

export const useItemSignatures = (itemId: string) => {
  return useQuery({
    queryKey: ["itemSignatures", itemId],
    queryFn: () => getDriver().getItemSignatures(itemId),
    staleTime: 0,
    gcTime: 0,
  });
};

export const useItemMetadata = (itemId: string) => {
  return useQuery({
    queryKey: ["itemMetadata", itemId],
    queryFn: () => getDriver().getItemMetadata(itemId),
    staleTime: 0,
    gcTime: 0,
  });
};

export const useItemContentType = (itemId: string) => {
  return useQuery({
    queryKey: ["itemContentType", itemId],
    queryFn: () => getDriver().getItemContentType(itemId),
    staleTime: 0,
    gcTime: 0,
  });
};

export const useItemMetadataProposals = (itemId: string) => {
  return useQuery({
    queryKey: ["itemMetadataProposals", itemId],
    queryFn: () => getDriver().getItemMetadataProposals(itemId),
    staleTime: 0,
    gcTime: 0,
  });
};

export const useItemManifest = (itemId: string) => {
  return useQuery({
    queryKey: ["itemManifest", itemId],
    queryFn: () => getDriver().getItemManifest(itemId),
    staleTime: 0,
    gcTime: 0,
  });
};

export const useContentObjectTypes = () => {
  return useQuery({
    queryKey: ["contentObjectTypes"],
    queryFn: () => getDriver().getContentObjectTypes(),
  });
};

export const useMetadataTemplates = () => {
  return useQuery({
    queryKey: ["metadataTemplates"],
    queryFn: () => getDriver().getMetadataTemplates(),
  });
};

export const useMetricsSummary = () => {
  return useQuery({
    queryKey: ["metricsSummary"],
    queryFn: () => getDriver().getMetricsSummary(),
    retry: false,
    refetchInterval: 30000,
  });
};

export const useInfiniteItemInvitations = (itemId: string) => {
  const driver = getDriver();
  return useInfiniteQuery({
    queryKey: ["itemInvitations", itemId],
    queryFn: () => driver.getItemInvitations(itemId),
    initialPageParam: 1,
    getNextPageParam(lastPage, allPages) {
      return lastPage.next ? allPages.length + 1 : undefined;
    },
  });
};

export const useFirstLevelItems = () => {
  return useQuery({
    queryKey: ["firstLevelItems"],
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: () => getRootItems(),
  });
};

export const useItems = () => {
  return useQuery({
    queryKey: ["items"],
    queryFn: () => getRootItems(),
  });
};

export const getRootItems = async (filters?: ItemFilters) => {
  const result = await getDriver().getItems(filters);
  return result.children;
};

export const useItem = (
  itemId: string,
  options?: HookUseQueryOptions<Item>,
): UseQueryResult<Item | undefined, APIError> => {
  return useQuery<Item, APIError>({
    queryKey: ["items", itemId],
    queryFn: () => getDriver().getItem(itemId),
    ...(options as Omit<
      UseQueryOptions<Item, APIError>,
      "queryKey" | "queryFn"
    >),
    placeholderData: (previousData) => previousData,
  });
};
