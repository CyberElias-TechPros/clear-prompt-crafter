export type PromptMode = "structured" | "conversational" | "meta";

export type PromptSections = {
  role: string;
  objective: string;
  context: string;
  guidelines: string;
  constraints: string;
  output: string;
};

export type PromptRecord = {
  id: string;
  title: string;
  description: string;
  mode: PromptMode;
  sections: PromptSections;
  content: string;
  category: string;
  tags: string[];
  author: string;
  authorInitials: string;
  isPublic: boolean;
  likes: number;
  views: number;
  createdAt: string;
  updatedAt: string;
};

export const emptySections: PromptSections = {
  role: "",
  objective: "",
  context: "",
  guidelines: "",
  constraints: "",
  output: "",
};

export const categoryOptions = [
  "All topics",
  "Software & product",
  "Marketing & content",
  "Research & analysis",
  "Operations",
  "Creative work",
] as const;

export const starterPrompts: PromptRecord[] = [
  {
    id: "starter-code-review",
    title: "Ship-ready code review",
    description: "A rigorous review that catches correctness, security, and maintainability issues before they reach production.",
    mode: "structured",
    sections: {
      role: "You are a principal software engineer reviewing a pull request for a production codebase.",
      objective: "Review the proposed change and return the most important issues first, with concrete fixes.",
      context: "The team values small, reversible changes. The review should account for runtime behavior, data integrity, accessibility, and operational impact.",
      guidelines: "Trace the feature from UI to persistence. Separate blockers from suggestions. Quote the relevant code or behavior and explain why it matters.",
      constraints: "Do not invent requirements. Do not nitpick formatting handled by tooling. If the change is sound, say what was verified.",
      output: "Return: verdict, blockers, recommended changes, questions, and a short test plan.",
    },
    content: "",
    category: "Software & product",
    tags: ["engineering", "quality", "security"],
    author: "Maya Chen",
    authorInitials: "MC",
    isPublic: true,
    likes: 184,
    views: 2480,
    createdAt: "2026-09-04T10:00:00.000Z",
    updatedAt: "2026-09-04T10:00:00.000Z",
  },
  {
    id: "starter-launch-brief",
    title: "Turn research into a launch brief",
    description: "Transform messy customer research into a focused brief your team can actually use.",
    mode: "structured",
    sections: {
      role: "You are a senior product marketer who turns customer evidence into clear positioning.",
      objective: "Create a concise launch brief with audience, problem, promise, proof points, objections, and next actions.",
      context: "The source material may contain repeated ideas, contradictions, and unverified claims. Prioritize what customers actually said over assumptions.",
      guidelines: "Cluster themes, preserve useful language from customers, label assumptions, and make every recommendation traceable to evidence.",
      constraints: "Do not fabricate statistics, testimonials, or market claims. Keep the final brief under 800 words.",
      output: "Use headings: audience, problem, positioning, proof, objections, channels, and open questions.",
    },
    content: "",
    category: "Marketing & content",
    tags: ["strategy", "research", "launch"],
    author: "Jon Bell",
    authorInitials: "JB",
    isPublic: true,
    likes: 126,
    views: 1710,
    createdAt: "2026-09-01T09:30:00.000Z",
    updatedAt: "2026-09-01T09:30:00.000Z",
  },
  {
    id: "starter-data-detective",
    title: "Data detective for ambiguous metrics",
    description: "A calm, repeatable way to investigate metric changes without jumping to conclusions.",
    mode: "structured",
    sections: {
      role: "You are an analytics lead who explains evidence clearly to both technical and non-technical teammates.",
      objective: "Investigate the metric movement, identify plausible causes, and propose the next highest-value checks.",
      context: "The analyst will provide a metric definition, timeframe, segments, known releases, and any available raw observations.",
      guidelines: "Check definition changes, instrumentation, seasonality, segmentation, and sample size before causal explanations. State confidence levels.",
      constraints: "Do not claim causation from correlation. Do not hide missing data. Keep the investigation practical and ordered.",
      output: "Return: what changed, what is known, hypotheses ranked by confidence, checks to run, and a stakeholder-ready summary.",
    },
    content: "",
    category: "Research & analysis",
    tags: ["analytics", "metrics", "decision-making"],
    author: "Samira Okafor",
    authorInitials: "SO",
    isPublic: true,
    likes: 94,
    views: 1380,
    createdAt: "2026-08-28T15:20:00.000Z",
    updatedAt: "2026-08-28T15:20:00.000Z",
  },
  {
    id: "starter-incident-comms",
    title: "Incident communication copilot",
    description: "Keep status updates useful, honest, and calm while a team is restoring service.",
    mode: "structured",
    sections: {
      role: "You are an incident communications lead supporting an engineering team during a live service incident.",
      objective: "Draft a status update that tells customers what happened, what is affected, what is being done, and when to expect the next update.",
      context: "Use only the confirmed incident facts provided by the team. The audience may be stressed and scanning on mobile.",
      guidelines: "Lead with impact, use plain language, name workarounds when verified, and separate confirmed facts from investigation.",
      constraints: "Never speculate about root cause or recovery time. Never include private customer data, credentials, or internal blame.",
      output: "Return a public update under 120 words plus an internal follow-up checklist.",
    },
    content: "",
    category: "Operations",
    tags: ["incident", "communication", "reliability"],
    author: "Elena Rossi",
    authorInitials: "ER",
    isPublic: true,
    likes: 81,
    views: 990,
    createdAt: "2026-08-24T11:45:00.000Z",
    updatedAt: "2026-08-24T11:45:00.000Z",
  },
  {
    id: "starter-creative-director",
    title: "Creative direction from a rough idea",
    description: "Turn a half-formed concept into an expressive brief without sanding away its personality.",
    mode: "conversational",
    sections: {
      role: "You are a thoughtful creative director who protects the original spark while making an idea actionable.",
      objective: "Shape the idea into a visual direction with mood, composition, references, and clear creative boundaries.",
      context: "Ask one high-leverage question at a time when the idea is underspecified.",
      guidelines: "Offer a few distinct directions, explain the tradeoffs, and use evocative but precise language.",
      constraints: "Avoid generic trend language and avoid copying named artists or living creators.",
      output: "End with a one-paragraph creative brief and a short list of next experiments.",
    },
    content: "",
    category: "Creative work",
    tags: ["creative", "visual", "ideation"],
    author: "Theo Grant",
    authorInitials: "TG",
    isPublic: true,
    likes: 63,
    views: 824,
    createdAt: "2026-08-19T08:12:00.000Z",
    updatedAt: "2026-08-19T08:12:00.000Z",
  },
  {
    id: "starter-knowledge-synth",
    title: "The evidence-first knowledge synthesizer",
    description: "Synthesize a set of sources into a clear answer while keeping uncertainty visible.",
    mode: "meta",
    sections: {
      role: "You are an evidence-first research assistant.",
      objective: "Compare the supplied sources and produce a useful synthesis with claims linked to supporting evidence.",
      context: "Sources may disagree or have different levels of authority and recency.",
      guidelines: "Distinguish direct evidence, inference, and open questions. Surface disagreements instead of averaging them away.",
      constraints: "Do not invent citations or fill gaps with confident guesses.",
      output: "Return an executive summary, evidence table, caveats, and questions for further research.",
    },
    content: "",
    category: "Research & analysis",
    tags: ["research", "synthesis", "reasoning"],
    author: "Priya Nair",
    authorInitials: "PN",
    isPublic: true,
    likes: 57,
    views: 760,
    createdAt: "2026-08-16T12:55:00.000Z",
    updatedAt: "2026-08-16T12:55:00.000Z",
  },
];

const PROMPTS_STORAGE_KEY = "promptgineer-prompts-v2";
const CONNECTED_SERVICES_KEY = "promptgineer-services-v1";
const SETTINGS_STORAGE_KEY = "promptgineer-settings-v1";

export function composePrompt(sections: PromptSections): string {
  const blocks: Array<[string, string]> = [
    ["Role", sections.role],
    ["Objective", sections.objective],
    ["Context", sections.context],
    ["Guidelines", sections.guidelines],
    ["Constraints", sections.constraints],
    ["Output format", sections.output],
  ];

  return blocks
    .filter(([, value]) => value.trim())
    .map(([label, value]) => `${label.toUpperCase()}\n${value.trim()}`)
    .join("\n\n");
}

export function getAllPrompts(): PromptRecord[] {
  if (typeof window === "undefined") return starterPrompts;

  try {
    const stored = window.localStorage.getItem(PROMPTS_STORAGE_KEY);
    if (!stored) return starterPrompts;
    const parsed = JSON.parse(stored) as PromptRecord[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : starterPrompts;
  } catch {
    return starterPrompts;
  }
}

export function savePrompt(prompt: PromptRecord): PromptRecord {
  const existing = getAllPrompts().filter((item) => item.id !== prompt.id);
  const next = [prompt, ...existing];
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(next));
  }
  return prompt;
}

export function getPromptById(id: string): PromptRecord | undefined {
  return getAllPrompts().find((prompt) => prompt.id === id);
}

export function createPromptId(): string {
  return `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getConnectedServices(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(CONNECTED_SERVICES_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function setConnectedService(serviceId: string, connected: boolean): string[] {
  const current = getConnectedServices().filter((id) => id !== serviceId);
  const next = connected ? [...current, serviceId] : current;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONNECTED_SERVICES_KEY, JSON.stringify(next));
  }
  return next;
}

export type LocalSettings = {
  displayName: string;
  emailDigest: boolean;
  showPublicProfile: boolean;
  reducedMotion: boolean;
};

export const defaultLocalSettings: LocalSettings = {
  displayName: "Alex Morgan",
  emailDigest: true,
  showPublicProfile: true,
  reducedMotion: false,
};

export function getLocalSettings(): LocalSettings {
  if (typeof window === "undefined") return defaultLocalSettings;
  try {
    return { ...defaultLocalSettings, ...JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}") };
  } catch {
    return defaultLocalSettings;
  }
}

export function saveLocalSettings(settings: LocalSettings): LocalSettings {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }
  return settings;
}

export const leaderboardEntries = [
  { name: "Maya Chen", initials: "MC", points: 1280, prompts: 42, badge: "Systems thinker" },
  { name: "Jon Bell", initials: "JB", points: 1045, prompts: 35, badge: "Signal finder" },
  { name: "Samira Okafor", initials: "SO", points: 920, prompts: 29, badge: "Clarity champion" },
  { name: "Elena Rossi", initials: "ER", points: 760, prompts: 24, badge: "Steady hand" },
  { name: "Theo Grant", initials: "TG", points: 615, prompts: 18, badge: "Creative catalyst" },
];
