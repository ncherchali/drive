import * as React from "react";

/**
 * État d'ouverture pour modales/popovers (remplace le `useModal` de Cunningham).
 * `open`/`setOpen` se branchent directement sur les props contrôlées de Radix
 * (Dialog, AlertDialog…).
 */
export function useDisclosure(initial = false) {
  const [open, setOpen] = React.useState(initial);
  const onOpen = React.useCallback(() => setOpen(true), []);
  const onClose = React.useCallback(() => setOpen(false), []);
  const onToggle = React.useCallback(() => setOpen((v) => !v), []);
  return { open, setOpen, onOpen, onClose, onToggle };
}
