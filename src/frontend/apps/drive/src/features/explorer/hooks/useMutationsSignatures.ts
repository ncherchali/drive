import { getDriver } from "@/features/config/Config";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Mutations for e-signatures (H1.8).

const useInvalidateSignatures = () => {
  const queryClient = useQueryClient();
  return (itemId: string) =>
    queryClient.invalidateQueries({ queryKey: ["itemSignatures", itemId] });
};

export const useMutationRequestSignature = () => {
  const driver = getDriver();
  const invalidate = useInvalidateSignatures();
  return useMutation({
    mutationFn: (variables: { itemId: string; signerEmail: string }) =>
      driver.requestSignature(variables.itemId, variables.signerEmail),
    onSuccess: (_, variables) => invalidate(variables.itemId),
  });
};

export const useMutationCompleteSignature = () => {
  const driver = getDriver();
  const invalidate = useInvalidateSignatures();
  return useMutation({
    mutationFn: (variables: { itemId: string; requestId: string }) =>
      driver.completeSignature(variables.itemId, variables.requestId),
    onSuccess: (_, variables) => invalidate(variables.itemId),
  });
};

export const useMutationCancelSignature = () => {
  const driver = getDriver();
  const invalidate = useInvalidateSignatures();
  return useMutation({
    mutationFn: (variables: { itemId: string; requestId: string }) =>
      driver.cancelSignature(variables.itemId, variables.requestId),
    onSuccess: (_, variables) => invalidate(variables.itemId),
  });
};
