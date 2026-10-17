import { useState } from "react";
import { ArrowLeft, Check, Settings } from "lucide-react";
import { animalCatalog, canonical, resolveAvatar } from "@readatthree/teaching";
import type {
  AvatarId,
  PackageHash,
  PreparationAvailability,
  ProfileAdministrationIntent,
  ProfileDirectory,
} from "@readatthree/teaching";
import { Button } from "@/components/ui/button.tsx";
import { AddedText } from "../teaching/CopyText.tsx";
import { AnimalPortrait } from "./AnimalPortrait.tsx";
import { PreparationReader } from "./PreparationReader.tsx";
import { originAddress } from "./parent-visit.ts";
import type { ParentDestination, ParentVisit } from "./parent-visit.ts";
import type { TaskPreviewTicket } from "./task-preview.ts";

export type ParentAfter = "map" | "profiles" | "preparation";
export type ParentScreensProps = {
  visit: ParentVisit;
  directory: ProfileDirectory;
  preparation: PreparationAvailability;
  packageHash: PackageHash;
  busy: boolean;
  onGrant: () => void;
  onNavigate: (destination: ParentDestination) => void;
  onDraft: (destination: ParentDestination) => void;
  onReturn: () => void;
  onSubmit: (intent: ProfileAdministrationIntent, after: ParentAfter) => void;
  connectionTicket: () => number;
  isCurrent: (ticket: TaskPreviewTicket) => boolean;
};
function ParentGate({
  busy,
  initial,
  onGrant,
  onReturn,
}: {
  busy: boolean;
  initial: boolean;
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
          {initial
            ? "To set up reading together, type the word meadow."
            : "To open parent settings, type the word meadow."}
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
    preparation,
    busy,
    onGrant,
    onNavigate,
    onDraft,
    onReturn,
    onSubmit,
  } = props;
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
                Protected backup, restore and personal-data cleanup are coming
                in later application updates.
              </AddedText>
            </p>
            {returnLink()}
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
        content = (
          <PreparationReader
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
