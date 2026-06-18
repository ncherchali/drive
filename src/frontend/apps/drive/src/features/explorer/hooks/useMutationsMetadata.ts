// Mutations de gouvernance des métadonnées (ADR-0001 phase 3 / provenance).
// Promouvoir (accepter) ou rejeter une proposition d'enrichissement. L'accept
// applique les valeurs dans les métadonnées autoritatives → invalide les deux.
import { getDriver } from "@/features/config/Config";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useMutationAcceptProposal = () => {
  const driver = getDriver();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { itemId: string; proposalId: string }) =>
      driver.acceptMetadataProposal(variables.itemId, variables.proposalId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["itemMetadataProposals", variables.itemId],
      });
      queryClient.invalidateQueries({
        queryKey: ["itemMetadata", variables.itemId],
      });
    },
  });
};

export const useMutationRejectProposal = () => {
  const driver = getDriver();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { itemId: string; proposalId: string }) =>
      driver.rejectMetadataProposal(variables.itemId, variables.proposalId),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["itemMetadataProposals", variables.itemId],
      }),
  });
};
