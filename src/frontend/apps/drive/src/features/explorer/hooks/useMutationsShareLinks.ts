import { getDriver } from "@/features/config/Config";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Mutations for advanced share links (H1.3).

const useInvalidateShareLinks = () => {
  const queryClient = useQueryClient();
  return (itemId: string) =>
    queryClient.invalidateQueries({ queryKey: ["itemShareLinks", itemId] });
};

export const useMutationCreateShareLink = () => {
  const driver = getDriver();
  const invalidate = useInvalidateShareLinks();
  return useMutation({
    mutationFn: (...payload: Parameters<typeof driver.createShareLink>) =>
      driver.createShareLink(...payload),
    onSuccess: (_, variables) => invalidate(variables.itemId),
  });
};

export const useMutationDeleteShareLink = () => {
  const driver = getDriver();
  const invalidate = useInvalidateShareLinks();
  return useMutation({
    mutationFn: (...payload: Parameters<typeof driver.deleteShareLink>) =>
      driver.deleteShareLink(...payload),
    onSuccess: (_, variables) => invalidate(variables.itemId),
  });
};
