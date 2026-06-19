// Mutations CRUD des templates de métadonnées (console admin, E2.1).
// Réservé aux administrateurs côté serveur (le backend renvoie 403 sinon).
import { getDriver } from "@/features/config/Config";
import { MetadataTemplateInput } from "@/features/drivers/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const useInvalidateTemplates = () => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ["metadataTemplates"] });
};

export const useMutationCreateTemplate = () => {
  const driver = getDriver();
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: (payload: MetadataTemplateInput) =>
      driver.createMetadataTemplate(payload),
    onSuccess: invalidate,
    meta: { showErrorOn403: true },
  });
};

export const useMutationUpdateTemplate = () => {
  const driver = getDriver();
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: (variables: { key: string; payload: MetadataTemplateInput }) =>
      driver.updateMetadataTemplate(variables.key, variables.payload),
    onSuccess: invalidate,
    meta: { showErrorOn403: true },
  });
};

export const useMutationDeleteTemplate = () => {
  const driver = getDriver();
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: (key: string) => driver.deleteMetadataTemplate(key),
    onSuccess: invalidate,
    meta: { showErrorOn403: true },
  });
};
