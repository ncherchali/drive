// Mutations CRUD du registre des politiques de rétention (console admin, E3.1).
// Réservé aux administrateurs côté serveur (le backend renvoie 403 sinon).
import { getDriver } from "@/features/config/Config";
import { RetentionPolicyInput } from "@/features/drivers/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const useInvalidatePolicies = () => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ["retentionPolicies"] });
};

export const useMutationCreatePolicy = () => {
  const driver = getDriver();
  const invalidate = useInvalidatePolicies();
  return useMutation({
    mutationFn: (payload: RetentionPolicyInput) =>
      driver.createRetentionPolicy(payload),
    onSuccess: invalidate,
    meta: { showErrorOn403: true },
  });
};

export const useMutationUpdatePolicy = () => {
  const driver = getDriver();
  const invalidate = useInvalidatePolicies();
  return useMutation({
    mutationFn: (variables: { key: string; payload: RetentionPolicyInput }) =>
      driver.updateRetentionPolicy(variables.key, variables.payload),
    onSuccess: invalidate,
    meta: { showErrorOn403: true },
  });
};

export const useMutationDeletePolicy = () => {
  const driver = getDriver();
  const invalidate = useInvalidatePolicies();
  return useMutation({
    mutationFn: (key: string) => driver.deleteRetentionPolicy(key),
    onSuccess: invalidate,
    meta: { showErrorOn403: true },
  });
};
