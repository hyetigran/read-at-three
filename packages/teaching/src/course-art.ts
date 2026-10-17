export const activityArtKeys = [
  "printedSound",
  "printedReview",
  "oralBlending",
  "oralSounds",
  "printedSlowFast",
  "parentPointing",
  "childPointing",
  "rhyming",
  "writing",
] as const;
export type ActivityArtKey = (typeof activityArtKeys)[number];
