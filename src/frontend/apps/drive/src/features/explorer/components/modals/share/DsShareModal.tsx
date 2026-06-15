// Modale de partage native — Design System (remplace le `ShareModal` de l'ui-kit
// DINUM, dépose totale, lot 8/ShareModal). Réutilise toute la logique RBAC câblée
// par ItemShareModal (accès, invitations, rôles, réglages de lien) et ne fournit
// QUE le rendu : Dialog DS + sections invitation / membres / lien / copie.
//
// Pages Router : pas de "use client".
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Trash2, X } from "lucide-react";
import { Access, Invitation, Role, User } from "@/features/drivers/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ShareRoleOption = {
  value?: string;
  label?: string;
  isDisabled?: boolean;
  subText?: string;
};

export type DsShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  modalTitle: string;
  loading?: boolean;
  canUpdate?: boolean;
  accesses: Access[];
  invitations: Invitation[];
  invitationRoles: ShareRoleOption[];
  onSearchUsers: (search: string) => void;
  searchUsersResult?: User[];
  onInviteUser: (users: User[], role: string) => void;
  onUpdateAccess: (access: Access, role: string) => void;
  onDeleteAccess: (access: Access) => void;
  onUpdateInvitation: (invitation: Invitation, role: string) => void;
  onDeleteInvitation: (invitation: Invitation) => void;
  getAccessRoles: (access: Access) => ShareRoleOption[];
  accessRoleTopMessage?: (access: Access) => React.ReactNode;
  accessRoleKey?: "role" | "max_role";
  linkSettings?: boolean;
  linkReach?: string;
  linkRole?: string;
  linkReachChoices: ShareRoleOption[];
  linkRoleChoices: ShareRoleOption[];
  showLinkRole?: boolean;
  topLinkReachMessage?: React.ReactNode;
  topLinkRoleMessage?: React.ReactNode;
  onUpdateLinkReach: (value: string) => void;
  onUpdateLinkRole: (value: string) => void;
  outsideSearchContent?: React.ReactNode;
  children?: React.ReactNode;
};

/** Sélecteur de rôle DS data-driven (réutilisé membres/invitations/lien). */
const RoleSelect = ({
  value,
  options,
  onChange,
  disabled,
  ariaLabel,
  triggerClassName,
}: {
  value?: string;
  options: ShareRoleOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel: string;
  triggerClassName?: string;
}) => (
  <Select value={value} onValueChange={onChange} disabled={disabled}>
    <SelectTrigger
      className={triggerClassName ?? "h-8 min-w-32"}
      aria-label={ariaLabel}
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem
          key={option.value}
          value={option.value ?? ""}
          disabled={option.isDisabled}
        >
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export const DsShareModal = ({
  isOpen,
  onClose,
  modalTitle,
  loading,
  canUpdate,
  accesses,
  invitations,
  invitationRoles,
  onSearchUsers,
  searchUsersResult,
  onInviteUser,
  onUpdateAccess,
  onDeleteAccess,
  onUpdateInvitation,
  onDeleteInvitation,
  getAccessRoles,
  accessRoleTopMessage,
  accessRoleKey = "max_role",
  linkSettings,
  linkReach,
  linkRole,
  linkReachChoices,
  linkRoleChoices,
  showLinkRole,
  topLinkReachMessage,
  topLinkRoleMessage,
  onUpdateLinkReach,
  onUpdateLinkRole,
  outsideSearchContent,
  children,
}: DsShareModalProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
        <DialogHeader className="px-5 pb-3 pt-5">
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>

        {canUpdate && (
          <div className="px-5 pb-3">
            <InviteSection
              roles={invitationRoles}
              loading={loading}
              onSearchUsers={onSearchUsers}
              searchUsersResult={searchUsersResult}
              onInviteUser={onInviteUser}
            />
          </div>
        )}

        <Separator />

        <div className="max-h-[40vh] overflow-y-auto px-5 py-2">
          {accesses.map((access) => {
            const topMessage = accessRoleTopMessage?.(access);
            return (
              <div key={access.id} className="py-1.5">
                <MemberLine
                  name={access.user.full_name || access.user.email}
                  email={access.user.email}
                  right={
                    canUpdate && access.abilities.update ? (
                      <RoleSelect
                        ariaLabel={t("explorer.actions.share.modal.role")}
                        value={access[accessRoleKey] as string}
                        options={getAccessRoles(access)}
                        onChange={(role) => onUpdateAccess(access, role)}
                      />
                    ) : (
                      <RoleBadge
                        roles={getAccessRoles(access)}
                        value={access[accessRoleKey] as string}
                      />
                    )
                  }
                  onDelete={
                    canUpdate && access.abilities.destroy
                      ? () => onDeleteAccess(access)
                      : undefined
                  }
                />
                {topMessage && (
                  <p className="ps-10 text-xs text-muted-foreground">
                    {topMessage}
                  </p>
                )}
              </div>
            );
          })}

          {invitations.map((invitation) => (
            <div key={invitation.id} className="py-1.5">
              <MemberLine
                name={invitation.email}
                badge={t("explorer.actions.share.modal.pending", "En attente")}
                right={
                  canUpdate ? (
                    <RoleSelect
                      ariaLabel={t("explorer.actions.share.modal.role")}
                      value={invitation.role}
                      options={invitationRoles}
                      onChange={(role) => onUpdateInvitation(invitation, role)}
                    />
                  ) : (
                    <RoleBadge roles={invitationRoles} value={invitation.role} />
                  )
                }
                onDelete={
                  canUpdate && invitation.abilities.destroy
                    ? () => onDeleteInvitation(invitation)
                    : undefined
                }
              />
            </div>
          ))}
        </div>

        {linkSettings && (
          <>
            <Separator />
            <div className="space-y-2 px-5 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">
                  {t("share_modal.link_settings.title", "Accès par lien")}
                </span>
                <RoleSelect
                  ariaLabel={t("share_modal.link_settings.reach", "Visibilité")}
                  value={linkReach}
                  options={linkReachChoices}
                  onChange={onUpdateLinkReach}
                />
              </div>
              {topLinkReachMessage && (
                <div className="text-xs text-muted-foreground">
                  {topLinkReachMessage}
                </div>
              )}
              {showLinkRole && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    {t("share_modal.link_settings.role", "Droits")}
                  </span>
                  <RoleSelect
                    ariaLabel={t("share_modal.link_settings.role", "Droits")}
                    value={linkRole}
                    options={linkRoleChoices}
                    onChange={onUpdateLinkRole}
                  />
                </div>
              )}
              {topLinkRoleMessage && (
                <div className="text-xs text-muted-foreground">
                  {topLinkRoleMessage}
                </div>
              )}
            </div>
          </>
        )}

        {children}
        {outsideSearchContent}
      </DialogContent>
    </Dialog>
  );
};

/** Ligne « membre » : avatar + nom/email (+ badge), action de rôle, suppression. */
const MemberLine = ({
  name,
  email,
  badge,
  right,
  onDelete,
}: {
  name: string;
  email?: string;
  badge?: string;
  right: React.ReactNode;
  onDelete?: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} className="size-8 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{name}</span>
          {badge && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        {email && email !== name && (
          <span className="block truncate text-xs text-muted-foreground">
            {email}
          </span>
        )}
      </div>
      {right}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("explorer.actions.share.modal.remove", "Retirer")}
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
};

/** Affichage statique du rôle (lecture seule). */
const RoleBadge = ({
  roles,
  value,
}: {
  roles: ShareRoleOption[];
  value?: string;
}) => {
  const label = roles.find((role) => role.value === value)?.label ?? value;
  return <span className="px-2 text-sm text-muted-foreground">{label}</span>;
};

/** Section d'invitation : recherche d'utilisateurs, sélection multiple, rôle. */
const InviteSection = ({
  roles,
  loading,
  onSearchUsers,
  searchUsersResult,
  onInviteUser,
}: {
  roles: ShareRoleOption[];
  loading?: boolean;
  onSearchUsers: (search: string) => void;
  searchUsersResult?: User[];
  onInviteUser: (users: User[], role: string) => void;
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<User[]>([]);
  const [role, setRole] = React.useState<string>(
    (roles[0]?.value as string) ?? Role.READER,
  );

  const suggestions = (searchUsersResult ?? []).filter(
    (user) => !selected.some((s) => s.id === user.id),
  );

  const addUser = (user: User) => {
    setSelected((prev) => [...prev, user]);
    setQuery("");
    onSearchUsers("");
  };

  const removeUser = (user: User) => {
    setSelected((prev) => prev.filter((s) => s.id !== user.id));
  };

  const invite = () => {
    if (selected.length === 0) return;
    onInviteUser(selected, role);
    setSelected([]);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {selected.map((user) => (
          <span
            key={user.id}
            className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs"
          >
            {user.full_name || user.email}
            <button
              type="button"
              aria-label={t("explorer.actions.share.modal.remove", "Retirer")}
              onClick={() => removeUser(user)}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Input
            value={query}
            placeholder={t(
              "explorer.actions.share.modal.search_placeholder",
              "Ajouter des personnes par e-mail",
            )}
            onChange={(e) => {
              setQuery(e.target.value);
              onSearchUsers(e.target.value);
            }}
          />
          {query !== "" && (suggestions.length > 0 || loading) && (
            <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md">
              {loading && (
                <div className="flex items-center justify-center p-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                </div>
              )}
              {suggestions.map((user) => (
                <button
                  type="button"
                  key={user.id}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-start text-sm hover:bg-accent"
                  onClick={() => addUser(user)}
                >
                  <Avatar
                    name={user.full_name || user.email}
                    className="size-6 text-xs"
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {user.full_name || user.email}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <RoleSelect
          ariaLabel={t("explorer.actions.share.modal.role")}
          value={role}
          options={roles}
          onChange={setRole}
          triggerClassName="h-9 w-32 shrink-0"
        />
        <Button onClick={invite} disabled={selected.length === 0}>
          {t("explorer.actions.share.modal.invite", "Inviter")}
        </Button>
      </div>
    </div>
  );
};
