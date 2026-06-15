// Shim DS remplaçant `useModal` de l'ui-kit DINUM. Même forme de retour
// ({ isOpen, open, close, onClose }) pour rester un drop-in : les composants
// qui reçoivent `{...modal}` continuent de fonctionner sans changement.
import { useCallback, useState } from "react";

export interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Alias de `close` (compat ascendante avec l'API Cunningham). */
  onClose: () => void;
}

export const useModal = ({
  isOpenDefault = false,
}: { isOpenDefault?: boolean } = {}): UseModalReturn => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  return { isOpen, open, close, onClose: close };
};
