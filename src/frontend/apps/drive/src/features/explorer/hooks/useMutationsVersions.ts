import { getDriver } from "@/features/config/Config";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Mutations for file versions (H1.4).

const useInvalidateVersions = () => {
  const queryClient = useQueryClient();
  return (itemId: string) =>
    queryClient.invalidateQueries({ queryKey: ["itemVersions", itemId] });
};

export const useMutationRestoreVersion = () => {
  const driver = getDriver();
  const invalidate = useInvalidateVersions();
  return useMutation({
    mutationFn: (variables: { itemId: string; versionId: string }) =>
      driver.restoreItemVersion(variables.itemId, variables.versionId),
    onSuccess: (_, variables) => invalidate(variables.itemId),
  });
};

export const useMutationDeleteVersion = () => {
  const driver = getDriver();
  const invalidate = useInvalidateVersions();
  return useMutation({
    mutationFn: (variables: { itemId: string; versionId: string }) =>
      driver.deleteItemVersion(variables.itemId, variables.versionId),
    onSuccess: (_, variables) => invalidate(variables.itemId),
  });
};
