import { APIError } from "@/features/api/APIError";
import { fetchAPI } from "@/features/api/fetchApi";
import {
  Driver,
  Entitlements,
  ItemFilters,
  UserFilters,
  PaginatedChildrenResult,
} from "../Driver";
import {
  DTODeleteInvitation,
  DTOCreateInvitation,
  DTOUpdateInvitation,
} from "../DTOs/InvitationDTO";
import {
  DTOCreateAccess,
  DTOUpdateLinkConfiguration,
} from "../DTOs/AccessesDTO";
import { DTOUpdateAccess } from "../DTOs/AccessesDTO";
import { DTOCreateShareLink, DTODeleteShareLink } from "../DTOs/ShareLinksDTO";
import {
  Access,
  ApiConfig,
  APIList,
  AuditEvent,
  Invitation,
  AccessPolicy,
  ClassificationLevel,
  ClassificationStatus,
  ContentObjectType,
  ContentObjectTypeInput,
  ContentRelation,
  ContentTypeStatus,
  DataRoom,
  Item,
  ItemBreadcrumb,
  ItemMetadata,
  ItemType,
  ItemVersion,
  LegalHold,
  Manifest,
  MetadataProposal,
  MetadataTemplate,
  MetadataTemplateInput,
  MetricsSummary,
  RetentionPolicy,
  RetentionPolicyInput,
  RetentionStatus,
  ShareLink,
  ShareLinkResolution,
  SignatureRequest,
  User,
  WopiInfo,
} from "../types";
import { DTODeleteAccess } from "../DTOs/AccessesDTO";

export class StandardDriver extends Driver {
  async getConfig(): Promise<ApiConfig> {
    const response = await fetchAPI(`config/`);
    const data = await response.json();
    return data;
  }

  async getItems(filters: ItemFilters = {}): Promise<PaginatedChildrenResult> {
    const params = {
      page: 1,
      page_size: 100,
      ...(filters ? filters : {}),
    };
    const response = await fetchAPI(`items/`, {
      params,
    });
    const data = await response.json();
    return {
      children: jsonToItems(data.results),
      pagination: {
        currentPage: filters.page ?? 1,
        totalCount: data.count,
        hasMore: data.next !== null,
      },
    };
  }

  async getItemBreadcrumb(id: string): Promise<ItemBreadcrumb[]> {
    const response = await fetchAPI(`items/${id}/breadcrumb/`);
    const data = await response.json();
    return data;
  }

  async searchItems(filters?: ItemFilters): Promise<Item[]> {
    const response = await fetchAPI(`items/search/`, {
      params: filters,
    });
    const data = await response.json();
    return jsonToItems(data.results);
  }

  async getTrashItems(filters?: ItemFilters): Promise<Item[]> {
    const response = await fetchAPI(`items/trashbin/`, {
      params: { ...filters, page_size: 200 },
    });
    const data = await response.json();
    return jsonToItems(data.results);
  }

  async getItem(id: string): Promise<Item> {
    const response = await fetchAPI(`items/${id}/`);
    const data = await response.json();
    return jsonToItem(data);
  }

  async updateItem(item: Partial<Item>): Promise<Item> {
    const response = await fetchAPI(`items/${item.id}/`, {
      method: "PATCH",
      body: JSON.stringify(item),
    });
    const data = await response.json();
    return jsonToItem(data);
  }

  async restoreItems(ids: string[]): Promise<void> {
    for (const id of ids) {
      await fetchAPI(`items/${id}/restore/`, {
        method: "POST",
      });
    }
  }

  async getUsers(filters?: UserFilters): Promise<User[]> {
    const response = await fetchAPI(`users/`, {
      params: filters,
    });
    const data = await response.json();
    return data;
  }

  async updateUser(payload: Partial<User> & { id: string }): Promise<User> {
    const response = await fetchAPI(`users/${payload.id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  }

  async getChildren(
    id: string,
    filters?: ItemFilters,
  ): Promise<PaginatedChildrenResult> {
    const params = {
      page: 1,
      page_size: filters?.page_size || 200,
      ...(filters ? filters : {}),
    };

    const response = await fetchAPI(`items/${id}/children/`, {
      params,
    });
    const data = await response.json();

    return {
      children: jsonToItems(data.results),
      pagination: {
        currentPage: params.page,
        totalCount: data.count,
        hasMore: data.next !== null,
      },
    };
  }

  async getTree(id: string): Promise<Item> {
    const response = await fetchAPI(`items/${id}/tree/`);
    const data = await response.json();
    return jsonToItem(data);
  }

  async moveItem(id: string, parentId?: string): Promise<void> {
    const payload = {
      ...(parentId ? { target_item_id: parentId } : {}),
    };
    await fetchAPI(`items/${id}/move/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getItemAccesses(itemId: string): Promise<Access[]> {
    const response = await fetchAPI(`items/${itemId}/accesses/`);
    const data = await response.json();
    return data;
  }

  async getItemAudit(
    itemId: string,
    page: number = 1,
  ): Promise<APIList<AuditEvent>> {
    const response = await fetchAPI(`items/${itemId}/audit/`, {
      params: { page, page_size: 50 },
    });
    return await response.json();
  }

  async getItemShareLinks(itemId: string): Promise<ShareLink[]> {
    const response = await fetchAPI(`items/${itemId}/share-links/`);
    return await response.json();
  }

  async createShareLink(data: DTOCreateShareLink): Promise<ShareLink> {
    const response = await fetchAPI(`items/${data.itemId}/share-links/`, {
      method: "POST",
      body: JSON.stringify({
        role: data.role,
        password: data.password,
        expires_at: data.expires_at,
        max_downloads: data.max_downloads,
      }),
    });
    return await response.json();
  }

  async deleteShareLink(payload: DTODeleteShareLink): Promise<void> {
    await fetchAPI(`items/${payload.itemId}/share-links/${payload.linkId}/`, {
      method: "DELETE",
    });
  }

  async resolveShareLink(
    token: string,
    password?: string,
  ): Promise<ShareLinkResolution> {
    const response = await fetchAPI(`share-links/resolve/`, {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
    return await response.json();
  }

  async getItemVersions(itemId: string): Promise<ItemVersion[]> {
    const response = await fetchAPI(`items/${itemId}/versions/`);
    return await response.json();
  }

  async getItemVersionDownloadUrl(
    itemId: string,
    versionId: string,
  ): Promise<string> {
    const response = await fetchAPI(`items/${itemId}/versions/${versionId}/`);
    const data = await response.json();
    return data.url;
  }

  async restoreItemVersion(itemId: string, versionId: string): Promise<void> {
    await fetchAPI(`items/${itemId}/versions/${versionId}/restore/`, {
      method: "POST",
    });
  }

  async deleteItemVersion(itemId: string, versionId: string): Promise<void> {
    await fetchAPI(`items/${itemId}/versions/${versionId}/`, {
      method: "DELETE",
    });
  }

  async getItemRetention(itemId: string): Promise<RetentionStatus> {
    const response = await fetchAPI(`items/${itemId}/retention/`);
    return await response.json();
  }

  async setItemRetention(
    itemId: string,
    durationDays: number,
  ): Promise<RetentionStatus> {
    const response = await fetchAPI(`items/${itemId}/retention/`, {
      method: "POST",
      body: JSON.stringify({ duration_days: durationDays }),
    });
    return await response.json();
  }

  async getItemLegalHolds(itemId: string): Promise<LegalHold[]> {
    const response = await fetchAPI(`items/${itemId}/legal-hold/`);
    return await response.json();
  }

  async getItemClassification(itemId: string): Promise<ClassificationStatus> {
    const response = await fetchAPI(`items/${itemId}/classification/`);
    return await response.json();
  }

  async setItemClassification(
    itemId: string,
    level: ClassificationLevel | null,
  ): Promise<ClassificationStatus> {
    const response = await fetchAPI(`items/${itemId}/classification/`, {
      method: "POST",
      body: JSON.stringify({ classification: level }),
    });
    return await response.json();
  }

  async getRetentionPolicies(): Promise<RetentionPolicy[]> {
    const response = await fetchAPI(`retention-policies/`);
    return await response.json();
  }

  async createRetentionPolicy(
    payload: RetentionPolicyInput,
  ): Promise<RetentionPolicy> {
    const response = await fetchAPI(`retention-policies/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return await response.json();
  }

  async updateRetentionPolicy(
    key: string,
    payload: RetentionPolicyInput,
  ): Promise<RetentionPolicy> {
    const response = await fetchAPI(`retention-policies/${key}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return await response.json();
  }

  async deleteRetentionPolicy(key: string): Promise<void> {
    await fetchAPI(`retention-policies/${key}/`, { method: "DELETE" });
  }

  async applyRetentionPolicy(
    itemId: string,
    policyKey: string,
  ): Promise<RetentionStatus> {
    const response = await fetchAPI(`items/${itemId}/apply-retention-policy/`, {
      method: "POST",
      body: JSON.stringify({ policy: policyKey }),
    });
    return await response.json();
  }

  async getItemAccessPolicy(itemId: string): Promise<AccessPolicy> {
    const response = await fetchAPI(`items/${itemId}/access-policy/`);
    return await response.json();
  }

  async getItemsClassifications(
    ids: string[],
  ): Promise<Record<string, ClassificationLevel | null>> {
    if (ids.length === 0) {
      return {};
    }
    const response = await fetchAPI(`items/classifications/`, {
      params: { ids: ids.join(",") },
    });
    return await response.json();
  }

  async placeItemLegalHold(itemId: string, reason: string): Promise<LegalHold> {
    const response = await fetchAPI(`items/${itemId}/legal-hold/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    return await response.json();
  }

  async releaseItemLegalHold(itemId: string, holdId: string): Promise<void> {
    await fetchAPI(`items/${itemId}/legal-hold/${holdId}/`, {
      method: "DELETE",
    });
  }

  async getItemDataRoom(itemId: string): Promise<DataRoom | null> {
    try {
      const response = await fetchAPI(`items/${itemId}/data-room/`, undefined, {
        redirectOn40x: false,
      });
      return await response.json();
    } catch (error) {
      if (error instanceof APIError && error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  async setItemDataRoom(
    itemId: string,
    settings: { allow_download: boolean },
  ): Promise<DataRoom> {
    const response = await fetchAPI(`items/${itemId}/data-room/`, {
      method: "POST",
      body: JSON.stringify(settings),
    });
    return await response.json();
  }

  async deleteItemDataRoom(itemId: string): Promise<void> {
    await fetchAPI(`items/${itemId}/data-room/`, { method: "DELETE" });
  }

  async getMetricsSummary(): Promise<MetricsSummary> {
    const response = await fetchAPI(`metrics/summary/`);
    return await response.json();
  }

  async getItemSignatures(itemId: string): Promise<SignatureRequest[]> {
    const response = await fetchAPI(`items/${itemId}/signatures/`);
    return await response.json();
  }

  async requestSignature(
    itemId: string,
    signerEmail: string,
  ): Promise<SignatureRequest> {
    const response = await fetchAPI(`items/${itemId}/signatures/`, {
      method: "POST",
      body: JSON.stringify({ signer_email: signerEmail }),
    });
    return await response.json();
  }

  async completeSignature(
    itemId: string,
    requestId: string,
  ): Promise<SignatureRequest> {
    const response = await fetchAPI(
      `items/${itemId}/signatures/${requestId}/complete/`,
      { method: "POST" },
    );
    return await response.json();
  }

  async cancelSignature(itemId: string, requestId: string): Promise<void> {
    await fetchAPI(`items/${itemId}/signatures/${requestId}/`, {
      method: "DELETE",
    });
  }

  // Content object model (ADR-0001)
  async getItemMetadata(itemId: string): Promise<ItemMetadata> {
    const response = await fetchAPI(`items/${itemId}/metadata/`);
    return await response.json();
  }

  async getItemContentType(itemId: string): Promise<ContentTypeStatus> {
    const response = await fetchAPI(`items/${itemId}/content-type/`);
    return await response.json();
  }

  async getItemMetadataProposals(itemId: string): Promise<MetadataProposal[]> {
    const response = await fetchAPI(`items/${itemId}/metadata-proposals/`);
    return await response.json();
  }

  async acceptMetadataProposal(
    itemId: string,
    proposalId: string,
  ): Promise<MetadataProposal> {
    const response = await fetchAPI(
      `items/${itemId}/metadata-proposals/${proposalId}/accept/`,
      { method: "POST" },
    );
    return await response.json();
  }

  async rejectMetadataProposal(
    itemId: string,
    proposalId: string,
  ): Promise<MetadataProposal> {
    const response = await fetchAPI(
      `items/${itemId}/metadata-proposals/${proposalId}/reject/`,
      { method: "POST" },
    );
    return await response.json();
  }

  async getItemManifest(itemId: string): Promise<Manifest> {
    const response = await fetchAPI(`items/${itemId}/manifest/`);
    return await response.json();
  }

  async addItemRelation(
    itemId: string,
    payload: {
      to_item: string;
      relation_type: string;
      role?: string;
      order?: number;
      pinned_version?: string;
    },
  ): Promise<ContentRelation> {
    const response = await fetchAPI(`items/${itemId}/relations/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return await response.json();
  }

  async removeItemRelation(itemId: string, relationId: string): Promise<void> {
    await fetchAPI(`items/${itemId}/relations/${relationId}/`, {
      method: "DELETE",
    });
  }

  async getContentObjectTypes(): Promise<ContentObjectType[]> {
    const response = await fetchAPI(`content-object-types/`);
    return await response.json();
  }

  async getMetadataTemplates(): Promise<MetadataTemplate[]> {
    const response = await fetchAPI(`metadata-templates/`);
    return await response.json();
  }

  async createMetadataTemplate(
    payload: MetadataTemplateInput,
  ): Promise<MetadataTemplate> {
    const response = await fetchAPI(`metadata-templates/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return await response.json();
  }

  async updateMetadataTemplate(
    key: string,
    payload: MetadataTemplateInput,
  ): Promise<MetadataTemplate> {
    const response = await fetchAPI(`metadata-templates/${key}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return await response.json();
  }

  async deleteMetadataTemplate(key: string): Promise<void> {
    await fetchAPI(`metadata-templates/${key}/`, { method: "DELETE" });
  }

  async createContentObjectType(
    payload: ContentObjectTypeInput,
  ): Promise<ContentObjectType> {
    const response = await fetchAPI(`content-object-types/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return await response.json();
  }

  async updateContentObjectType(
    key: string,
    payload: ContentObjectTypeInput,
  ): Promise<ContentObjectType> {
    const response = await fetchAPI(`content-object-types/${key}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return await response.json();
  }

  async deleteContentObjectType(key: string): Promise<void> {
    await fetchAPI(`content-object-types/${key}/`, { method: "DELETE" });
  }

  async createRecord(data: {
    parentId: string;
    title: string;
    content_type?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Item> {
    const { parentId, ...body } = data;
    const response = await fetchAPI(`items/${parentId}/records/`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return jsonToItem(await response.json());
  }

  async createAccess(data: DTOCreateAccess): Promise<void> {
    await fetchAPI(`items/${data.itemId}/accesses/`, {
      method: "POST",
      body: JSON.stringify({
        user_id: data.userId,
        role: data.role,
      }),
    });
  }

  async deleteAccess(payload: DTODeleteAccess): Promise<void> {
    await fetchAPI(`items/${payload.itemId}/accesses/${payload.accessId}/`, {
      method: "DELETE",
    });
  }

  async updateLinkConfiguration(
    payload: DTOUpdateLinkConfiguration,
  ): Promise<void> {
    const { itemId, ...rest } = payload;
    await fetchAPI(`items/${itemId}/link-configuration/`, {
      method: "PUT",
      body: JSON.stringify(rest),
    });
  }

  async updateAccess({
    itemId,
    accessId,
    ...payload
  }: DTOUpdateAccess): Promise<Access | void> {
    const response = await fetchAPI(`items/${itemId}/accesses/${accessId}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    if (response.status === 204) {
      return;
    }

    const data = await response.json();
    return data;
  }

  async createInvitation(payload: DTOCreateInvitation): Promise<Invitation> {
    const response = await fetchAPI(`items/${payload.itemId}/invitations/`, {
      method: "POST",
      body: JSON.stringify({
        email: payload.email,
        role: payload.role,
      }),
    });
    const data = await response.json();
    return data;
  }

  async deleteInvitation(payload: DTODeleteInvitation): Promise<void> {
    await fetchAPI(
      `items/${payload.itemId}/invitations/${payload.invitationId}/`,
      {
        method: "DELETE",
      },
    );
  }

  async updateInvitation(payload: DTOUpdateInvitation): Promise<Invitation> {
    const response = await fetchAPI(
      `items/${payload.itemId}/invitations/${payload.invitationId}/`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
    const data = await response.json();
    return data;
  }

  async getItemInvitations(itemId: string): Promise<APIList<Invitation>> {
    const response = await fetchAPI(`items/${itemId}/invitations/`);
    const data = await response.json();
    return data;
  }

  async moveItems(ids: string[], parentId?: string): Promise<void> {
    for (const id of ids) {
      await this.moveItem(id, parentId);
    }
  }

  async createFolder(data: {
    title: string;
    parentId?: string;
  }): Promise<Item> {
    const { parentId, ...rest } = data;
    const url = parentId ? `items/${parentId}/children/` : `items/`;
    const response = await fetchAPI(url, {
      method: "POST",
      body: JSON.stringify({
        ...rest,
        type: ItemType.FOLDER,
      }),
    });
    const item = await response.json();
    return jsonToItem(item);
  }

  async createWorkspace(data: {
    title: string;
    description: string;
  }): Promise<Item> {
    const response = await fetchAPI(`items/`, {
      method: "POST",
      body: JSON.stringify({
        ...data,
        type: ItemType.FOLDER,
      }),
    });
    const item = await response.json();
    return jsonToItem(item);
  }

  async updateWorkspace(item: Partial<Item>): Promise<Item> {
    return this.updateItem(item);
  }

  async deleteWorkspace(id: string): Promise<void> {
    return this.deleteItems([id]);
  }

  async getRecentItems(
    filters?: ItemFilters,
  ): Promise<PaginatedChildrenResult> {
    const response = await fetchAPI(`items/recents/`, {
      params: { ...filters, page_size: 200 },
    });
    const data = await response.json();
    return {
      children: jsonToItems(data.results),
      pagination: {
        currentPage: filters?.page ?? 1,
        totalCount: data.count,
        hasMore: data.next !== null,
      },
    };
  }

  async getFavoriteItems(
    filters?: ItemFilters,
  ): Promise<PaginatedChildrenResult> {
    const response = await fetchAPI(`items/favorite_list/`, {
      params: { ...filters, page_size: 200 },
    });

    const data = await response.json();
    return {
      children: jsonToItems(data.results),
      pagination: {
        currentPage: filters?.page ?? 1,
        totalCount: data.count,
        hasMore: data.next !== null,
      },
    };
  }

  async createFavoriteItem(itemId: string): Promise<void> {
    await fetchAPI(`items/${itemId}/favorite/`, {
      method: "POST",
    });
  }

  async deleteFavoriteItem(itemId: string): Promise<void> {
    await fetchAPI(`items/${itemId}/favorite/`, {
      method: "DELETE",
    });
  }

  createFile(data: {
    parentId?: string;
    file: File;
    filename: string;
    progressHandler?: (progress: number) => void;
  }): { promise: Promise<Item>; abort: () => Promise<void> } {
    let abortUpload: (() => void) | undefined;
    let aborted = false;
    const abortController = new AbortController();

    const abort = async () => {
      aborted = true;
      abortUpload?.();
      abortController.abort();
    };

    const promise = (async () => {
      const { parentId, file, progressHandler, ...rest } = data;
      const url = parentId ? `items/${parentId}/children/` : `items/`;
      const response = await fetchAPI(
        url,
        {
          method: "POST",
          body: JSON.stringify({
            type: ItemType.FILE,
            ...rest,
          }),
        },
        {
          redirectOn40x: false,
        },
      );
      const item = jsonToItem(await response.json());
      if (!item.policy) {
        throw new Error("No policy found");
      }

      if (aborted) {
        throw new DOMException("Upload cancelled", "AbortError");
      }

      // We want the upload progress ( that goes from 0 to 100) to be proxied to the progress handler ( that goes from 0 to 95)
      // So the progression indicator still shows leave a 5% gap before the upload-ended is called.
      // We want to wait until the upload-ended endpoint is called.
      const progressHandlerProxy = (progress: number) => {
        const proxyScale = 90;
        const proxiedProgress = (progress * proxyScale) / 100;
        progressHandler?.(proxiedProgress);
      };

      const upload = uploadFile(item.policy, file, (progress) => {
        progressHandlerProxy(progress);
      });
      abortUpload = upload.abort;

      if (aborted) {
        upload.abort();
        throw new DOMException("Upload cancelled", "AbortError");
      }

      await upload.promise;

      if (aborted) {
        throw new DOMException("Upload cancelled", "AbortError");
      }

      await fetchAPI(`items/${item.id}/upload-ended/`, {
        method: "POST",
        signal: abortController.signal,
      });

      progressHandler?.(100);

      return item;
    })();

    return { promise, abort };
  }

  async createFileFromTemplate(data: {
    parentId?: string;
    extension: string;
    title: string;
  }): Promise<Item> {
    const url = data.parentId ? `items/${data.parentId}/children/` : `items/`;

    const response = await fetchAPI(
      url,
      {
        method: "POST",
        body: JSON.stringify({
          type: "file",
          extension: data.extension,
          title: data.title,
        }),
      },
      {
        // When entitlements are falsy, the backend returns a 403 error.
        // We don't want to redirect to the login page in this case, instead
        // we want to show an error.
        redirectOn40x: false,
      },
    );
    return jsonToItem(await response.json());
  }

  async duplicateItem(id: string): Promise<Item> {
    const response = await fetchAPI(`items/${id}/duplicate/`, {
      method: "POST",
    });
    return jsonToItem(await response.json());
  }

  async deleteItems(ids: string[]): Promise<void> {
    for (const id of ids) {
      await fetchAPI(`items/${id}/`, {
        method: "DELETE",
      });
    }
  }

  async hardDeleteItems(ids: string[]): Promise<void> {
    for (const id of ids) {
      await fetchAPI(`items/${id}/hard-delete/`, {
        method: "DELETE",
      });
    }
  }

  async getWopiInfo(itemId: string): Promise<WopiInfo> {
    const response = await fetchAPI(`items/${itemId}/wopi/`);
    const data = await response.json();
    return data;
  }

  async getEntitlements(): Promise<Entitlements> {
    const response = await fetchAPI(`entitlements/`);
    const data = await response.json();
    return data;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jsonToItems = (data: any[]): Item[] => {
  return data.map((v) => jsonToItem(v));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jsonToItem = (data: any): Item => {
  const item = {
    ...data,
    updated_at: new Date(data.updated_at),
  };
  if (data.children) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    item.children = data.children.map((v: any) => jsonToItem(v));
  }
  return item;
};

/**
 * Upload a file, using XHR so we can report on progress through a handler.
 * @param url The URL to PUT the file to.
 * @param file The file to upload.
 * @param progressHandler A handler that receives progress updates as a single integer `0 <= x <= 100`.
 */
export const uploadFile = (
  url: string,
  file: File,
  progressHandler: (progress: number) => void,
): { promise: Promise<unknown>; abort: () => void } => {
  const xhr = new XMLHttpRequest();
  const promise = new Promise((resolve, reject) => {
    xhr.open("PUT", url);
    xhr.setRequestHeader("X-amz-acl", "private");
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.addEventListener("error", reject);
    xhr.addEventListener("abort", () =>
      reject(new DOMException("Upload cancelled", "AbortError")),
    );

    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // Make sure to always set the progress to 100% when the upload is done.
          // Because 'progress' event listener is not called when the file size is 0.
          progressHandler(100);
          return resolve(true);
        }
        if (xhr.status === 0) {
          // Aborted - already handled by abort listener
          return;
        }
        reject(new Error(`Failed to perform the upload on ${url}.`));
      }
    });

    xhr.upload.addEventListener("progress", (progressEvent) => {
      if (progressEvent.lengthComputable) {
        progressHandler(
          Math.floor((progressEvent.loaded / progressEvent.total) * 100),
        );
      }
    });

    xhr.send(file);
  });
  return { promise, abort: () => xhr.abort() };
};
