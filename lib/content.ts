/**
 * All site copy lives here. Components import from this file only.
 */

export const brand = {
  name: "NEXUS",
  tagline: "Multi-hop investigative retrieval",
};

export const nav = {
  cta: "Request access",
};

export const hero = {
  eyebrow: "Multi-hop investigative RAG",
  line1: "Ask once.",
  line2: "Know everything.",
  subline:
    "Multi-hop retrieval across every source you own, with every claim cited.",
  primary: "Request access",
  secondary: "Watch it reason",
  scroll: "Scroll",
};

export const story = {
  eyebrow: "How a question travels",
  stages: [
    {
      n: "01",
      title: "Decompose",
      body: "A complex question is split into the smaller questions that actually need answering.",
    },
    {
      n: "02",
      title: "Route",
      body: "Each sub-query is sent to the source most likely to hold the answer.",
    },
    {
      n: "03",
      title: "Retrieve",
      body: "Chunks return from every source. Weak matches fall away, the strongest are re-ranked into place.",
    },
    {
      n: "04",
      title: "Connect",
      body: "Entities that appear in more than one source are linked, and the graph lights along the path.",
    },
    {
      n: "05",
      title: "Synthesize",
      body: "Everything converges into one answer, with each claim tied back to its source.",
    },
  ],
  question: "Which suppliers named in the audit also appear in the 2023 incident reports?",
  answer: "Two suppliers appear in both records.",
  answerLabel: "Answer",
  support: "Matched across the audit, the incident log and the entity graph.",
  confidence: "0.94",
  labels: ["PDF", "SQL", "WEB"],
};

export const sources = {
  rowA: ["PDFs", "SQL", "Notion", "Slack", "Web", "APIs", "Drive", "Confluence"],
  rowB: ["Confluence", "Drive", "APIs", "Web", "Slack", "Notion", "SQL", "PDFs"],
};

export const bento = {
  eyebrow: "Capabilities",
  title: "Built to follow the thread.",
  tiles: [
    {
      id: "decompose",
      title: "Query Decomposition",
      body: "Breaks a broad question into ordered sub-queries before any retrieval begins.",
    },
    {
      id: "graph",
      title: "Knowledge Graph",
      body: "Entities and relations are linked across sources, so one answer can span many documents.",
    },
    {
      id: "reflect",
      title: "Self-Reflection Loop",
      body: "Each draft is checked against its evidence. Gaps trigger another retrieval pass.",
    },
    {
      id: "hybrid",
      title: "Hybrid Retrieval",
      body: "Dense vectors and keyword search run together, then merge into one ranked set.",
    },
    {
      id: "attribution",
      title: "Source Attribution",
      body: "Every claim carries a citation down to the passage it came from.",
    },
    {
      id: "routing",
      title: "Multi-Source Routing",
      body: "Sub-queries are sent only to the sources that can answer them.",
    },
  ],
};

export const trace = {
  eyebrow: "Live reasoning trace",
  title: "Watch it work.",
  replay: "Replay",
  query: "Which suppliers in the 2023 audit also appear in incident reports?",
  /** Each line: tag, text. `conf` marks the lines where confidence updates. */
  lines: [
    { tag: "decompose", text: "3 sub-queries: supplier list, incident log, name overlap", conf: 0.61 },
    { tag: "route", text: "q1 → Drive/audit.pdf · q2 → SQL/incidents · q3 → graph", conf: 0.68 },
    { tag: "fetch", text: "41 chunks retrieved across 3 sources", conf: 0.74 },
    { tag: "reflect", text: "q3 evidence thin, second pass with alias matching", conf: 0.82 },
    { tag: "graph", text: "2 entities matched across audit and incident records", conf: 0.89 },
    { tag: "answer", text: "Two suppliers appear in both records.", conf: 0.94 },
    { tag: "source", text: "[1] audit_2023.pdf p.14  [2] incidents.sql #882  [3] #1107", conf: 0.94 },
  ],
  confidenceLabel: "confidence",
};

/**
 * PLACEHOLDER VALUES. None of these figures are measured.
 * Replace with real benchmarks before launch.
 */
export const stats = {
  eyebrow: "The numbers",
  items: [
    { value: 40, prefix: "", suffix: "+", decimals: 0, label: "Sources supported" }, // PLACEHOLDER
    { value: 1.8, prefix: "", suffix: "s", decimals: 1, label: "Median latency" }, // PLACEHOLDER
    { value: 31, prefix: "+", suffix: "%", decimals: 0, label: "Retrieval accuracy lift" }, // PLACEHOLDER
    { value: 98, prefix: "", suffix: "%", decimals: 0, label: "Citation coverage" }, // PLACEHOLDER
  ],
};

export const stack = {
  eyebrow: "Stack",
  title: "Considered parts.",
  rows: [
    { name: "LlamaIndex", role: "Orchestration" },
    { name: "Pinecone", role: "Vector retrieval" },
    { name: "Neo4j", role: "Knowledge graph" },
    { name: "Cohere Rerank", role: "Re-ranking" },
    { name: "Claude", role: "Reasoning and synthesis" },
    { name: "FastAPI", role: "Service layer" },
  ],
};

export const pricing = {
  eyebrow: "Access",
  title: "Choose how you begin.",
  cta: "Request access",
  tiers: [
    {
      name: "Explorer",
      note: "For individuals",
      features: ["5 connected sources", "Cited answers", "Reasoning trace", "Community support"],
      featured: false,
    },
    {
      name: "Studio",
      note: "For teams",
      features: ["25 connected sources", "Shared knowledge graph", "Self-reflection loop", "Priority support"],
      featured: true,
    },
    {
      name: "Enterprise",
      note: "For organizations",
      features: ["Unlimited sources", "Private deployment", "SSO and audit logs", "Dedicated engineer"],
      featured: false,
    },
  ],
};

export const finalCta = {
  line: "Start with one question.",
  button: "Request access",
};

export const footer = {
  columns: [
    { title: "Product", links: ["Overview", "How it works", "Capabilities", "Pricing"] },
    { title: "Developers", links: ["Documentation", "API reference", "Changelog", "Status"] },
    { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
    { title: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] },
  ],
  legal: "© 2026 NEXUS. All rights reserved.",
  wordmark: "NEXUS",
};

export const preloader = {
  word: "NEXUS",
  skip: "Skip",
};
