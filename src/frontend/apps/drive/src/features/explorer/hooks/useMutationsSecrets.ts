// Mutations des secrets scellés (E4.1). La révélation renvoie le clair mais ne
// le met JAMAIS en cache (mutation, pas query) : la valeur reste éphémère.
import { getDriver } from "@/features/config/Config";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useMutationSetSecret = () => {
  const driver = getDriver();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { itemId: string; name: string; value: string }) =>
      driver.setItemSecret(variables.itemId, variables.name, variables.value),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["itemSecrets", variables.itemId],
      }),
  });
};

export const useMutationRevealSecret = () => {
  const driver = getDriver();
  return useMutation({
    mutationFn: (variables: { itemId: string; secretId: string }) =>
      driver.revealItemSecret(variables.itemId, variables.secretId),
  });
};

export const useMutationDeleteSecret = () => {
  const driver = getDriver();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { itemId: string; secretId: string }) =>
      driver.deleteItemSecret(variables.itemId, variables.secretId),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["itemSecrets", variables.itemId],
      }),
  });
};
