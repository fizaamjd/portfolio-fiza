import { RECOVERED_PROJECTS } from "@/lib/recovered-projects";

/**
 * All portfolio content lives here.
 * Everything below is sourced from Fiza's resumes - edit this file to update the site.
 */

export const PROFILE = {
  name: "Fiza Amjad",
  role: "Full-Stack Engineer",
  spec: "AI Systems",
  location: "Lahore, Pakistan",
  email: "fizaamjad444@gmail.com",
  phone: "+92 323 4894774",
  linkedin: "https://www.linkedin.com/in/fiza-amjad-a74891271/",
  // Handle confirmed by the user (renamed from fizaamjad897; GitHub redirects
  // the old URLs, but every link here uses the current handle).
  github: "https://github.com/fizaamjd",
  resumeHref: "/fiza-amjad-resume.pdf",
  /**
   * Hero portrait. Any aspect works; it is cropped to 4:5 and framed.
   *
   * NOTE: next/image caches by URL, so replacing this file without changing
   * its name will keep serving the old optimised copy. Either bump the name
   * (profile-2.png) or clear the cache: rm -rf .next/cache/images
   */
  photo: "/profile.png",
  yearsExperience: "1.5",
  currentTenure: "Jun 2025 - Present",
  tagline:
    "I build the whole column, from the pixel a user taps to the context switch in the kernel.",
  /** The paragraph under the name in the hero. Rewrite freely. */
  intro:
    "Hey, I'm Fiza. I build things for the web, mostly with AI in them lately. I like the messy parts nobody volunteers for: the schema nobody wants to redesign, the deploy nobody wants to own, the bug that only shows up in production.",
  /** Short status line above the name. Keep it to a few words. */
  status: "Lahore, Pakistan",
} as const;

export type Metric = { label: string; value: string };

export type Specimen = {
  id: string;
  name: string;
  kind: "product" | "project" | "research";
  tagline: string;
  window: string;
  stack: string[];
  brief: string;
  findings: string[];
  metrics?: Metric[];
  /**
   * Live deployment. Renders a "try it live" button that opens the real thing
   * in a new tab. Deliberately not iframed: a deployed app inside a panel is
   * cramped, slow, often refused by the host outright, and it lets a viewer
   * poke at a half-usable copy instead of the real one.
   */
  liveUrl?: string;
  /** Source repository. Renders a "Source" button. */
  repoUrl?: string;
  /** Original public project demonstration or launch post. */
  linkedinUrl?: string;
  /**
   * Screenshot for the spotlight and cards. Drop files in public/projects/
   * (e.g. "/projects/infinium.png"). Until one exists, a generated abstract
   * poster stands in - so the layout never looks unfinished.
   */
  image?: string;
  /**
   * A standalone motion reel for the project: a self-contained HTML file in
   * public/motion/, referenced as "/motion/staffflow.html". When set it
   * becomes the project's preview: it leads the dossier, and it plays as the
   * project's thumbnail on the cards. See public/motion/README.txt for the
   * flags a reel has to honour.
   */
  reel?: string;
  /**
   * Work done for an employer rather than a personal project. These stay in
   * LAYERS, because the game's levels index terminals into each layer's
   * specimen array and the validator wants every one of them reachable, but
   * the gallery leaves them out and the experience section carries them under
   * the role they were shipped in.
   */
  client?: boolean;
  /** Runtime of the reel, e.g. "1:33". Shown on the frame. */
  reelLength?: string;
  /**
   * Shape of the canvas the reel is handed on its very first paint, width /
   * height, before the player has measured its slot. Defaults to 16/9, which
   * is what every slot but a stacked phone dossier is close to. The reels lay
   * themselves out from whatever shape they are given and fill it, so this
   * only decides which frame of a reel is on screen for the first tick; it is
   * not a statement about the reel's artwork.
   */
  reelAspect?: number;
};

export type LayerDef = {
  id: string;
  index: string;
  name: string;
  zone: string;
  depth: number;
  thesis: string;
  /** Narrow strip of colour identity for this layer. */
  theme: {
    paper: string;
    ink: string;
    muted: string;
    spot: string;
    rule: string;
    /** true once we're below the light line - flips texture + card treatment */
    dark: boolean;
  };
  capabilities: string[];
  specimens: Specimen[];
};

export const LAYERS: LayerDef[] = [
  {
    id: "interface",
    index: "01",
    name: "INTERFACE",
    zone: "SUNLIGHT ZONE",
    depth: 200,
    thesis:
      "The part people actually touch. Everything below this line exists to make this layer feel instant and obvious.",
    theme: {
      paper: "#EDE5D6",
      ink: "#16130F",
      muted: "#6B6152",
      spot: "#DC3F1C",
      rule: "#16130F",
      dark: false,
    },
    capabilities: [
      "React.js",
      "Next.js",
      "TypeScript",
      "Redux Toolkit",
      "Tailwind CSS",
      "GraphQL",
      "React Native",
      "Responsive Design",
      "Figma → Code",
    ],
    specimens: [
      {
        id: "slidexy",
        name: "Slidexy",
        kind: "product",
        client: true,
        tagline: "SaaS presentation platform. I led the frontend",
        window: "2025 - 2026",
        stack: ["Next.js", "TypeScript", "Redux Toolkit", "Tailwind", "GraphQL"],
        brief:
          "Led development of the Slidexy SaaS frontend, owning architecture decisions and technology selection rather than inheriting them.",
        findings: [
          "Built the frontend on Next.js + TypeScript with Redux Toolkit for state and GraphQL for the data layer.",
          "Shipped a Trip Planner feature that ingests and processes GTFS transit data.",
          "Challenged requirements instead of implementing them blindly. Several technology choices were mine to make.",
        ],
      },
      {
        id: "signagex",
        name: "SignageX",
        kind: "product",
        client: true,
        tagline: "B2B enterprise digital signage, running on real hardware",
        window: "2025 - 2026",
        stack: ["Next.js", "TypeScript", "Tizen OS", "Linux", "macOS", "PostgreSQL"],
        brief:
          "An enterprise digital signage platform where the frontend doesn't stop at the browser. It ships to Samsung smart displays and desktop targets.",
        findings: [
          "Built a Tizen OS application for Samsung smart displays.",
          "Developed Linux and macOS platform integrations.",
          "Implemented Gen-AI features in-product: image, widget and audio generation.",
          "Took full ownership of production stability, fixing what broke regardless of who broke it.",
        ],
      },
      {
        id: "tiers",
        name: "Tiers Limited",
        kind: "product",
        client: true,
        tagline: "First shipping role. A full MERN build, solo, in 12 weeks",
        window: "May - Aug 2024",
        stack: ["React.js", "Next.js", "Node.js", "Express", "MongoDB", "PostgreSQL"],
        brief:
          "A software engineering internship that was really a solo delivery: requirements to production, no hand-holding.",
        findings: [
          "Completed 100% of development tasks independently inside a 12-week window.",
          "Built 15+ dynamic, responsive React components wired to REST APIs and a MongoDB backend.",
          "Implemented authentication, RBAC and business logic; collaborated with designers on Figma-to-code.",
        ],
        metrics: [
          { label: "Components", value: "15+" },
          { label: "Weeks", value: "12" },
          { label: "Autonomy", value: "100%" },
        ],
      },
    ],
  },
  {
    id: "service",
    index: "02",
    name: "SERVICE",
    zone: "TWILIGHT ZONE",
    depth: 800,
    thesis:
      "APIs, service layers, and the architectural decisions nobody sees until they're wrong.",
    theme: {
      paper: "#CFC4AE",
      ink: "#16130F",
      muted: "#5E5546",
      spot: "#B93A16",
      rule: "#16130F",
      dark: false,
    },
    capabilities: [
      "Node.js",
      "NestJS",
      "Express.js",
      "FastAPI",
      "REST APIs",
      "GraphQL",
      "WebSockets",
      "JWT / RBAC",
      "Docker",
      "CI/CD",
      "Nginx / PM2",
      "DigitalOcean",
    ],
    specimens: [
      {
        id: "staffflow",
        name: "StaffFlow",
        kind: "project",
        tagline: "Shift management with an explainable scheduling engine",
        window: "2025",
        stack: ["Next.js", "Node.js", "Express", "MongoDB", "JWT", "Recharts"],
        brief:
          "A workforce management platform whose interesting part isn't the CRUD. It's a custom scheduling engine that has to justify itself.",
        findings: [
          "Designed an algorithmic scheduling and recommendation engine ranking employees per shift across department fit, availability, preferences, fairness, overtime and skill level.",
          "Generates conflict-free schedules with explainable match scores, so a manager can see why someone was picked.",
          "Built the REST API over shifts, employees, payroll, reporting and notifications, with MongoDB aggregation pipelines driving analytics.",
          "Hardened with Helmet, CORS allow-listing, rate limiting, bcrypt, RBAC and Zod validation.",
        ],
        metrics: [
          { label: "Ranking signals", value: "6" },
          { label: "Scores", value: "Explainable" },
        ],
        image: "/projects/staffflow.png",
        liveUrl: "https://staff-flow-silk.vercel.app/",
        repoUrl: "https://github.com/fizaamjd/StaffFlow",
        reel: "/motion/staffflow.html",
        reelLength: "1:12",
        reelAspect: 16 / 9,
      },
      {
        id: "versa",
        name: "Versa",
        kind: "product",
        tagline: "A creative workflow across web, image processing, and mobile",
        window: "2026",
        stack: ["Next.js", "FastAPI", "Gemini", "MongoDB", "DigitalOcean Spaces", "Stripe", "Expo"],
        brief:
          "An image transformation and creation workspace for agency teams, with a Next.js frontend, FastAPI backend, and Expo mobile app. The current backend maps five standard output formats, stores image history, and produces design compliance reports.",
        findings: [
          "Built transformation and creation flows using Gemini image generation, Pillow output fitting, and DigitalOcean Spaces storage.",
          "Implemented account and organization workflows, engine-specific credit tracking, Stripe billing integration, and an image archive.",
          "Added technical and visual compliance checks, with optional Gemini vision analysis and reports that support PASS, WARN, and FAIL outcomes.",
          "Extended the workflow to an Expo / React Native app for transformation, creation, results, and history.",
          "Created the Versa spec-sheet identity across web and mobile, with five supported output presets and reviewable compliance reports.",
        ],
        metrics: [
          { label: "Backend formats", value: "5" },
          { label: "App surfaces", value: "Web + mobile" },
          { label: "API", value: "FastAPI" },
        ],
        liveUrl: "https://versa-workspace.vercel.app",
        repoUrl: "https://github.com/fizaamjd/Versa",
        image: "/projects/versa/engine-compact.jpg",
        reel: "/motion/versa-reel.html",
        reelLength: "0:36",
        reelAspect: 16 / 9,
      },
    ],
  },
  {
    id: "persistence",
    index: "03",
    name: "PERSISTENCE",
    zone: "MIDNIGHT ZONE",
    depth: 1600,
    thesis:
      "Schemas, indexes and query plans. The layer where a careless decision becomes permanent.",
    theme: {
      paper: "#3E4348",
      ink: "#E8E3D8",
      muted: "#9AA0A4",
      spot: "#E8853A",
      rule: "#5C6268",
      dark: true,
    },
    capabilities: [
      "PostgreSQL",
      "MongoDB",
      "SQL Server",
      "Schema Design",
      "Indexing",
      "Query Optimisation",
      "Aggregation Pipelines",
      "Stored Procedures",
      "ETL",
    ],
    specimens: [
      {
        id: "sentiment",
        name: "Social Media Sentiment Analysis",
        kind: "project",
        tagline: "Normalised schemas, triggers, and a pipeline that runs itself",
        window: "2024",
        stack: ["React.js", "Node.js", "SQL", "Power BI", "Crystal Reports"],
        repoUrl: "https://github.com/asimalimurtaza/social-media-sentiment-analysis",
        reel: "/motion/sentiment-reel.html",
        reelLength: "0:42",
        reelAspect: 16 / 9,
        brief:
          "A sentiment platform built data-layer-first: the frontend is the smallest part of it.",
        findings: [
          "Designed normalised SQL schemas with stored procedures and triggers.",
          "Built automated ETL pipelines ingesting, transforming and persisting 1,000+ sentiment records with zero manual intervention.",
          "Classified and streamed social data in real time through a REST pipeline at 90% accuracy.",
          "Delivered drill-down Power BI dashboards by platform, keyword and time range, plus structured Crystal Reports exports.",
        ],
        metrics: [
          { label: "Accuracy", value: "90%" },
          { label: "Records", value: "1,000+" },
          { label: "Manual steps", value: "0" },
        ],
      },
    ],
  },
  {
    id: "inference",
    index: "04",
    name: "INFERENCE",
    zone: "ABYSSAL ZONE",
    depth: 3000,
    thesis:
      "Where the system stops looking things up and starts reasoning. Retrieval, embeddings, and models that have to explain themselves.",
    theme: {
      paper: "#141A1C",
      ink: "#E4EDE9",
      muted: "#7C8C88",
      spot: "#2FBF8F",
      rule: "#2A3538",
      dark: true,
    },
    capabilities: [
      "RAG Pipelines",
      "LangChain",
      "ChromaDB",
      "Ollama",
      "Groq API",
      "Azure OpenAI",
      "PyTorch",
      "TensorFlow",
      "CNNs",
      "SHAP / LIME",
      "OpenCV",
      "Prompt Engineering",
    ],
    specimens: [
      {
        id: "infinium",
        name: "Infinium",
        kind: "project",
        tagline: "An AI reasoning agent that reads codebases",
        window: "2025 - 2026",
        stack: ["RAG", "ChromaDB", "FastAPI", "Next.js", "Supabase", "Ollama"],
        brief:
          "Ask a natural-language question about a GitHub repository and get a reasoned answer, along with the retrieval trace that produced it. Supports configured local or cloud models; data handling depends on the selected provider.",
        findings: [
          "Ingests source, commits and docs into ChromaDB using configured embedding models.",
          "Led the AI/RAG implementation: semantic retrieval, embedding generation, MMR filtering, reasoning-trace generation and LLM orchestration.",
          "Supports Ollama local and cloud models. Private source handling depends on the configured model provider and deployment.",
          "Generates documentation and architecture diagrams automatically; performs AI-assisted refactoring.",
          "Stores feedback and can reuse relevant feedback examples in subsequent retrieval and generation.",
          "GitHub OAuth with webhook-triggered incremental repo sync, multi-turn conversation memory, PDF analysis via Groq.",
          "Includes documented functional requirements and manual check instructions; offline CI covers chunk boundaries and extension compilation.",
        ],
        metrics: [
          { label: "Retrieval store", value: "ChromaDB" },
          { label: "Model runtime", value: "Ollama" },
          { label: "Provider mode", value: "Local / cloud" },
        ],
        liveUrl: "https://infinium-fe.vercel.app",
        repoUrl: "https://github.com/fizaamjd/Infinium-FE",
        reel: "/motion/infinium-motion-reel.html",
        reelLength: "1:17",
        reelAspect: 1,
      },
      {
        id: "knee",
        name: "Knee Osteoarthritis Grading",
        kind: "research",
        tagline: "Four CNNs fine-tuned on knee X-rays, and made to explain themselves",
        window: "2025",
        stack: ["TensorFlow", "Keras", "Xception", "SHAP", "LIME", "Streamlit"],
        brief:
          "A deep-learning pipeline for grading knee osteoarthritis from radiographs on the Kellgren-Lawrence scale, built for clinical trust rather than leaderboard scores. Contributed to an academic publication at UET Lahore.",
        findings: [
          "Fine-tuned ResNet-50, Xception, InceptionResNetV2 and DenseNet201 from ImageNet weights, with every layer trainable, and compared them on the same 2,750-image evaluation set.",
          "Countered a 13:1 class imbalance (177 grade-4 X-rays against 2,315 grade-0) with a class-weighted loss and on-the-fly augmentation.",
          "Xception led at 86.6% accuracy and 90.2% balanced accuracy, ahead of InceptionResNetV2 (78.6%), DenseNet201 (76.1%) and ResNet-50 (70.1%).",
          "Integrated SHAP and LIME to show the regions of each X-ray that drove its predicted grade, and wrapped the model in a Streamlit app.",
        ],
        metrics: [
          { label: "Accuracy", value: "86.6%" },
          { label: "Balanced accuracy", value: "90.2%" },
          { label: "Architectures", value: "4" },
        ],
        reel: "/motion/knee-oa-reel.html",
        reelLength: "1:40",
        reelAspect: 1,
      },
      
      {
        id: "zerotrust",
        name: "Zero Trust Metadata Authority",
        kind: "project",
        tagline: "Image provenance behind five gates and a hash-linked ledger",
        window: "2026",
        stack: ["Python", "Streamlit", "RSA-PSS", "scikit-learn", "SHA-256"],
        brief:
          "A provenance service for images, built on the Zero Trust premise that nothing is trusted because it arrived and nothing stays trusted because it was trusted before. Every upload is re-verified through five independent gates, and only a submission that clears all five is appended to an append-only ledger whose blocks commit to their predecessor.",
        findings: [
          "Built five independent gates over each upload: canonical extraction, an RSA-2048 PSS signature, a random-forest plausibility check, severity-ranked anomaly rules and the ledger append. A rejection at any gate means nothing is written.",
          "Made the ledger an actual chain. Each block commits to its predecessor's digest, and a verifier walks the file and names the first index that fails, so an edited block is caught even if its own hash is recomputed.",
          "Persisted the signing key instead of generating it per process, so a signature stays verifiable across restarts, and gave signing and verification one canonical serialisation so field order cannot silently break a check.",
          "Moved authorisation to the point of use rather than login, with sessions that expire on their own and constant-time credential comparison.",
          "Generated a reproducible 480-row dataset where each forged row breaks exactly one rule, so no single feature gives the label away, and scored the forest with cross validation rather than a single held-out sample.",
        ],
        metrics: [
          { label: "Verification gates", value: "5" },
          { label: "Tests", value: "28" },
          { label: "Signature", value: "RSA-2048" },
        ],
        repoUrl: "https://github.com/fizaamjd/Zero-Trust-Metadata-Authority",
        image: "/projects/zerotrust/poster.jpg",
        reel: "/motion/zerotrust-reel.html",
        reelLength: "0:26",
      },
      {
        id: "smartinbox",
        name: "SmartInbox AI",
        kind: "product",
        tagline: "LLM email triage, built out into a whole product",
        window: "2026",
        stack: [
          "React",
          "Express",
          "MongoDB",
          "n8n",
          "Groq",
          "JWT",
          "Docker",
        ],
        brief:
          "Incoming mail is classified by an LLM into five categories, routed on to Discord and Google Sheets, and surfaced on a multi-user dashboard. The automation is one part of it rather than the whole of it.",
        findings: [
          "Built the n8n workflow that polls a real Gmail inbox, classifies each message with Groq (Llama 3.3 70B) and hands it to the API.",
          "Wrote the Express and MongoDB backend: per-user accounts on JWT and bcrypt, with each user's mail, categories and routing rules isolated from every other's.",
          "Put a keyword fallback underneath the model, so classification degrades to rules instead of hard-failing when there is no API key or the model is unreachable.",
          "Built the React dashboard: live stats, per-user settings, and a Simulate screen that runs one email through your own rules so the product is usable without connecting a real inbox.",
          "Packaged the whole stack to come up locally under one docker compose command, and deployed it across Render and Vercel.",
        ],
        metrics: [
          { label: "Categories", value: "5" },
          { label: "Classifier", value: "Llama 3.3 70B" },
          { label: "Degrades to", value: "Keyword rules" },
        ],
        liveUrl: "https://smart-inbox-six.vercel.app",
        repoUrl: "https://github.com/fizaamjd/Smart-Inbox",
        reel: "/motion/smart-inbox-reel.html",
        reelLength: "1:09",
        reelAspect: 1,
      },
    ],
  },
  {
    id: "distributed",
    index: "05",
    name: "DISTRIBUTED",
    zone: "HADAL ZONE",
    depth: 4500,
    thesis:
      "Nodes that fail are easy. This is the layer for nodes that lie.",
    theme: {
      paper: "#0E0C10",
      ink: "#EDE6DC",
      muted: "#7A7183",
      spot: "#FF5C39",
      rule: "#241F29",
      dark: true,
    },
    capabilities: [
      "Discrete-Event Simulation",
      "Byzantine Fault Modelling",
      "Chaos Engineering",
      "LRU / TTL Caching",
      "WebSockets",
      "Priority Queues",
      "Docker",
    ],
    specimens: [
      {
        id: "cachenet",
        name: "CacheNet",
        kind: "project",
        tagline: "A distributed cache simulator with a chaos monkey inside it",
        window: "2025",
        stack: [
          "Python",
          "FastAPI",
          "Next.js",
          "TypeScript",
          "WebSockets",
          "LangChain",
          "Docker",
        ],
        brief:
          "A discrete-event simulation engine for distributed caching, built to answer a harder question than 'does it work': what happens when parts of the system are actively dishonest.",
        findings: [
          "Built the simulation engine with priority-queue scheduling and autonomous agents modelling service nodes, clients, a load balancer, Byzantine faulty nodes and a chaos monkey.",
          "Implemented an LRU cache with TTL and invalidation on an OrderedDict for O(1) reads and writes.",
          "Made Byzantine node count, network latency and chaos-monkey behaviour configurable for resilience testing.",
          "Streamed live metrics (hit ratio, latency, per-node performance) to a Next.js dashboard over WebSockets.",
          "Wired in a Groq (Llama 3.3 70B) + LangChain analyst that explains a simulation run in natural language.",
        ],
        metrics: [
          { label: "Cache ops", value: "O(1)" },
          { label: "Failure modes", value: "Byzantine + chaos" },
          { label: "Agent types", value: "8" },
        ],
        liveUrl: "https://cachenet-simulator.vercel.app",
        repoUrl: "https://github.com/fizaamjd/CacheNet",
        reel: "/motion/cachenet-reel.html",
        reelLength: "1:26",
        reelAspect: 16 / 9,
      },
      {
        id: "postal",
        name: "ThePostal",
        kind: "project",
        tagline: "A mail server that opens a socket instead of writing a row",
        window: "2025 - 2026",
        stack: [
          "TypeScript",
          "Fastify",
          "Next.js",
          "BullMQ",
          "Prometheus",
          "MongoDB",
          "Docker",
        ],
        brief:
          "A self-hosted SMTP mail transfer agent that speaks RFC 5321 directly on sockets, in both directions, and times every phase of the transaction it performs.",
        findings: [
          "Wrote the SMTP client against raw sockets rather than a library: MX lookup, TCP connect, STARTTLS, EHLO, the envelope and the DATA phase, each one spoken and parsed by hand.",
          "Times all ten phases of a delivery separately, so a slow send can be attributed to DNS, the handshake or the payload instead of being one opaque number.",
          "Runs an inbound SMTP daemon as well, accepting mail from any standards-compliant client and filing it into the addressed mailbox.",
          "Queued delivery with retries on BullMQ, Prometheus metrics, and argon2 password hashing behind a Fastify API.",
          "Built the dashboard in Next.js, with the per-phase timings of every message on it.",
        ],
        metrics: [
          { label: "Phases timed", value: "10" },
          { label: "Protocol", value: "RFC 5321" },
          { label: "Direction", value: "Send + receive" },
        ],
        liveUrl: "https://the-postal.vercel.app",
        repoUrl: "https://github.com/fizaamjd/ThePostal",
        reel: "/motion/postal-reel.html",
        reelLength: "1:20",
        reelAspect: 1,
      },
    ],
  },
  {
    id: "kernel",
    index: "06",
    name: "KERNEL",
    zone: "THE TRENCH",
    depth: 6000,
    thesis:
      "The floor. Privilege rings, context switches, and C that has to be right the first time.",
    theme: {
      paper: "#08070A",
      ink: "#FFC24D",
      muted: "#8A7042",
      spot: "#FFB000",
      rule: "#241C0E",
      dark: true,
    },
    capabilities: [
      "C",
      "GTK",
      "Preemptive Multitasking",
      "Context Switching",
      "Process Scheduling",
      "System Calls",
      "Bash",
    ],
    specimens: [
      {
        id: "customos",
        name: "CustomOS",
        kind: "project",
        tagline: "A C and GTK desktop simulator for Ubuntu",
        window: "2024",
        stack: ["C", "GTK 3", "Ubuntu", "POSIX Processes"],
        brief: "An educational C and GTK 3 desktop simulator for Ubuntu. User Mode launches utility programs such as Calculator and Notepad; Kernel Mode exposes process inspection and PID-based cancellation. Tasks start through fork and exec, while RAM, disk and CPU allocations are simulated counters. Linux retains real scheduling and privilege control.",
        findings: [
          "Built a GTK shell and independent utility applications in C.",
          "Launches tasks with fork and exec through the host terminal.",
          "Exposes process inspection and PID-based cancellation through an administrative interface.",
          "Models RAM, disk and CPU budgets with counters; Linux handles actual scheduling and privilege enforcement.",
        ],
        repoUrl: "https://github.com/fizaamjd/OSFinalProject",
        linkedinUrl: "https://lnkd.in/p/d_2DEMH8",
        image: "/projects/customos/poster.png",
        reel: "/motion/os-final-project.html",
        reelLength: "0:36",
        reelAspect: 16 / 9,
      },
      {
        id: "chromalink",
        name: "ChromaLink IoT",
        kind: "project",
        tagline: "From a phone command to a physical output, through AVR assembly",
        window: "2023 / 2026 rewrite",
        stack: ["AVR Assembly", "Arduino UNO", "ESP32", "MQTT", "UART", "ThingSpeak"],
        brief:
          "An RGB lighting controller with two input paths: five physical buttons and MQTT commands from a phone. An ESP32 bridges the network to an Arduino UNO over UART, while assembly firmware drives the LED. Originally built for Computer Organization & Assembly Language in 2023; the current firmware is a 2026 rewrite after the original source was lost.",
        findings: [
          "Wrote the ATmega328P controller in AVR assembly: GPIO, USART, Timer1 CTC, and flash lookup tables without the Arduino core.",
          "Mapped five local buttons and single-character UART commands to yellow, magenta, white, color cycle, and off.",
          "Used a polled 10 ms timer tick to advance the color cycle every 500 ms while continuing to check input.",
          "Built the ESP32 MQTT-to-UART bridge and a rate-limited ThingSpeak logger that keeps the latest remote command. Local button changes are not reported back to the ESP32.",
          "Preserved the original hardware photo and demonstration video, with an Arduino C reference implementation alongside the assembly rewrite.",
        ],
        metrics: [
          { label: "Lighting modes", value: "5" },
          { label: "UART", value: "9600 baud" },
          { label: "Timer tick", value: "10 ms" },
        ],
        image: "/projects/chroma-link-build.jpg",
        repoUrl: "https://github.com/fizaamjd/Chroma-Link-IoT",
        reel: "/motion/chroma-link-reel.html",
        reelLength: "0:47",
        reelAspect: 1,
      },
    ],
  },
  {
    id: "foundations",
    index: "07",
    name: "FOUNDATIONS",
    zone: "BEDROCK",
    depth: 7000,
    thesis: "The earlier games and coursework that taught me how programs hold together.",
    theme: { paper: "#182323", ink: "#edf3f5", muted: "#b3c8c6", spot: "#e5b27c", rule: "#51726d", dark: true },
    capabilities: ["Unity and C#", "Object-oriented design", "Console games", "Programming fundamentals"],
    specimens: RECOVERED_PROJECTS,
  },
];

/* ==================================================================== *
 * Projects, flattened.
 *
 * The site renders from PROJECTS; LAYERS above is the source of truth and
 * also drives the game. To add a project: drop a new Specimen into the
 * right layer's `specimens` array, then give it a focus below.
 * ==================================================================== */

/* ==================================================================== *
 * Categories.
 *
 * The gallery used to group by LAYERS, which is the six-level model the game
 * runs on. As a set of headings it did not work: three of the six held a
 * single project each, so the page read as thin rather than as wide-ranging.
 * These three are broader on purpose, every project belongs to exactly one,
 * and they still run surface-to-metal so the range is the argument.
 *
 * LAYERS stays exactly as it is - the game levels and their validator depend
 * on it, and a project's `layerId` is untouched.
 * ==================================================================== */

export type GroupId = "product" | "intelligence" | "systems" | "foundations";

export const GROUPS: {
  id: GroupId;
  name: string;
  blurb: string;
  ids: string[];
}[] = [
  {
    id: "product",
    name: "shipped products",
    blurb:
      "Products rather than experiments: an interface, the services under it, and the parts that had to keep working once people were depending on them.",
    ids: ["smartinbox", "versa", "staffflow"],
  },
  {
    id: "intelligence",
    name: "ai & machine learning",
    blurb:
      "Retrieval, embeddings, and models that have to explain themselves rather than just score well. The half of the work that is currently growing fastest.",
    ids: ["infinium", "knee", "sentiment"],
  },
  {
    id: "systems",
    name: "closer to the metal",
    blurb:
      "Sockets, schedulers, caches and privilege rings. Further from the user, where a careless decision becomes permanent and C has to be right the first time.",
    ids: ["cachenet", "postal", "customos", "chromalink"],
  },
  {
    id: "foundations",
    name: "games & foundations",
    blurb: "Earlier work in game development, object-oriented desktop applications, and programming fundamentals. Original projects, with their context and limitations preserved.",
    ids: ["planet1", "dungeon", "oopstore", "pacman", "cppfundamentals"],
  },
];

const GROUP_OF: Record<string, GroupId> = Object.fromEntries(
  GROUPS.flatMap((g) => g.ids.map((id) => [id, g.id])),
);

export type Focus = "ai" | "backend" | "frontend" | "data" | "systems";

export const FOCUS_LABEL: Record<Focus, string> = {
  ai: "AI / ML",
  backend: "Backend",
  frontend: "Frontend",
  data: "Data",
  systems: "Systems",
};

/** Which lenses each project should surface under. Order doesn't matter. */
const FOCUS_MAP: Record<string, Focus[]> = {
  slidexy: ["frontend"],
  signagex: ["frontend", "systems", "ai"],
  tiers: ["frontend", "backend"],
  staffflow: ["backend", "data"],
  versa: ["ai", "backend", "frontend"],
  sentiment: ["data", "backend"],
  infinium: ["ai", "backend"],
  knee: ["ai"],
  zerotrust: ["ai", "backend", "systems"],
  smartinbox: ["ai", "backend"],
  cachenet: ["systems", "backend", "ai"],
  postal: ["systems", "backend"],
  customos: ["systems"],
  chromalink: ["systems"],
  planet1: ["systems", "frontend"],
  dungeon: ["systems"],
  oopstore: ["frontend", "data"],
  pacman: ["systems"],
  cppfundamentals: ["systems"],
};

/** Projects worth leading with, in order. Everything else follows. */
const HEADLINE = ["infinium", "cachenet", "customos"];

export type Project = Specimen & {
  layer: string;
  layerId: string;
  group: GroupId;
  depth: number;
  focus: Focus[];
  headline: boolean;
};

export const PROJECTS: Project[] = LAYERS.flatMap((layer) =>
  layer.specimens.map((specimen) => ({
    ...specimen,
    layer: layer.name,
    layerId: layer.id,
    group: GROUP_OF[specimen.id] ?? "systems",
    depth: layer.depth,
    focus: FOCUS_MAP[specimen.id] ?? [],
    headline: HEADLINE.includes(specimen.id),
  })),
).sort((a, b) => {
  const ai = HEADLINE.indexOf(a.id);
  const bi = HEADLINE.indexOf(b.id);
  if (ai !== -1 && bi !== -1) return ai - bi;
  if (ai !== -1) return -1;
  if (bi !== -1) return 1;
  return a.depth - b.depth;
});

export const ALL_FOCUS = Object.keys(FOCUS_LABEL) as Focus[];

export type Post = {
  org: string;
  title: string;
  window: string;
  location: string;
  /** One line on what the place was and what the job actually involved. */
  summary: string;
  notes: string[];
  stack: string[];
  /** Project ids shipped in this role. Rendered as buttons that open them. */
  shipped?: string[];
  /**
   * Photos from this role: team shots, talks, launches, awards.
   * Drop files in public/experience/ and reference them as
   * "/experience/whatever.jpg". Any number; they lay out in a row.
   */
  /**
   * `wide` is for a landscape artifact - a contribution graph rather than a
   * photograph - which gets a 16:9 frame instead of the 4:3 the photos use,
   * because cropping a graph to 4:3 cuts months off either end of the year.
   */
  photos?: { src: string; caption?: string; wide?: boolean }[];
};

export const CAREER: Post[] = [
  {
    org: "Techinoid",
    title: "Software Engineer",
    window: PROFILE.currentTenure,
    location: "Lahore, Punjab",
    summary:
      "Full stack across digital signage, generative AI and transit products: about 1,500 commits to company repositories, and production features shipped on web, backend, desktop, mobile and signage hardware.",
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "NestJS",
      "FastAPI",
      "GraphQL",
      "PostgreSQL",
      "MongoDB",
      "Redis",
      "MQTT",
      "Flutter",
      "Kotlin",
      "Gemini / Vertex AI",
      "AWS ECS",
      "DigitalOcean",
    ],
    shipped: ["signagex", "slidexy", "smartinbox"],
    photos: [
      {
        src: "/experience/star-performer-award.jpeg",
        caption: "Receiving the Star Performer award",
      },
      {
        src: "/experience/trophy-and-certificate.jpeg",
        caption: "The award, and the certificate that came with it",
      },
      { src: "/experience/team.jpeg", caption: "Some of the team" },
      { src: "/experience/desk.jpeg", caption: "My desk at Techinoid" },
    ],
    notes: [
      "SignageX, the main product: top contributor to the cross-platform Flutter player (378 of 684 commits). Ported it to Linux x64 and ARM64 / Raspberry Pi with X11 and Wayland kiosk modes, added remote view, auto-update and resource reporting on Windows, and built the GitHub Actions pipeline that ships signed .deb releases.",
      "SignageX CMS: 93 backend commits (NestJS, GraphQL, Postgres, MongoDB, MQTT, Redis) and 154 frontend commits (Next.js 15, React 19, Konva). Built the reports overhaul with verifiable PDF certificates, the AI assistant and its publish rules, the kiosk platform, and fixes to the composition editor.",
      "Brought one player contract to seven platforms: Flutter on Windows, Linux and macOS, plus Android, Samsung Tizen, BrightSign and a Chromium web player I built alone, all following the same sync and proof-of-play rules.",
      "Shipped a bilingual Rail kiosk for CapMetro, Austin's transit agency: buy a ride, reload a fare card, check a balance, pay by cash or card, with read-aloud.",
      "Lead developer of Visual Engine, an AI API that recomposes one ad for any screen size instead of stretching it (about 290 of 420 backend and 116 of 216 frontend commits), with a four-tier model fallback, a job queue with live progress and layer decomposition for extreme banner ratios.",
      "Wrote nearly all of Recreative AI / GenFrame (67 of 73 commits): the same idea for ad agencies, with 40 screen profiles, a six-step AI fallback, Stripe credit plans and an Android app, live in production.",
      "Core developer on Slidexy, the AI presentation maker, since my first month (about 293 commits): the editor, URL and YouTube to deck, a four-phase SEO program, and the autumn 2026 rebuild with a template engine, free canvas and native PowerPoint export.",
      "Took over BRIDGE, a transit-benefits portal for CapMetro (22 of 33 commits): permissions down to agency and staff level, SCIM v2 provisioning for SailPoint and duplicate-benefit detection, and ran the client side with weekly meetings and architecture and security documents.",
      "Sole developer of a multi-tenant transit trip planner: GTFS upload and validation, real-time vehicle positions and depart-at / arrive-by routing on OpenTripPlanner.",
      "Deployed and ran production on AWS (ECS Fargate, ECR, S3), DigitalOcean, Vercel and Render, including live fixes for 429, 413 and CORS errors and moving every player to a new MQTT broker.",
      "Led a team of 6 developers across sprint planning, code reviews and delivery.",
    ],
  },
  {
    org: "Tiers Limited",
    title: "Software Engineer Intern",
    window: "May 2024 - Aug 2024",
    location: "Lahore, Punjab",
    summary:
      "A summer internship that started with the fundamentals, week by week, and ended with a full MERN application I delivered on my own.",
    stack: [
      "HTML",
      "CSS",
      "JavaScript",
      "React.js",
      "Node.js",
      "Express",
      "MongoDB",
      "PostgreSQL",
      "TMDB API",
      "Git",
    ],
    /* Without this the Tiers project is unreachable: the gallery is personal
       work only, and this is the role it was built in. */
    shipped: ["tiers"],
    notes: [
      "Worked through a weekly task track: semantic HTML pages, then a multi-page storefront with login, register and cart screens, then a responsive landing page in plain CSS.",
      "Built a student aggregate calculator in vanilla JavaScript that weights matric, FSc and entry-test marks, checks admission eligibility and keeps a running record in localStorage.",
      "Moved to React with three small apps: a blog with add and view flows, a colour picker driven by a form, and an e-commerce store with a product page, cart and login.",
      "Built a movie tracker as the closing project: sign up and sign in, latest films pulled from the TMDB API, and a personal watchlist that persists between visits.",
      "Then designed and delivered a full MERN-stack application solo inside 12 weeks, covering every development task from requirements to delivery, with 15+ responsive React components against REST APIs and MongoDB.",
      "Implemented authentication, role-based access control and the business logic layer, designed PostgreSQL schemas and indexes, and worked from Figma files straight to production components.",
      "Took part in code reviews and earned an internship completion certificate for JavaScript and MERN proficiency.",
    ],
    photos: [],
  },
];

/* The LinkedIn embed was removed: it is an unstyleable white card from
 * another site, and the experience section now carries real photographs and
 * the contribution record instead, which are both stronger and ours. */

/* ==================================================================== *
 * Life outside the editor.
 *
 * TODO(fiza): these are PLACEHOLDERS. Replace them with your actual hobbies
 * and set PLACEHOLDER_HOBBIES to false to hide the notice on the page.
 * ==================================================================== */

export type Pillar = { title: string; note: string; tech: string[] };

/** The three things I actually get hired for. Shown right under the hero. */
export const PILLARS: Pillar[] = [
  {
    title: "ai systems",
    note: "Retrieval pipelines, embeddings, and models that have to explain themselves rather than just score well.",
    tech: ["RAG", "LangChain", "ChromaDB", "PyTorch", "Ollama"],
  },
  {
    title: "backend & apis",
    note: "Service layers, schemas and indexes. The architectural decisions nobody notices until they are wrong.",
    tech: ["NestJS", "FastAPI", "Node.js", "PostgreSQL", "GraphQL"],
  },
  {
    title: "systems & low level",
    note: "Schedulers, caches, byzantine faults, and C running in kernel mode. Where the abstractions stop.",
    tech: ["C / GTK", "Docker", "WebSockets", "Chaos testing"],
  },
];

export const PLACEHOLDER_HOBBIES = true;

export type Hobby = { title: string; note: string; icon: string; wide?: boolean };

export const HOBBIES: Hobby[] = [
  {
    title: "Sketching",
    note: "Pencil and paper, mostly portraits. It is the one thing I do where nothing has to compile and nobody reviews it.",
    icon: "pen",
    wide: true,
  },
  {
    title: "Reading",
    note: "Non-fiction, with the occasional thriller.",
    icon: "book",
  },
  {
    title: "Coffee",
    note: "Slightly too invested in the brewing method.",
    icon: "cup",
  },
  {
    title: "Long walks",
    note: "Where the actual problem-solving happens. Most things I have been stuck on got unstuck somewhere away from the screen.",
    icon: "walk",
    wide: true,
  },
];

/** The small "right now" panel beside the hobby cards. */
export const CURRENTLY: { label: string; value: string }[] = [
  { label: "building", value: "this site, apparently" },
  { label: "learning", value: "distributed systems, properly" },
  { label: "reading", value: "add a book here" },
  { label: "listening", value: "add something here" },
];

export const SKILL_GROUPS: { name: string; items: string[] }[] = [
  {
    name: "Languages",
    items: ["TypeScript", "JavaScript (ES6+)", "Python", "SQL", "C", "C#", "Bash"],
  },
  {
    name: "Frontend",
    items: [
      "React.js",
      "Next.js",
      "Redux Toolkit",
      "Tailwind CSS",
      "React Native",
      "GraphQL",
    ],
  },
  {
    name: "Backend",
    items: [
      "Node.js",
      "NestJS",
      "Express.js",
      "FastAPI",
      "REST APIs",
      "WebSockets",
      "JWT / RBAC",
    ],
  },
  {
    name: "Data",
    items: [
      "PostgreSQL",
      "MongoDB",
      "SQL Server",
      "Schema design",
      "Indexing",
      "Aggregation pipelines",
      "ETL",
    ],
  },
  {
    name: "AI & ML",
    items: [
      "RAG pipelines",
      "LangChain",
      "ChromaDB",
      "Ollama",
      "Groq",
      "Azure OpenAI",
      "PyTorch",
      "TensorFlow",
      "SHAP / LIME",
      "OpenCV",
    ],
  },
  {
    name: "Infrastructure",
    items: [
      "Docker",
      "CI/CD",
      "Nginx",
      "PM2",
      "DigitalOcean",
      "Vercel",
      "AWS S3",
      "Oracle Cloud",
      "Git",
    ],
  },
];

export const EDUCATION = {
  school: "University of Engineering and Technology, Lahore",
  degree: "BSc Computer Science",
  window: "2022 - 2026",
  gpa: "3.68 / 4.00",
};

/* ==================================================================== *
 * Community, events and competitions.
 *
 * TODO(fiza): the entries flagged `placeholder: true` are blanks for the
 * hackathons and events you mentioned. Fill in the real ones and delete the
 * flag; any entry still flagged shows a dashed outline on the page.
 * ==================================================================== */

export type Involvement = {
  role: string;
  org: string;
  window: string;
  note: string;
  kind: "leadership" | "hackathon" | "community";
  placeholder?: boolean;
};

export const COMMUNITY: Involvement[] = [
  {
    role: "Creative Lead",
    org: "Google Developer Groups on Campus, UET Lahore",
    window: "Aug 2024 - May 2025",
    kind: "leadership",
    note: "Ran the creative side of a campus developer community: event branding, session material and turnout for technical workshops.",
  },
  {
    role: "Business Development Manager",
    org: "Software Square Society, UET Lahore",
    window: "Mar 2023 - Jan 2024",
    kind: "leadership",
    note: "Handled outreach and sponsor relationships for a student software society, which mostly meant a lot of cold emails and follow-through.",
  },
  {
    role: "Hackathon",
    org: "Name of the event",
    window: "Year",
    kind: "hackathon",
    placeholder: true,
    note: "What you built, who you built it with, and what placed or shipped. Two sentences is plenty.",
  },
  {
    role: "Event or meetup",
    org: "Name of the event",
    window: "Year",
    kind: "community",
    placeholder: true,
    note: "A talk you gave, a conference you attended, or a community you organise for.",
  },
];

export const HONOURS = [
  { label: "Star Performer", detail: "Techinoid, for ownership, technical depth and leadership", year: "2026" },
  { label: "Creative Lead", detail: "Google Developer on Campus, UET Lahore", year: "2024 - 2025" },
  { label: "Star Performer of the Year, PF & OOP", detail: "CS Department, UET Lahore", year: "2023" },
  { label: "Business Development Manager", detail: "Software Square Society, UET Lahore", year: "2023 - 2024" },
  { label: "SQL: Basic, Intermediate, Advanced", detail: "HackerRank", year: "2024" },
  { label: "React (Basic + Advanced), JavaScript", detail: "Codecademy", year: "2024" },
  { label: "Agile & Predictive Project Management", detail: "Project Management Institute", year: "2025" },
];

/* ==================================================================== *
 * Awards and certificates, for their own section on the page.
 * `photo` is optional; awards without one get an illustrated ribbon.
 * ==================================================================== */
export type Recognition = { title: string; from: string; year: string; note?: string; photo?: string; href?: string };

export const AWARDS: Recognition[] = [
  { title: "Star Performer", from: "Techinoid", year: "2026", note: "For ownership, technical depth and leadership across SignageX, Slidexy and the transit products." },
  { title: "Star Performer of the Year, PF & OOP", from: "CS Department, UET Lahore", year: "2023", note: "Top of the year in Programming Fundamentals and Object-Oriented Programming." },
];

export const CERTIFICATES: Recognition[] = [
  { title: "Agile & Predictive Project Management", from: "Project Management Institute", year: "2025" },
  { title: "SQL: Basic, Intermediate, Advanced", from: "HackerRank", year: "2024" },
  { title: "React (Basic + Advanced), JavaScript", from: "Codecademy", year: "2024" },
  { title: "JavaScript and MERN internship completion", from: "Tiers Limited", year: "2024" },
];

/* ==================================================================== *
 * Off the clock: paintings and photographs.
 *
 * To add one, put the image in public/off-the-clock/ and add a line here:
 *   { src: "/off-the-clock/sunset.jpg", title: "Sunset over Lahore", kind: "photo", note: "Shot on my phone, 2025" },
 * `kind` is "painting" or "photo". Portrait, landscape and square all work;
 * the gallery keeps each picture's own shape. The section stays hidden on
 * the live site until there is at least one entry.
 * ==================================================================== */
export type Artwork = {
  src: string; title: string; kind: "painting" | "photo" | "exhibition"; note?: string;
  /** Pixel size of the file, so the gallery can lay it out before it loads. */
  w?: number; h?: number;
  /** How big its frame hangs on the wall: small, medium, large or wide. Mixed on purpose. */
  size?: "s" | "m" | "l" | "w";
};

export const OFF_THE_CLOCK: Artwork[] = [
  { src: "/off-the-clock/howl.jpg", title: "Howl", kind: "painting", note: "Acrylic, a forest inside a silhouette", w: 1453, h: 1800, size: "l" },
  { src: "/off-the-clock/sky-break.jpg", title: "Sky break", kind: "photo", note: "Light through the clouds", w: 1350, h: 1800, size: "m" },
  { src: "/off-the-clock/lotus-arch.jpg", title: "Lotus arch", kind: "painting", note: "Acrylic on canvas", w: 1013, h: 1800, size: "s" },
  { src: "/off-the-clock/three-frames.jpg", title: "Three frames, one wall", kind: "exhibition", note: "My photographs, hung", w: 1800, h: 1350, size: "w" },
  { src: "/off-the-clock/drip.jpg", title: "Drip", kind: "painting", note: "Watercolour and ink", w: 1488, h: 1800, size: "s" },
  { src: "/off-the-clock/evening-road.jpg", title: "Evening road", kind: "photo", note: "Sunset over the city", w: 1350, h: 1800, size: "s" },
  { src: "/off-the-clock/forest-clearing.jpg", title: "Forest clearing", kind: "painting", note: "Acrylic on canvas", w: 1350, h: 1800, size: "l" },
  { src: "/off-the-clock/street-collective.jpg", title: "Street Collective", kind: "exhibition", note: "Street photography show", w: 1350, h: 1800, size: "m" },
  { src: "/off-the-clock/moon-birds.jpg", title: "Moon birds", kind: "painting", note: "Acrylic on canvas", w: 1800, h: 1800, size: "s" },
  { src: "/off-the-clock/quiet-sky.jpg", title: "Quiet sky", kind: "photo", w: 1350, h: 1800, size: "s" },
  { src: "/off-the-clock/starry-night-dish.jpg", title: "Starry dish", kind: "painting", note: "Painted ceramic, after Van Gogh", w: 1350, h: 1800, size: "s" },
  { src: "/off-the-clock/flamingo.jpg", title: "Flamingo", kind: "painting", note: "Watercolour, sketchbook", w: 1350, h: 1800, size: "m" },
  { src: "/off-the-clock/windswept.jpg", title: "Windswept", kind: "painting", note: "Watercolour and ink", w: 1800, h: 1350, size: "w" },
  { src: "/off-the-clock/annie-street.jpg", title: "Annie Street", kind: "painting", note: "Watercolour, sketchbook", w: 1350, h: 1800, size: "m" },
  { src: "/off-the-clock/mountain-river.jpg", title: "Mountain river", kind: "painting", note: "Watercolour, sketchbook", w: 1350, h: 1800, size: "m" },
  { src: "/off-the-clock/take-home-a-keepsake.jpg", title: "Take home a keepsake", kind: "exhibition", note: "A table at a zine and craft fair", w: 1350, h: 1800, size: "s" },
  { src: "/off-the-clock/through-the-trees.jpg", title: "Through the trees", kind: "photo", w: 1350, h: 1800, size: "s" },
];

/** Achievement definitions for the dive HUD. */
export const ACHIEVEMENTS = {
  cast_off: { title: "Cast Off", note: "You started the descent." },
  light_line: { title: "Below the Light Line", note: "Passed 1,600 m. Sunlight ends here." },
  the_floor: { title: "Touched the Floor", note: "6,000 m. Nothing below this." },
  specimen: { title: "Specimen Handler", note: "Opened your first project dossier." },
  archivist: { title: "Archivist", note: "Opened five project dossiers." },
  wreck: { title: "Found the Wreck", note: "You went looking. Most people don't." },
  patient: { title: "Slow Diver", note: "You actually read something." },
} as const;

export type AchievementId = keyof typeof ACHIEVEMENTS;

export const MAX_DEPTH = 6000;
