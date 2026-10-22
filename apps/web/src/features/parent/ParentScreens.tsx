import { useQuery } from "@tanstack/react-query";
import { browserConfiguration } from "../../platform/browser-configuration.ts";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Settings } from "lucide-react";
import { animalCatalog, canonical, resolveAvatar } from "@readatthree/teaching";
import type {
  AvatarId,
  PackageHash,
  PreparationAvailability,
  ProfileAdministrationIntent,
  ProfileRemovalIntent,
  ProfileDirectory,
} from "@readatthree/teaching";
import { Button } from "@/components/ui/button.tsx";
import { AddedText } from "../teaching/CopyText.tsx";
import { AnimalPortrait } from "./AnimalPortrait.tsx";
import { PreparationReader } from "./PreparationReader.tsx";
import { originAddress, localSupportPreview } from "./parent-visit.ts";
import type { ParentDestination, ParentVisit } from "./parent-visit.ts";
import type { BrowserTeachingClient } from "../../platform/teaching-client.ts";
import { readOriginStorageEstimate } from "../../platform/storage-estimate.ts";
import type { TaskPreviewTicket } from "./task-preview.ts";
import { LessonFiles } from "./LessonFiles.tsx";
import type { LessonFilesClient } from "./LessonFiles.tsx";
import type { LessonFilesCommand } from "@readatthree/teaching";

export type ParentAfter = "map" | "profiles" | "preparation" | "removal";
export type ParentScreensProps = {
  visit: ParentVisit;
  directory: ProfileDirectory;
  preparation: PreparationAvailability;
  readParentMaterial: BrowserTeachingClient["parentMaterial"];
  packageHash: PackageHash;
  busy: boolean;
  onGrant: () => void;
  onNavigate: (destination: ParentDestination) => void;
  onDraft: (destination: ParentDestination) => void;
  onReturn: () => void;
  onSubmit: (
    intent: ProfileAdministrationIntent | ProfileRemovalIntent,
    after: ParentAfter,
  ) => void;
  readDiagnostics?: BrowserTeachingClient["readDiagnostics"];
  lessonFiles?: Readonly<{
    client: LessonFilesClient;
    retained: { current: LessonFilesCommand | null };
    onChanged(): Promise<void>;
  }>;
  connectionTicket: () => number;
  isCurrent: (ticket: TaskPreviewTicket) => boolean;
};
export function ParentGate({
  busy,
  initial,
  prompt,
  onGrant,
  onReturn,
}: {
  busy: boolean;
  initial: boolean;
  prompt?: string;
  onGrant: () => void;
  onReturn: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(false);
  return (
    <form
      className="course-gate"
      onSubmit={(event) => {
        event.preventDefault();
        if (busy) return;
        if (answer.trim().toLowerCase() !== "meadow") {
          setError(true);
          return;
        }
        onGrant();
      }}
    >
      <div className="course-parent-symbol" aria-hidden="true">
        <Settings />
      </div>
      <h2>
        <AddedText>A moment for the grown-up</AddedText>
      </h2>
      <p>
        <AddedText>
          {prompt ??
            (initial
              ? "To set up reading together, type the word meadow."
              : "To open parent settings, type the word meadow.")}
        </AddedText>
      </p>
      <label htmlFor="parent-word">
        <AddedText>Type the word</AddedText>
      </label>
      <input
        autoFocus
        id="parent-word"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        value={answer}
        onChange={(event) => setAnswer(event.currentTarget.value)}
        aria-invalid={error}
        aria-describedby={error ? "parent-word-error" : undefined}
      />
      {error ? (
        <p id="parent-word-error" role="alert">
          <AddedText>
            That word does not match. Read the word above and try again.
          </AddedText>
        </p>
      ) : null}
      <div className="course-gate-actions">
        <Button
          type="button"
          className="course-secondary"
          onClick={onReturn}
          disabled={busy}
        >
          <AddedText>Cancel</AddedText>
        </Button>
        <Button className="course-primary" type="submit" disabled={busy}>
          <AddedText>
            {initial ? "Continue setup" : "Continue to parent settings"}
          </AddedText>
        </Button>
      </div>
    </form>
  );
}
function AnimalChoice({
  avatarId,
  busy,
  onChoice,
}: {
  avatarId: AvatarId;
  busy: boolean;
  onChoice: (id: AvatarId) => void;
}) {
  return (
    <fieldset className="parent-animal-choices" disabled={busy}>
      <legend>
        <AddedText>Choose your animal</AddedText>
      </legend>
      <div className="parent-animal-grid">
        {Object.entries(animalCatalog).map(([key, label]) => {
          const id = resolveAvatar({ savedId: key });
          return (
            <label className="parent-animal-card" key={id}>
              <input
                type="radio"
                name="animal"
                value={id}
                checked={avatarId === id}
                onChange={() => onChoice(id)}
              />
              <span className="parent-animal-art">
                <AnimalPortrait savedId={id} />
                <span className="parent-animal-check" aria-hidden="true">
                  <Check />
                </span>
              </span>
              <span className="parent-animal-label">
                <AddedText>{label}</AddedText>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
export function ParentScreens(props: ParentScreensProps) {
  const {
    visit,
    directory,
    preparation: developmentPreparation,
    busy,
    onGrant,
    onNavigate,
    onDraft,
    onReturn,
    onSubmit,
  } = props;
  const installed = browserConfiguration.kind === "installed";
  const preparationTicket: TaskPreviewTicket = {
    lifetime: visit.lifetime,
    routeAttempt: visit.routeAttempt,
    packageHash: props.packageHash,
  };
  const preparationQuery = useQuery({
    queryKey: [
      "installed-parent-preparation",
      visit.lifetime.selection,
      visit.lifetime.connectionTicket,
      visit.lifetime.visitId,
      visit.routeAttempt,
      props.packageHash,
    ],
    queryFn: async (): Promise<PreparationAvailability> => {
      if (!props.isCurrent(preparationTicket))
        throw new Error("Parent visit was retired");
      const material = await props.readParentMaterial({
        kind: "preparation",
        packageHash: props.packageHash,
      });
      if (!props.isCurrent(preparationTicket))
        throw new Error("Parent visit was retired");
      return material.kind === "preparation"
        ? { kind: "available", document: material.document }
        : { kind: "unavailable", reason: "missing" };
    },
    enabled: installed && visit.destination.kind === "preparation",
    networkMode: "always",
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
  const preparation: PreparationAvailability = installed
    ? (preparationQuery.data ?? {
        kind: "unavailable",
        reason: preparationQuery.error ? "invalid" : "missing",
      })
    : developmentPreparation;
  const destination = visit.destination;
  const first = directory.initialSetup.kind === "firstLaunch";
  const target =
    "target" in destination
      ? directory.profiles.find(
          (profile) =>
            canonical(profile.edit.owner) ===
            canonical(destination.target.owner),
        )
      : null;
  function manage(next: ParentDestination) {
    if (directory.preparation.kind !== "acknowledged")
      onNavigate({ kind: "preparation", continuation: "profiles" });
    else onNavigate(next);
  }
  function finishPreparation() {
    if (first)
      onNavigate({
        kind: "initialProfile",
        preferences: { avatarId: "rabbit" },
      });
    else if (
      destination.kind === "preparation" &&
      destination.continuation === "profiles"
    )
      onNavigate({ kind: "profiles" });
    else onReturn();
  }
  function returnLink() {
    return (
      <a
        className="course-primary"
        href={originAddress(visit.origin)}
        onClick={(event) => {
          event.preventDefault();
          onReturn();
        }}
      >
        <AddedText>
          {visit.origin.kind === "map"
            ? "Return to lesson map"
            : "Return to reading"}
        </AddedText>
      </a>
    );
  }
  let content;
  if (visit.gate.kind === "locked")
    content = (
      <ParentGate
        key={visit.lifetime.visitId}
        busy={busy}
        initial={first}
        onGrant={onGrant}
        onReturn={onReturn}
      />
    );
  else
    switch (destination.kind) {
      case "unavailable":
        content = (
          <section className="parent-message" role="alert">
            <h2>
              <AddedText>This parent page is unavailable</AddedText>
            </h2>
            <p>
              <AddedText>
                The child or page in this address is unavailable. Your saved
                work is kept.
              </AddedText>
            </p>
            <Button
              className="course-secondary"
              onClick={() => onNavigate({ kind: "profiles" })}
            >
              <AddedText>Child profiles</AddedText>
            </Button>
            {returnLink()}
          </section>
        );
        break;
      case "lessonFiles":
        content =
          props.lessonFiles && installed ? (
            <LessonFiles
              key={canonical([
                props.packageHash,
                visit.lifetime.connectionTicket,
                visit.lifetime.visitId,
                visit.routeAttempt,
              ])}
              client={props.lessonFiles.client}
              installationId={directory.administration.installationId}
              visitKey={[
                visit.lifetime.connectionTicket,
                visit.lifetime.visitId,
                visit.routeAttempt,
                props.packageHash,
              ]}
              isCurrent={() => props.isCurrent(preparationTicket)}
              retained={props.lessonFiles.retained}
              onChanged={props.lessonFiles.onChanged}
            />
          ) : (
            <p>
              <AddedText>
                Lesson-file updates are available after signed installation.
              </AddedText>
            </p>
          );
        break;
      case "settings":
        content = (
          <section className="course-settings">
            <h2>
              <AddedText>Reading together</AddedText>
            </h2>
            <p>
              <AddedText>
                Read the top guidance, model the sounds, listen and choose when
                to continue. Touch and handwriting do not automatically pass an
                activity.
              </AddedText>
            </p>
            <div className="parent-settings-links">
              <Button
                className="course-secondary"
                onClick={() => onNavigate({ kind: "lessonFiles" })}
                disabled={busy}
              >
                <AddedText>Lesson files</AddedText>
              </Button>
              <Button
                className="course-primary"
                onClick={() => manage({ kind: "profiles" })}
                disabled={busy}
              >
                <AddedText>Child profiles</AddedText>
              </Button>
              <Button
                className="course-secondary"
                onClick={() =>
                  onNavigate({ kind: "preparation", continuation: "return" })
                }
                disabled={busy}
              >
                <AddedText>Parent preparation</AddedText>
              </Button>
            </div>
            <h2>
              <AddedText>Saved on this device</AddedText>
            </h2>
            <p>
              <AddedText>
                Your current reading place, completed activities and
                acknowledged handwriting saves are stored locally.
              </AddedText>
            </p>
            <p>
              <AddedText>
                Protected backup and restore are coming in later application
                updates.
              </AddedText>
            </p>
            <Button
              className="course-secondary"
              onClick={() => onNavigate({ kind: "support" })}
              disabled={busy}
            >
              <AddedText>Local support information</AddedText>
            </Button>
            {returnLink()}
          </section>
        );
        break;
      case "support":
        content = (
          <LocalSupport
            readDiagnostics={props.readDiagnostics ?? unavailableDiagnostics}
            onBack={() => onNavigate({ kind: "settings" })}
          />
        );
        break;
      case "removal":
        content =
          target &&
          canonical(target.edit) === canonical(destination.target) &&
          canonical(target.edit.owner) ===
            canonical(directory.selection.owner) ? (
            <section className="parent-removal">
              <div className="parent-removal-target">
                <AnimalPortrait savedId={target.preferences.avatarId} />
                <h2>
                  <AddedText>
                    {target.preferences.displayName || "Your child"}
                  </AddedText>
                </h2>
                <p>
                  <AddedText>
                    {
                      animalCatalog[
                        resolveAvatar({ savedId: target.preferences.avatarId })
                      ]
                    }
                  </AddedText>
                </p>
              </div>
              {destination.state.kind === "chooseSuccessor" ? (
                <>
                  <h2>
                    <AddedText>Delete this child from this device</AddedText>
                  </h2>
                  <p>
                    <AddedText>
                      All of this child's progress, saved handwriting, history
                      and Undo will be removed. This cannot be undone.
                    </AddedText>
                  </p>
                  {directory.profiles.length > 1 ? (
                    <fieldset disabled={busy}>
                      <legend>
                        <AddedText>Choose who will read next</AddedText>
                      </legend>
                      {directory.profiles
                        .filter(
                          (profile) =>
                            canonical(profile.edit.owner) !==
                            canonical(target.edit.owner),
                        )
                        .map((profile) => (
                          <label
                            className="parent-successor"
                            key={profile.edit.owner.profileId}
                          >
                            <input
                              type="radio"
                              name="successor"
                              checked={
                                destination.state.kind === "chooseSuccessor" &&
                                destination.state.choice?.kind === "existing" &&
                                canonical(destination.state.choice.owner) ===
                                  canonical(profile.edit.owner)
                              }
                              onChange={() =>
                                onDraft({
                                  ...destination,
                                  state: {
                                    kind: "chooseSuccessor",
                                    choice: {
                                      kind: "existing",
                                      owner: profile.edit.owner,
                                    },
                                  },
                                })
                              }
                            />
                            <AnimalPortrait
                              savedId={profile.preferences.avatarId}
                            />
                            <AddedText>{`${profile.preferences.displayName || "Your child"} (${animalCatalog[resolveAvatar({ savedId: profile.preferences.avatarId })]})`}</AddedText>
                          </label>
                        ))}
                    </fieldset>
                  ) : (
                    <>
                      <p>
                        <AddedText>
                          This is the only child. Deletion also creates a fresh
                          child with the animal and optional name you explicitly
                          choose below. No progress or handwriting will be
                          transferred.
                        </AddedText>
                      </p>
                      <label htmlFor="replacement-name">
                        <AddedText>New child's name (optional)</AddedText>
                      </label>
                      <input
                        id="replacement-name"
                        disabled={
                          busy ||
                          destination.state.choice?.kind !== "replacement"
                        }
                        value={
                          destination.state.choice?.kind === "replacement"
                            ? (destination.state.choice.preferences
                                .displayName ?? "")
                            : ""
                        }
                        onChange={(event) => {
                          const choice =
                            destination.state.kind === "chooseSuccessor"
                              ? destination.state.choice
                              : null;
                          if (
                            choice?.kind === "replacement" &&
                            [...event.currentTarget.value].length <= 120
                          )
                            onDraft({
                              ...destination,
                              state: {
                                kind: "chooseSuccessor",
                                choice: {
                                  ...choice,
                                  preferences: {
                                    ...choice.preferences,
                                    displayName: event.currentTarget.value,
                                  },
                                },
                              },
                            });
                        }}
                      />
                      <p>
                        <AddedText>
                          Choose the new child's animal before entering an
                          optional name.
                        </AddedText>
                      </p>
                      <fieldset
                        className="parent-replacement-animals"
                        disabled={busy}
                      >
                        <legend>
                          <AddedText>New child's animal</AddedText>
                        </legend>
                        {Object.entries(animalCatalog).map(([key, label]) => {
                          const avatarId = resolveAvatar({ savedId: key });
                          return (
                            <label key={key}>
                              <input
                                type="radio"
                                name="replacement-animal"
                                checked={
                                  destination.state.kind ===
                                    "chooseSuccessor" &&
                                  destination.state.choice?.kind ===
                                    "replacement" &&
                                  destination.state.choice.preferences
                                    .avatarId === avatarId
                                }
                                onChange={() => {
                                  const choice =
                                    destination.state.kind === "chooseSuccessor"
                                      ? destination.state.choice
                                      : null;
                                  onDraft({
                                    ...destination,
                                    state: {
                                      kind: "chooseSuccessor",
                                      choice: {
                                        kind: "replacement",
                                        preferences: {
                                          avatarId,
                                          ...(choice?.kind === "replacement" &&
                                          choice.preferences.displayName
                                            ? {
                                                displayName:
                                                  choice.preferences
                                                    .displayName,
                                              }
                                            : {}),
                                        },
                                      },
                                    },
                                  });
                                }}
                              />
                              <AnimalPortrait savedId={avatarId} />
                              <AddedText>{label}</AddedText>
                            </label>
                          );
                        })}
                      </fieldset>
                    </>
                  )}
                  <div className="parent-form-actions">
                    <Button
                      type="button"
                      className="course-secondary"
                      disabled={busy}
                      onClick={() => onNavigate({ kind: "profiles" })}
                    >
                      <AddedText>Cancel</AddedText>
                    </Button>
                    <Button
                      className="course-primary"
                      disabled={busy || !destination.state.choice}
                      onClick={() => {
                        if (
                          destination.state.kind === "chooseSuccessor" &&
                          destination.state.choice
                        )
                          onDraft({
                            ...destination,
                            state: {
                              kind: "confirm",
                              operation: "delete",
                              successor: destination.state.choice,
                            },
                          });
                      }}
                    >
                      <AddedText>Review deletion</AddedText>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h2>
                    <AddedText>
                      {destination.state.operation === "reset"
                        ? "Reset this child's progress?"
                        : "Delete this child?"}
                    </AddedText>
                  </h2>
                  <p>
                    <AddedText>
                      {destination.state.operation === "reset"
                        ? "Remove all of this child's progress, saved handwriting, history and Undo. Keep this child, their name and animal, and start their reading again. This cannot be undone."
                        : "Permanently remove this child and all of their progress, saved handwriting, history and Undo from this device. This cannot be undone."}
                    </AddedText>
                  </p>
                  {destination.state.operation === "delete" ? (
                    <SuccessorSummary
                      directory={directory}
                      successor={destination.state.successor}
                    />
                  ) : null}
                  <p>
                    <AddedText>
                      Other children's saved work and installed lessons are
                      kept.
                    </AddedText>
                  </p>
                  <div className="parent-form-actions">
                    <Button
                      className="course-secondary"
                      disabled={busy}
                      onClick={() => onNavigate({ kind: "profiles" })}
                    >
                      <AddedText>Cancel</AddedText>
                    </Button>
                    <Button
                      className="parent-destructive"
                      disabled={busy}
                      onClick={() => {
                        if (destination.state.kind !== "confirm") return;
                        onSubmit(
                          destination.state.operation === "reset"
                            ? {
                                kind: "resetProfile",
                                directory: directory.administration,
                                target: destination.target,
                              }
                            : {
                                kind: "deleteProfile",
                                directory: directory.administration,
                                target: destination.target,
                                successor: destination.state.successor,
                              },
                          "removal",
                        );
                      }}
                    >
                      <AddedText>
                        {destination.state.operation === "reset"
                          ? "Reset progress permanently"
                          : "Delete child permanently"}
                      </AddedText>
                    </Button>
                  </div>
                </>
              )}
            </section>
          ) : (
            <section className="parent-message" role="alert">
              <AddedText>
                This child's selection changed. Open child profiles to choose
                the current child again.
              </AddedText>
              <Button onClick={() => onNavigate({ kind: "profiles" })}>
                <AddedText>Child profiles</AddedText>
              </Button>
            </section>
          );
        break;
      case "profiles":
        content = (
          <section className="parent-profiles-content">
            <h2>
              <AddedText>Who is reading today?</AddedText>
            </h2>
            <ul className="parent-profile-list">
              {directory.profiles.map((profile) => {
                const selected =
                  canonical(profile.edit.owner) ===
                  canonical(directory.selection.owner);
                return (
                  <li
                    key={profile.edit.owner.profileId}
                    data-profile-id={profile.edit.owner.profileId}
                    data-selected={selected}
                  >
                    <AnimalPortrait savedId={profile.preferences.avatarId} />
                    <div className="parent-profile-name">
                      <strong>
                        <AddedText>
                          {profile.preferences.displayName || "Your child"}
                        </AddedText>
                      </strong>
                      <small>
                        <AddedText>
                          {
                            animalCatalog[
                              resolveAvatar({
                                savedId: profile.preferences.avatarId,
                              })
                            ]
                          }
                        </AddedText>
                      </small>
                      {selected ? (
                        <small>
                          <AddedText>Reading now</AddedText>
                        </small>
                      ) : null}
                    </div>
                    <div className="parent-profile-actions">
                      {selected ? (
                        <>
                          <Button
                            className="course-secondary"
                            disabled={busy}
                            onClick={() =>
                              manage({
                                kind: "removal",
                                target: profile.edit,
                                state: { kind: "confirm", operation: "reset" },
                              })
                            }
                          >
                            <AddedText>Reset progress</AddedText>
                          </Button>
                          <Button
                            className="course-secondary"
                            disabled={busy}
                            onClick={() =>
                              manage({
                                kind: "removal",
                                target: profile.edit,
                                state: {
                                  kind: "chooseSuccessor",
                                  choice: null,
                                },
                              })
                            }
                          >
                            <AddedText>Delete child</AddedText>
                          </Button>
                        </>
                      ) : null}
                      <Button
                        className="course-secondary"
                        disabled={busy}
                        onClick={() =>
                          manage({
                            kind: "editName",
                            target: profile.edit,
                            displayName: profile.preferences.displayName ?? "",
                          })
                        }
                      >
                        <AddedText>Change name</AddedText>
                      </Button>
                      <Button
                        className="course-secondary"
                        disabled={busy}
                        onClick={() =>
                          manage({
                            kind: "editAvatar",
                            target: profile.edit,
                            avatarId: resolveAvatar({
                              savedId: profile.preferences.avatarId,
                            }),
                          })
                        }
                      >
                        <AddedText>Change animal</AddedText>
                      </Button>
                      <Button
                        className="course-primary"
                        disabled={busy}
                        onClick={() =>
                          selected
                            ? onReturn()
                            : onSubmit(
                                {
                                  kind: "selectProfile",
                                  directory: directory.administration,
                                  target: profile.edit.owner,
                                },
                                "map",
                              )
                        }
                      >
                        <AddedText>
                          {selected ? "Return to reading" : "Read together"}
                        </AddedText>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="parent-settings-links">
              <Button
                className="course-primary"
                onClick={() =>
                  manage({
                    kind: "createProfile",
                    preferences: { avatarId: "rabbit" },
                  })
                }
                disabled={busy}
              >
                <AddedText>Add child</AddedText>
              </Button>
              <Button
                className="course-secondary"
                onClick={() => onNavigate({ kind: "settings" })}
                disabled={busy}
              >
                <AddedText>Parent settings</AddedText>
              </Button>
              {returnLink()}
            </div>
          </section>
        );
        break;
      case "preparation":
        content =
          installed && preparationQuery.isPending ? (
            <section className="parent-message" role="status">
              <p>
                <AddedText>Loading parent preparation</AddedText>
              </p>
            </section>
          ) : (
            <PreparationReader
              readParentMaterial={props.readParentMaterial}
              availability={preparation}
              visit={visit}
              packageHash={props.packageHash}
              acknowledged={directory.preparation.kind === "acknowledged"}
              busy={busy}
              onAcknowledge={() => {
                if (preparation.kind !== "available") return;
                onSubmit(
                  {
                    kind: "acknowledgePreparation",
                    directory: directory.administration,
                    hash: preparation.document.preparationHash,
                  },
                  "preparation",
                );
              }}
              onContinue={finishPreparation}
              onReturn={onReturn}
              connectionTicket={props.connectionTicket}
              isCurrent={props.isCurrent}
            />
          );
        break;
      case "initialProfile":
      case "createProfile":
        content = (
          <form
            className="parent-animal-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (busy) return;
              const preferences = destination.preferences.displayName
                ? destination.preferences
                : { avatarId: destination.preferences.avatarId };
              if (destination.kind === "initialProfile") {
                const initial = directory.profiles.find(
                  (profile) =>
                    canonical(profile.edit.owner) ===
                    canonical(directory.selection.owner),
                );
                if (initial)
                  onSubmit(
                    {
                      kind: "finishInitialProfile",
                      directory: directory.administration,
                      target: initial.edit,
                      preferences,
                    },
                    "map",
                  );
              } else
                onSubmit(
                  {
                    kind: "createAndSelect",
                    directory: directory.administration,
                    preferences,
                  },
                  "map",
                );
            }}
          >
            <label className="parent-name-input" htmlFor="child-name">
              <span>
                <AddedText>Name (optional)</AddedText>
              </span>
              <input
                id="child-name"
                value={destination.preferences.displayName ?? ""}
                disabled={busy}
                onChange={(event) => {
                  if ([...event.currentTarget.value].length <= 120)
                    onDraft({
                      ...destination,
                      preferences: {
                        ...destination.preferences,
                        displayName: event.currentTarget.value,
                      },
                    });
                }}
              />
            </label>
            <AnimalChoice
              avatarId={destination.preferences.avatarId}
              busy={busy}
              onChoice={(avatarId) =>
                onDraft({
                  ...destination,
                  preferences: { ...destination.preferences, avatarId },
                })
              }
            />
            {destination.kind === "createProfile" ? (
              <p className="parent-create-notice">
                <AddedText>
                  Continue creates this child and opens their lesson map. Your
                  other children's saved work is kept.
                </AddedText>
              </p>
            ) : null}
            <div className="parent-form-actions">
              <Button
                className="course-secondary"
                type="button"
                onClick={
                  destination.kind === "initialProfile"
                    ? onReturn
                    : () => onNavigate({ kind: "profiles" })
                }
                disabled={busy}
              >
                <AddedText>Cancel</AddedText>
              </Button>
              <Button className="course-primary" type="submit" disabled={busy}>
                <AddedText>Continue</AddedText>
              </Button>
            </div>
          </form>
        );
        break;
      case "editAvatar":
        content = target ? (
          <form
            className="parent-animal-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!busy)
                onSubmit(
                  {
                    kind: "setAvatar",
                    directory: directory.administration,
                    target: destination.target,
                    avatarId: destination.avatarId,
                  },
                  "profiles",
                );
            }}
          >
            <h2>
              <AddedText>{`${target.preferences.displayName || "Your child"}'s animal`}</AddedText>
            </h2>
            <AnimalChoice
              avatarId={destination.avatarId}
              busy={busy}
              onChoice={(avatarId) => onDraft({ ...destination, avatarId })}
            />
            <div className="parent-form-actions">
              <Button
                className="course-secondary"
                type="button"
                disabled={busy}
                onClick={() => onNavigate({ kind: "profiles" })}
              >
                <AddedText>Cancel</AddedText>
              </Button>
              <Button className="course-primary" type="submit" disabled={busy}>
                <AddedText>Continue</AddedText>
              </Button>
            </div>
          </form>
        ) : (
          <p role="alert">
            <AddedText>
              This child is unavailable. Your saved work is kept.
            </AddedText>
          </p>
        );
        break;
      case "editName":
        content = target ? (
          <form
            className="parent-name-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!busy)
                onSubmit(
                  {
                    kind: "setDisplayName",
                    directory: directory.administration,
                    target: destination.target,
                    displayName: destination.displayName || null,
                  },
                  "profiles",
                );
            }}
          >
            <h2>
              <AddedText>Change optional name</AddedText>
            </h2>
            <label htmlFor="child-name">
              <AddedText>Name (optional)</AddedText>
            </label>
            <input
              autoFocus
              id="child-name"
              value={destination.displayName}
              disabled={busy}
              onChange={(event) => {
                if ([...event.currentTarget.value].length <= 120)
                  onDraft({
                    ...destination,
                    displayName: event.currentTarget.value,
                  });
              }}
            />
            <div className="parent-form-actions">
              <Button
                type="button"
                className="course-secondary"
                onClick={() => onNavigate({ kind: "profiles" })}
                disabled={busy}
              >
                <AddedText>Cancel</AddedText>
              </Button>
              <Button className="course-primary" type="submit" disabled={busy}>
                <AddedText>Save name</AddedText>
              </Button>
            </div>
          </form>
        ) : (
          <p role="alert">
            <AddedText>
              This child is unavailable. Your saved work is kept.
            </AddedText>
          </p>
        );
        break;
      default: {
        const exhaustive: never = destination;
        content = exhaustive;
      }
    }
  return (
    <main
      className={`course-screen course-parent parent-screen${destination.kind === "profiles" ? " parent-profiles" : ""}`}
      aria-busy={busy}
      data-parent-visit={visit.lifetime.visitId}
    >
      <header className="course-header">
        <Button
          className="course-icon-button"
          aria-label="Back"
          onClick={onReturn}
          disabled={busy}
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
        <h1>
          <AddedText>
            {visit.gate.kind === "locked"
              ? "For parents"
              : destination.kind === "preparation"
                ? "Parent preparation"
                : destination.kind === "settings"
                  ? "Parent settings"
                  : destination.kind === "lessonFiles"
                    ? "Lesson files"
                    : destination.kind === "support"
                      ? "Local support"
                      : destination.kind === "removal"
                        ? "Manage saved work"
                        : destination.kind === "profiles"
                          ? "Child profiles"
                          : "Choose an animal"}
          </AddedText>
        </h1>
      </header>
      {content}
    </main>
  );
}

function SuccessorSummary({
  directory,
  successor,
}: {
  directory: ProfileDirectory;
  successor: Extract<
    ProfileRemovalIntent,
    { kind: "deleteProfile" }
  >["successor"];
}) {
  const preferences =
    successor.kind === "replacement"
      ? successor.preferences
      : directory.profiles.find(
          (profile) =>
            canonical(profile.edit.owner) === canonical(successor.owner),
        )?.preferences;
  if (!preferences)
    return (
      <p role="alert">
        <AddedText>
          The next child is unavailable. Cancel and choose again.
        </AddedText>
      </p>
    );
  return (
    <div className="parent-successor-summary">
      <AnimalPortrait savedId={preferences.avatarId} />
      <p>
        <AddedText>{`${successor.kind === "replacement" ? "Create a fresh child" : "Select the next child"} ${preferences.displayName || "Your child"} (${animalCatalog[resolveAvatar({ savedId: preferences.avatarId })]}).`}</AddedText>
      </p>
    </div>
  );
}
function LocalSupport({
  readDiagnostics,
  onBack,
}: {
  readDiagnostics: BrowserTeachingClient["readDiagnostics"];
  onBack: () => void;
}) {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ready"; preview: string }
    | { kind: "unavailable" }
  >({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    setState({ kind: "loading" });
    void Promise.all([readDiagnostics(), readOriginStorageEstimate()])
      .then(([diagnostics, estimate]) => {
        const preview = localSupportPreview({ diagnostics, estimate });
        if (current) setState({ kind: "ready", preview });
      })
      .catch(() => {
        if (current) setState({ kind: "unavailable" });
      });
    return () => {
      current = false;
    };
  }, [readDiagnostics, attempt]);
  return (
    <section className="parent-support">
      <h2>
        <AddedText>Local support information</AddedText>
      </h2>
      <p>
        <AddedText>
          This preview stays on this device. It includes application, database
          and ink versions, startup capabilities, local diagnostic persistence,
          omitted events and aggregate timings or errors. Browser storage
          estimates cover the whole origin, not one child's saved work. Missing
          measurements are unavailable, not zero. Nothing is uploaded.
        </AddedText>
      </p>
      {state.kind === "ready" ? (
        <pre data-origin="added" className="parent-support-preview">
          {state.preview}
        </pre>
      ) : (
        <p role="status">
          <AddedText>
            {state.kind === "loading"
              ? "Reading local support information..."
              : "Local support information is unavailable. No saved-work size or diagnostic persistence can be confirmed."}
          </AddedText>
        </p>
      )}
      <div className="parent-form-actions">
        <Button className="course-secondary" onClick={onBack}>
          <AddedText>Back to parent settings</AddedText>
        </Button>
        <Button
          className="course-primary"
          disabled={state.kind === "loading"}
          onClick={() => setAttempt(attempt + 1)}
        >
          <AddedText>Refresh local information</AddedText>
        </Button>
      </div>
    </section>
  );
}

async function unavailableDiagnostics(): ReturnType<
  BrowserTeachingClient["readDiagnostics"]
> {
  throw new Error("Local support is unavailable");
}
