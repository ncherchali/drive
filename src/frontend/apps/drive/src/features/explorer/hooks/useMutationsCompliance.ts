import { getDriver } from "@/features/config/Config";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Mutations for compliance: retention & legal holds (H1.6).

export const useMutationSetRetention = () => {
  const driver = getDriver();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { itemId: string; durationDays: number }) =>
      driver.setItemRetention(variables.itemId, variables.durationDays),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["itemRetention", variables.itemId],
      }),
  });
};

export const useMutationPlaceLegalHold = () => {
  const driver = getDriver();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { itemId: string; reason: string }) =>
      driver.placeItemLegalHold(variables.itemId, variables.reason),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["itemLegalHolds", variables.itemId],
      }),
  });
};

export const useMutationReleaseLegalHold = () => {
  const driver = getDriver();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { itemId: string; holdId: string }) =>
      driver.releaseItemLegalHold(variables.itemId, variables.holdId),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["itemLegalHolds", variables.itemId],
      }),
  });
};
