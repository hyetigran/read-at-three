import { animalCatalog, resolveAvatar } from "@readatthree/teaching";
import type {
  AvatarId,
  LocalPreferences,
  ProfileSummary,
} from "@readatthree/teaching";
import { AddedText } from "../teaching/CopyText.tsx";
import rabbit from "@/assets/avatars/rabbit.svg";
import fox from "@/assets/avatars/fox.svg";
import bear from "@/assets/avatars/bear.svg";
import owl from "@/assets/avatars/owl.svg";
import turtle from "@/assets/avatars/turtle.svg";
import bird from "@/assets/avatars/bird.svg";
import frog from "@/assets/avatars/frog.svg";
import cat from "@/assets/avatars/cat.svg";

const portraits = {
  rabbit,
  fox,
  bear,
  owl,
  turtle,
  bird,
  frog,
  cat,
} satisfies Record<AvatarId, string>;
export function AnimalPortrait({
  savedId,
}: {
  savedId: LocalPreferences["avatarId"];
}) {
  const id = resolveAvatar({ savedId });
  return (
    <img
      className="animal-portrait"
      src={portraits[id]}
      alt=""
      data-avatar={id}
    />
  );
}
export function ProfileButton({
  profile,
  disabled,
  onClick,
}: {
  profile: ProfileSummary;
  disabled?: boolean;
  onClick: () => void;
}) {
  const avatarId = resolveAvatar({ savedId: profile.preferences.avatarId });
  return (
    <button
      id="parent-profiles"
      className="parent-profile-button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Choose child profile"
    >
      <AnimalPortrait savedId={profile.preferences.avatarId} />
      <span>
        <AddedText>{profile.preferences.displayName || "Your child"}</AddedText>
        <small>
          <AddedText>{animalCatalog[avatarId]}</AddedText>
        </small>
      </span>
    </button>
  );
}
