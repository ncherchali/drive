import { getDriver } from "@/features/config/Config";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Mutations for data rooms (H1.7).

export const useMutationSetDataRoom = () => {
  const driver = getDriver();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      itemId: string;
      settings: { allow_download: boolean };
    }) => driver.setItemDataRoom(variables.itemId, variables.settings),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["itemDataRoom", variables.itemId],
      }),
  });
};

export const useMutationDeleteDataRoom = () => {
  const driver = getDriver();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { itemId: string }) =>
      driver.deleteItemDataRoom(variables.itemId),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["itemDataRoom", variables.itemId],
      }),
  });
};
