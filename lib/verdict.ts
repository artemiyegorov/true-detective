import type { AccusationGroundTruth } from "./case";
import type { VerdictResult, VerdictTier } from "./player-state";

// Pure verdict evaluator — given the player's accusation and the case
// ground truth, decide tier (truth / defensible_wrong / reckless) and
// build the narration the courtroom screen will type out.

export function evaluateAccusation(args: {
  accusedNpcId: string;
  accusedName: string;
  caseText: string;
  truth: AccusationGroundTruth;
}): VerdictResult {
  const text = args.caseText.toLowerCase();
  const correctSuspect = args.accusedNpcId === args.truth.killer_id;

  const motiveScore = args.truth.motive_keywords.filter(kw =>
    text.includes(kw.toLowerCase()),
  ).length;
  const evidenceScore = args.truth.evidence_keywords.filter(kw =>
    text.includes(kw.toLowerCase()),
  ).length;

  const motiveOK = motiveScore >= 2;
  const evidenceOK = evidenceScore >= 3;

  // Bug fix: previously "correct suspect + weak case" collapsed into
  // `defensible_wrong`, whose narration explicitly says "the real killer
  // was someone else" — wrong when the player actually nailed the right
  // person. Split it: a thin-but-correct case is its own tier.
  let tier: VerdictTier;
  if (correctSuspect && motiveOK && evidenceOK) tier = "truth";
  else if (correctSuspect) tier = "thin_truth";
  else if (motiveOK && evidenceOK) tier = "defensible_wrong";
  else tier = "reckless";

  const narration = renderNarration(tier, args.accusedName);
  const outcomeHeadline = OUTCOME_HEADLINE[tier];
  const outcomeRating = OUTCOME_RATING[tier];
  const stars: VerdictResult["stars"] =
    tier === "truth" ? 5
    : tier === "thin_truth" ? 3
    : tier === "defensible_wrong" ? 2
    : 1;

  return {
    tier,
    stars,
    narration,
    outcomeHeadline,
    outcomeRating,
    correctSuspect,
    motiveScore,
    evidenceScore,
  };
}

const OUTCOME_HEADLINE: Record<VerdictTier, string> = {
  truth: "CASE CLOSED — TRUTH FOUND",
  thin_truth: "CONVICTION — RIGHT PERSON, THIN CASE",
  defensible_wrong: "DEFENSIBLY WRONG",
  reckless: "CHARGES DISMISSED",
};

const OUTCOME_RATING: Record<VerdictTier, string> = {
  truth: "Justice served.",
  thin_truth: "You named the killer. Barely.",
  defensible_wrong: "Justice missed.",
  reckless: "The truth is out there.",
};

function todayLong(): string {
  const d = new Date();
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function renderNarration(tier: VerdictTier, accusedName: string): string {
  const date = todayLong();
  const opening = `On ${date}, the District Attorney's office filed charges against ${accusedName} for the murder of Margaret Cole.\n\nThe case proceeded to trial.`;

  if (tier === "truth") {
    return `${opening}\n\nAfter deliberation, the jury found ${accusedName} guilty of murder in the first degree. The verdict: life imprisonment without parole.\n\nYou got it right. Margaret can rest.`;
  }
  if (tier === "thin_truth") {
    return `${opening}\n\nThe DA was nervous about the case — the motive was thin, the physical evidence didn't tell a clean story. But it stuck. The jury convicted ${accusedName} of murder in the second degree. Twenty-five years.\n\nYou named the right person. You just didn't quite name the case. Some nights you'll wonder how close you came to losing it.`;
  }
  if (tier === "defensible_wrong") {
    return `${opening}\n\nThe jury convicted ${accusedName} based on the evidence presented.\n\nBut months later, you would learn the truth. The real killer was someone else. An innocent person sits in prison. The case will haunt you.`;
  }
  return `${opening}\n\nThe DA reviewed your case and declined to prosecute. Charges were dismissed. Your statement was inconsistent and the evidence didn't add up.\n\nThe real killer walks free. Margaret's case grows cold.`;
}
