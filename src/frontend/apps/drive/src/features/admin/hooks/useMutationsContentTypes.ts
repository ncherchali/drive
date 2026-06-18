// Mutations CRUD du registre des types de contenu (console admin, ADR-0001).
// Réservé aux administrateurs côté serveur (le backend renvoie 403 sinon).
import { getDriver } from "@/features/config/Config";
import { ContentObjectTypeInput } from "@/features/drivers/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const useInvalidateTypes = () => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ["contentObjectTypes"] });
};

export const useMutationCreateContentType = () => {
  const driver = getDriver();
  const invalidate = useInvalidateTypes();
  return useMutation({
    mutationFn: (payload: ContentObjectTypeInput) =>
      driver.createContentObjectType(payload),
    onSuccess: invalidate,
    meta: { showErrorOn403: true },
  });
};

export const useMutationUpdateContentType = () => {
  const driver = getDriver();
  const invalidate = useInvalidateTypes();
  return useMutation({
    mutationFn: (variables: { key: string; payload: ContentObjectTypeInput }) =>
      driver.updateContentObjectType(variables.key, variables.payload),
    onSuccess: invalidate,
    meta: { showErrorOn403: true },
  });
};

export const useMutationDeleteContentType = () => {
  const driver = getDriver();
  const invalidate = useInvalidateTypes();
  return useMutation({
    mutationFn: (key: string) => driver.deleteContentObjectType(key),
    onSuccess: invalidate,
    meta: { showErrorOn403: true },
  });
};
