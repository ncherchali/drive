import { ToasterItem } from "@/features/ui/components/toaster/Toaster";
import { Button as DsButton } from "@/components/ui/button";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { CircularProgress } from "@/features/ui/components/circular-progress/CircularProgress";
import prettyBytes from "pretty-bytes";
import { ToastContentProps } from "react-toastify";
import { ItemIcon } from "../icons/ItemIcon";
import {
  UploadingState,
  UploadingStep,
  FileUploadMeta,
  FileUploadStatus,
} from "@/features/explorer/hooks/useUpload";
import { IconSize } from "@/features/ui/components/icon/Icon";
import { Spinner } from "@/components/ui/spinner";
import { CancelUploadConfirmationModal } from "@/features/explorer/components/modals/CancelUploadConfirmationModal";
import { ErrorIcon } from "@/features/ui/components/icon/ErrorIcon";
import { CheckIcon } from "@/features/ui/components/icon/CheckIcon";
import { Item, ItemType } from "@/features/drivers/types";

const FileErrorIcon = () => (
  <div className="file-upload-toast__files__item__error-icon">
    <ErrorIcon size={20} />
  </div>
);

export const FileRow = ({
  name,
  meta,
  onCancelFile,
}: {
  name: string;
  meta: FileUploadMeta;
  onCancelFile?: (name: string) => void;
}) => {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={clsx("file-upload-toast__files__item", {
        "file-upload-toast__files__item--error":
          meta.status === FileUploadStatus.ERROR,
      })}
    >
      <div className="file-upload-toast__files__item__name">
        <ItemIcon
          item={
            {
              type: ItemType.FILE,
              mimetype: meta.file.type,
              title: name,
            } as unknown as Item
          }
          size={IconSize.LARGE}
        />
        <span>{name}</span>
        {meta.status !== FileUploadStatus.ERROR && (
          <span className="file-upload-toast__files__item__size">
            {prettyBytes(meta.file.size)}
          </span>
        )}
      </div>
      <div className="file-upload-toast__files__item__progress">
        {meta.status === FileUploadStatus.DONE && (
          <div className="file-upload-toast__files__item__check">
            <CheckIcon />
          </div>
        )}
        {meta.status === FileUploadStatus.ERROR && (
          <div
            className="file-upload-toast__files__item__progress"
            title={t(
              `explorer.actions.upload.files.error_reasons.${meta.error ?? "unknown"}`,
            )}
          >
            <span className="file-upload-toast__files__item__error-text">
              {t(
                `explorer.actions.upload.files.error_short.${meta.error ?? "unknown"}`,
                t("explorer.actions.upload.files.error"),
              )}
            </span>
            <FileErrorIcon />
          </div>
        )}
        {meta.status === FileUploadStatus.UPLOADING && (
          <div
            role="button"
            tabIndex={0}
            className="file-upload-toast__files__item__progress--hoverable"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onCancelFile?.(name)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onCancelFile?.(name);
              }
            }}
          >
            <CircularProgress progress={meta.progress} />
            {hovered && (
              <div className="file-upload-toast__files__item__cancel-overlay">
                <span className="material-icons file-upload-toast__files__item__cancel-icon">
                  close
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Sort files: uploading first, done second, errors/cancelled at the bottom.
 */
const sortEntries = (
  entries: [string, FileUploadMeta][],
): [string, FileUploadMeta][] => {
  const order: Record<string, number> = {
    [FileUploadStatus.UPLOADING]: 0,
    [FileUploadStatus.DONE]: 0,
    [FileUploadStatus.CANCELLED]: 1,
    [FileUploadStatus.ERROR]: 2,
  };
  return [...entries].sort(
    (a, b) => (order[a[1].status] ?? 9) - (order[b[1].status] ?? 9),
  );
};

export const FileUploadToast = (
  props: {
    uploadingState: UploadingState;
    onCancelFile?: (fileName: string) => void;
    onCancelAll?: () => void;
  } & Partial<ToastContentProps>,
) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const { activeFiles, uploadingFiles, doneFiles, errorFiles } = useMemo(() => {
    const allFiles = Object.values(props.uploadingState.filesMeta);
    return {
      activeFiles: allFiles.filter(
        (m) => m.status !== FileUploadStatus.CANCELLED,
      ),
      uploadingFiles: allFiles.filter(
        (m) => m.status === FileUploadStatus.UPLOADING,
      ),
      doneFiles: allFiles.filter((m) => m.status === FileUploadStatus.DONE),
      errorFiles: allFiles.filter((m) => m.status === FileUploadStatus.ERROR),
    };
  }, [props.uploadingState.filesMeta]);
  const pendingFilesCount = uploadingFiles.length;
  const doneFilesCount = doneFiles.length;
  const errorCount = errorFiles.length;

  // Overall progress percentage
  const overallProgress =
    activeFiles.length > 0
      ? Math.floor(
          activeFiles.reduce((sum, m) => sum + m.progress, 0) /
            activeFiles.length,
        )
      : 0;

  // Does not show the files list and the open button.
  const simpleMode =
    props.uploadingState.step === UploadingStep.PREPARING ||
    props.uploadingState.step === UploadingStep.CREATE_FOLDERS;

  const isDone =
    pendingFilesCount === 0 && props.uploadingState.step === UploadingStep.DONE;
  const canClose = pendingFilesCount === 0;

  useEffect(() => {
    if (props.uploadingState.step === UploadingStep.UPLOAD_FILES) {
      setIsOpen(true);
    }
  }, [props.uploadingState.step]);

  useEffect(() => {
    if (pendingFilesCount === 0) {
      if (errorCount === 0) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    }
  }, [pendingFilesCount, errorCount]);

  const sortedEntries = sortEntries(
    Object.entries(props.uploadingState.filesMeta),
  );

  return (
    <ToasterItem className="file-upload-toast__item">
      <div className="file-upload-toast">
        <div
          className={clsx("file-upload-toast__files", {
            "file-upload-toast__files--closed": !isOpen,
          })}
        >
          {sortedEntries
            .filter(([, meta]) => meta.status !== FileUploadStatus.CANCELLED)
            .map(([name, meta]) => (
              <FileRow
                key={name}
                name={name}
                meta={meta}
                onCancelFile={props.onCancelFile}
              />
            ))}
        </div>
        <div className="file-upload-toast__description">
          <div className="file-upload-toast__description__text">
            {simpleMode ? (
              <>
                <Spinner />
                {t(
                  `explorer.actions.upload.steps.${props.uploadingState.step}`,
                )}
              </>
            ) : (
              <>
                {pendingFilesCount > 0 ? (
                  <>
                    {t("explorer.actions.upload.files.description", {
                      count: pendingFilesCount,
                    })}
                    <span className="file-upload-toast__description__percentage">
                      {overallProgress}%
                    </span>
                  </>
                ) : isDone && doneFilesCount > 0 ? (
                  t("explorer.actions.upload.files.description_done", {
                    count: doneFilesCount,
                  })
                ) : isDone && doneFilesCount === 0 && errorCount > 0 ? (
                  t("explorer.actions.upload.files.error_count", {
                    count: errorCount,
                  })
                ) : null}
                {errorCount > 0 && (
                  <span
                    className="file-upload-toast__description__error-indicator"
                    title={t("explorer.actions.upload.files.error_count", {
                      count: errorCount,
                    })}
                  >
                    <ErrorIcon size={20} />
                  </span>
                )}
              </>
            )}
          </div>
          <div className="file-upload-toast__description__actions">
            {!simpleMode && (
              <DsButton
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </DsButton>
            )}

            {canClose ? (
              <DsButton
                onClick={props.closeToast}
                variant="ghost"
                size="icon"
              >
                <X className="size-4" />
              </DsButton>
            ) : (
              <DsButton
                onClick={() => setIsCancelModalOpen(true)}
                variant="ghost"
                size="icon"
              >
                <X className="size-4" />
              </DsButton>
            )}
          </div>
        </div>
      </div>
      <CancelUploadConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={() => {
          props.onCancelAll?.();
          props.closeToast?.();
        }}
      />
    </ToasterItem>
  );
};
