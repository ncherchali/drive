// Mutations du graphe de composition (ADR-0001 §5 / manifeste).
// Ajouter/retirer une partie d'un composite → invalide le manifeste.
import { getDriver } from "@/features/config/Config";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useMutationAddRelation = () => {
  const driver = getDriver();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      itemId: string;
      toItem: string;
      relationType: string;
      role?: string;
      order?: number;
      pinnedVersion?: string;
    }) =>
      driver.addItemRelation(variables.itemId, {
        to_item: variables.toItem,
        relation_type: variables.relationType,
        role: variables.role,
        order: variables.order,
        pinned_version: variables.pinnedVersion,
      }),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["itemManifest", variables.itemId],
      }),
  });
};

export const useMutationRemoveRelation = () => {
  const driver = getDriver();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { itemId: string; relationId: string }) =>
      driver.removeItemRelation(variables.itemId, variables.relationId),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["itemManifest", variables.itemId],
      }),
  });
};
