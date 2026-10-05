import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { deterministicClassify } from "../lib/ai";
import { generateEmbeddingVector } from "../lib/search";

const prisma = new PrismaClient();

// Dense vector embedding generator for seed data using standardized vector pipeline
function generateVector(text: string): string {
  return JSON.stringify(generateEmbeddingVector(text));
}

const RAW_FEEDBACK_ITEMS = [
  // Onboarding & Setup
  { content: "Onboarding took forever — I couldn't figure out how to invite my team.", channel: "SUPPORT_TICKET", customerLabel: "Growth Tier - StartupX", sentiment: "NEG", sentimentScore: -0.75, status: "REVIEWED", theme: "Onboarding & Setup", featureArea: "Onboarding", daysAgo: 2 },
  { content: "The invitation email went to our spam folder, causing a 3-day delay in our team rollout.", channel: "SUPPORT_TICKET", customerLabel: "Enterprise - Globex", sentiment: "NEG", sentimentScore: -0.8, status: "NEW", theme: "Onboarding & Setup", featureArea: "Onboarding", daysAgo: 1 },
  { content: "Setup wizard was smooth and guided us step-by-step. Up and running in 10 minutes!", channel: "NPS_SURVEY", customerLabel: "Pro Plan - TechFlow", sentiment: "POS", sentimentScore: 0.9, status: "ACTIONED", theme: "Onboarding & Setup", featureArea: "Onboarding", daysAgo: 8 },
  { content: "We need Google Workspace SSO during initial signup so employees don't create duplicate accounts.", channel: "SALES_CALL", customerLabel: "Prospect - FinTech Corp", sentiment: "NEU", sentimentScore: 0.1, status: "REVIEWED", theme: "Onboarding & Setup", featureArea: "Auth", daysAgo: 5 },
  { content: "The interactive onboarding checklist was super helpful for our non-technical staff.", channel: "COMMUNITY", customerLabel: "Community Member", sentiment: "POS", sentimentScore: 0.85, status: "ACTIONED", theme: "Onboarding & Setup", featureArea: "Onboarding", daysAgo: 14 },
  { content: "Why can't I invite members with viewer-only roles right from the signup screen?", channel: "SUPPORT_TICKET", customerLabel: "Free User", sentiment: "NEG", sentimentScore: -0.5, status: "NEW", theme: "Onboarding & Setup", featureArea: "RBAC", daysAgo: 3 },
  { content: "Password reset link expired before I even received the email during onboarding.", channel: "SUPPORT_TICKET", customerLabel: "Pro User", sentiment: "NEG", sentimentScore: -0.85, status: "ACTIONED", theme: "Onboarding & Setup", featureArea: "Auth", daysAgo: 6 },
  { content: "Delightful first-time user tour. Clean animations and straightforward copy.", channel: "APP_STORE", customerLabel: "iOS User", sentiment: "POS", sentimentScore: 0.8, status: "REVIEWED", theme: "Onboarding & Setup", featureArea: "Onboarding", daysAgo: 20 },
  { content: "Onboarding docs for SSO SAML configuration have broken screenshots.", channel: "SUPPORT_TICKET", customerLabel: "Enterprise - SecureBank", sentiment: "NEG", sentimentScore: -0.6, status: "REVIEWED", theme: "Onboarding & Setup", featureArea: "Docs", daysAgo: 4 },
  { content: "Sign up process is decent, but please auto-detect corporate domain to join company workspace.", channel: "COMMUNITY", customerLabel: "Lead Dev - DevStudio", sentiment: "NEU", sentimentScore: 0.2, status: "NEW", theme: "Onboarding & Setup", featureArea: "Auth", daysAgo: 11 },

  // Billing & Invoices
  { content: "Billing page keeps timing out when I try to download our monthly VAT invoice.", channel: "SUPPORT_TICKET", customerLabel: "Enterprise - Omnicorp", sentiment: "NEG", sentimentScore: -0.9, status: "NEW", theme: "Billing & Invoices", featureArea: "Billing", daysAgo: 1 },
  { content: "We were double-charged for our seat add-ons this billing cycle. Please refund immediately.", channel: "SUPPORT_TICKET", customerLabel: "Business - Apex Ltd", sentiment: "NEG", sentimentScore: -0.95, status: "ACTIONED", theme: "Billing & Invoices", featureArea: "Billing", daysAgo: 3 },
  { content: "Love the new transparent pricing breakdown and self-serve invoice download portal.", channel: "NPS_SURVEY", customerLabel: "Pro User", sentiment: "POS", sentimentScore: 0.85, status: "REVIEWED", theme: "Billing & Invoices", featureArea: "Billing", daysAgo: 12 },
  { content: "Need support for annual purchase orders and wire transfer payment methods.", channel: "SALES_CALL", customerLabel: "Enterprise Prospect - StateGov", sentiment: "NEU", sentimentScore: 0.0, status: "NEW", theme: "Billing & Invoices", featureArea: "Billing", daysAgo: 7 },
  { content: "Card declined error doesn't explain if it's 3D-Secure failure or insufficient funds.", channel: "SUPPORT_TICKET", customerLabel: "Starter Tier", sentiment: "NEG", sentimentScore: -0.65, status: "REVIEWED", theme: "Billing & Invoices", featureArea: "Billing", daysAgo: 4 },
  { content: "Can we add multiple billing contacts to receive the automated monthly invoice emails?", channel: "SUPPORT_TICKET", customerLabel: "Accounting Dept - BigRetail", sentiment: "NEU", sentimentScore: 0.15, status: "ACTIONED", theme: "Billing & Invoices", featureArea: "Billing", daysAgo: 15 },
  { content: "Upgraded to Enterprise tier seamlessly. Immediate access to increased limits was great.", channel: "COMMUNITY", customerLabel: "Verified Buyer", sentiment: "POS", sentimentScore: 0.9, status: "REVIEWED", theme: "Billing & Invoices", featureArea: "Billing", daysAgo: 18 },
  { content: "The PDF invoice generator is failing with 500 server error since yesterday's update.", channel: "SUPPORT_TICKET", customerLabel: "Enterprise - EuroLogistics", sentiment: "NEG", sentimentScore: -0.9, status: "NEW", theme: "Billing & Invoices", featureArea: "Billing", daysAgo: 0 },
  { content: "Proration calculation during mid-month seat removal is confusing on the receipt.", channel: "SUPPORT_TICKET", customerLabel: "Agency Team", sentiment: "NEG", sentimentScore: -0.4, status: "REVIEWED", theme: "Billing & Invoices", featureArea: "Billing", daysAgo: 9 },
  { content: "Straightforward Stripe checkout, very quick license upgrade.", channel: "APP_STORE", customerLabel: "Mobile Pro User", sentiment: "POS", sentimentScore: 0.75, status: "ACTIONED", theme: "Billing & Invoices", featureArea: "Billing", daysAgo: 22 },

  // Performance & Speed
  { content: "The new dashboard is gorgeous and finally fast. Huge improvement over v1.", channel: "APP_STORE", customerLabel: "Power User", sentiment: "POS", sentimentScore: 0.95, status: "ACTIONED", theme: "Performance & Speed", featureArea: "Dashboard", daysAgo: 5 },
  { content: "Filtering feedback tables with >2000 records takes 8+ seconds to render.", channel: "SUPPORT_TICKET", customerLabel: "Enterprise - DataSys", sentiment: "NEG", sentimentScore: -0.8, status: "NEW", theme: "Performance & Speed", featureArea: "Inbox", daysAgo: 2 },
  { content: "Search queries with multiple tags feel instantaneous now. Great engineering work!", channel: "COMMUNITY", customerLabel: "Tech Lead", sentiment: "POS", sentimentScore: 0.9, status: "REVIEWED", theme: "Performance & Speed", featureArea: "Search", daysAgo: 10 },
  { content: "Exporting 50k rows to CSV crashed my browser tab with out of memory error.", channel: "SUPPORT_TICKET", customerLabel: "BI Analyst", sentiment: "NEG", sentimentScore: -0.85, status: "REVIEWED", theme: "Performance & Speed", featureArea: "Export", daysAgo: 4 },
  { content: "Initial page load in the Asia-Pacific region is experiencing high latency (2.5s TTFB).", channel: "SUPPORT_TICKET", customerLabel: "Customer - Singapore Node", sentiment: "NEG", sentimentScore: -0.7, status: "NEW", theme: "Performance & Speed", featureArea: "Infra", daysAgo: 6 },
  { content: "Charts re-render smoothly when switching date ranges. No lag or UI freezing.", channel: "NPS_SURVEY", customerLabel: "Product Manager", sentiment: "POS", sentimentScore: 0.85, status: "ACTIONED", theme: "Performance & Speed", featureArea: "Dashboard", daysAgo: 16 },
  { content: "Auto-complete search input stutters on mobile devices when typing fast.", channel: "SUPPORT_TICKET", customerLabel: "Mobile User", sentiment: "NEG", sentimentScore: -0.55, status: "NEW", theme: "Performance & Speed", featureArea: "Search", daysAgo: 7 },
  { content: "Database query response times have drastically improved after the recent index migration.", channel: "COMMUNITY", customerLabel: "Backend Enthusiast", sentiment: "POS", sentimentScore: 0.8, status: "REVIEWED", theme: "Performance & Speed", featureArea: "API", daysAgo: 25 },
  { content: "The app feels snappy even when triaging hundreds of tickets back to back.", channel: "NPS_SURVEY", customerLabel: "Support Agent", sentiment: "POS", sentimentScore: 0.9, status: "ACTIONED", theme: "Performance & Speed", featureArea: "Inbox", daysAgo: 13 },
  { content: "VoC report PDF generation took over 45 seconds to compile on our larger dataset.", channel: "SUPPORT_TICKET", customerLabel: "Director of Product", sentiment: "NEG", sentimentScore: -0.6, status: "REVIEWED", theme: "Performance & Speed", featureArea: "Reports", daysAgo: 3 },

  // Mobile Experience
  { content: "It does the job, but the mobile experience needs serious work on iOS Safari.", channel: "NPS_SURVEY", customerLabel: "Mobile Executive", sentiment: "NEU", sentimentScore: -0.2, status: "NEW", theme: "Mobile Experience", featureArea: "Mobile", daysAgo: 8 },
  { content: "Love the responsive drawer navigation on tablet. Very easy to check stats on the go.", channel: "APP_STORE", customerLabel: "iPad User", sentiment: "POS", sentimentScore: 0.85, status: "REVIEWED", theme: "Mobile Experience", featureArea: "Mobile", daysAgo: 15 },
  { content: "Table columns overflow horizontally on mobile screens and cannot be scrolled.", channel: "SUPPORT_TICKET", customerLabel: "Field Ops Lead", sentiment: "NEG", sentimentScore: -0.75, status: "ACTIONED", theme: "Mobile Experience", featureArea: "Mobile", daysAgo: 5 },
  { content: "Touch targets for the sentiment filter pills are too small on iPhone Mini.", channel: "APP_STORE", customerLabel: "Mobile Tester", sentiment: "NEG", sentimentScore: -0.5, status: "NEW", theme: "Mobile Experience", featureArea: "Mobile", daysAgo: 9 },
  { content: "Dark mode looks crisp on OLED phone screens. Really easy on the eyes during late night reviews.", channel: "COMMUNITY", customerLabel: "Designer", sentiment: "POS", sentimentScore: 0.9, status: "ACTIONED", theme: "Mobile Experience", featureArea: "Mobile", daysAgo: 21 },
  { content: "Ask LOOP voice-to-text or quick prompts on mobile would be a killer feature.", channel: "COMMUNITY", customerLabel: "Road Warrior PM", sentiment: "POS", sentimentScore: 0.7, status: "REVIEWED", theme: "Mobile Experience", featureArea: "AI", daysAgo: 11 },
  { content: "Push notifications on mobile web fail to register permission properly.", channel: "SUPPORT_TICKET", customerLabel: "Android User", sentiment: "NEG", sentimentScore: -0.65, status: "NEW", theme: "Mobile Experience", featureArea: "Mobile", daysAgo: 6 },
  { content: "Great mobile web layout. Much better than most clunky enterprise SaaS dashboards.", channel: "APP_STORE", customerLabel: "5-Star Reviewer", sentiment: "POS", sentimentScore: 0.95, status: "ACTIONED", theme: "Mobile Experience", featureArea: "Mobile", daysAgo: 17 },

  // Integrations & APIs
  { content: "Prospect wants SSO before they'll sign — third time this month.", channel: "SALES_CALL", customerLabel: "Sales Rep - Deal $120k", sentiment: "NEG", sentimentScore: -0.7, status: "REVIEWED", theme: "Integrations & APIs", featureArea: "Auth / SSO", daysAgo: 3 },
  { content: "Love the new CSV export feature, saved me an hour today!", channel: "COMMUNITY", customerLabel: "Ops Lead", sentiment: "POS", sentimentScore: 0.95, status: "ACTIONED", theme: "Integrations & APIs", featureArea: "Export", daysAgo: 7 },
  { content: "Need a webhook trigger whenever customer feedback is tagged as high negative sentiment.", channel: "SUPPORT_TICKET", customerLabel: "DevOps Engineer", sentiment: "NEU", sentimentScore: 0.3, status: "NEW", theme: "Integrations & APIs", featureArea: "Webhooks", daysAgo: 4 },
  { content: "Zendesk sync API rate limit is too restrictive for our support volume.", channel: "SUPPORT_TICKET", customerLabel: "Head of Support - ScaleCo", sentiment: "NEG", sentimentScore: -0.75, status: "REVIEWED", theme: "Integrations & APIs", featureArea: "Integrations", daysAgo: 2 },
  { content: "Your REST API documentation with sample curl commands made integration seamless.", channel: "COMMUNITY", customerLabel: "Integration Partner", sentiment: "POS", sentimentScore: 0.9, status: "ACTIONED", theme: "Integrations & APIs", featureArea: "API Docs", daysAgo: 19 },
  { content: "We need a bi-directional Jira integration to turn actioned feedback directly into user stories.", channel: "SALES_CALL", customerLabel: "Enterprise Buyer - AgileHub", sentiment: "NEU", sentimentScore: 0.2, status: "NEW", theme: "Integrations & APIs", featureArea: "Integrations", daysAgo: 10 },
  { content: "Zapier integration trigger fails silently when feedback contains emojis.", channel: "SUPPORT_TICKET", customerLabel: "Automation Specialist", sentiment: "NEG", sentimentScore: -0.8, status: "ACTIONED", theme: "Integrations & APIs", featureArea: "Integrations", daysAgo: 8 },
  { content: "Slack notification bot works brilliantly! Our product channel loves the instant sentiment alerts.", channel: "NPS_SURVEY", customerLabel: "VP Product", sentiment: "POS", sentimentScore: 1.0, status: "ACTIONED", theme: "Integrations & APIs", featureArea: "Integrations", daysAgo: 13 },

  // Feature Requests
  { content: "Can we get custom tagging rules that automatically apply tags based on regex matches?", channel: "COMMUNITY", customerLabel: "Power Analyst", sentiment: "POS", sentimentScore: 0.6, status: "NEW", theme: "Feature Requests", featureArea: "Rules", daysAgo: 5 },
  { content: "Please add an option to compare customer sentiment across two different date quarters.", channel: "NPS_SURVEY", customerLabel: "Executive Director", sentiment: "POS", sentimentScore: 0.7, status: "REVIEWED", theme: "Feature Requests", featureArea: "Analytics", daysAgo: 12 },
  { content: "Would love automated weekly VoC summary emails sent directly to our executive inbox.", channel: "SALES_CALL", customerLabel: "Prospect - HealthTech", sentiment: "POS", sentimentScore: 0.8, status: "NEW", theme: "Feature Requests", featureArea: "Reports", daysAgo: 6 },
  { content: "Add support for multilingual feedback translation (Spanish, German, Japanese).", channel: "SUPPORT_TICKET", customerLabel: "Global Ops Lead", sentiment: "NEU", sentimentScore: 0.3, status: "REVIEWED", theme: "Feature Requests", featureArea: "Localization", daysAgo: 16 },
  { content: "Ability to merge duplicate feedback items into a single cluster master item.", channel: "COMMUNITY", customerLabel: "Product Operations", sentiment: "POS", sentimentScore: 0.75, status: "ACTIONED", theme: "Feature Requests", featureArea: "Inbox", daysAgo: 24 },
  { content: "Provide an executive slide deck PPTX export in addition to PDF reports.", channel: "SALES_CALL", customerLabel: "Enterprise VP", sentiment: "NEU", sentimentScore: 0.25, status: "NEW", theme: "Feature Requests", featureArea: "Export", daysAgo: 9 },
];

function expandFeedbackDataset() {
  const expanded = [...RAW_FEEDBACK_ITEMS];
  const templates = [
    { prefix: "Customer review: ", suffix: " Demands engineering priority.", chan: "APP_STORE", sent: "NEG", score: -0.7, th: "Performance & Speed" },
    { prefix: "Survey respondent: ", suffix: " Outstanding experience.", chan: "NPS_SURVEY", sent: "POS", score: 0.85, th: "Feature Requests" },
    { prefix: "Support ticket note: ", suffix: " Escalated to operations.", chan: "SUPPORT_TICKET", sent: "NEG", score: -0.65, th: "Onboarding & Setup" },
    { prefix: "Sales discovery: ", suffix: " Critical for expansion deal.", chan: "SALES_CALL", sent: "NEU", score: 0.1, th: "Integrations & APIs" },
    { prefix: "Community post: ", suffix: " Highly upvoted by developers.", chan: "COMMUNITY", sent: "POS", score: 0.9, th: "Billing & Invoices" },
  ];

  const topics = [
    { t: "OAuth Google and GitHub login", th: "Onboarding & Setup", fa: "Auth", s: "POS", sc: 0.8 },
    { t: "Invoice receipt breakdown with itemized tax details", th: "Billing & Invoices", fa: "Billing", s: "NEG", sc: -0.6 },
    { t: "Real-time query performance when filtering 10k items", th: "Performance & Speed", fa: "Search", s: "POS", sc: 0.75 },
    { t: "Mobile navigation bar layout on smaller screens", th: "Mobile Experience", fa: "UI", s: "NEG", sc: -0.5 },
    { t: "Salesforce CRM webhook automated sync trigger", th: "Integrations & APIs", fa: "CRM", s: "POS", sc: 0.85 },
    { t: "Automated sentiment spike alerts via email/Slack", th: "Feature Requests", fa: "Alerts", s: "POS", sc: 0.9 },
    { t: "Team invitation link expiration interval customization", th: "Onboarding & Setup", fa: "RBAC", s: "NEU", sc: 0.1 },
    { t: "Subscription renewal reminder notice 14 days in advance", th: "Billing & Invoices", fa: "Billing", s: "POS", sc: 0.7 },
    { t: "Elasticsearch index sync latency during peak ingestion hours", th: "Performance & Speed", fa: "Infra", s: "NEG", sc: -0.8 },
    { t: "iOS gesture controls and swipe-to-archive feedback", th: "Mobile Experience", fa: "Gestures", s: "POS", sc: 0.8 },
    { t: "GraphQL API endpoint for custom business intelligence ETLs", th: "Integrations & APIs", fa: "API", s: "POS", sc: 0.9 },
    { t: "Customizable Voice-of-Customer executive summary metrics", th: "Feature Requests", fa: "Reports", s: "POS", sc: 0.8 },
    { t: "CSV bulk file column auto-mapping detection", th: "Onboarding & Setup", fa: "Ingestion", s: "POS", sc: 0.85 },
    { t: "Credit card 3DS verification modal failure loop", th: "Billing & Invoices", fa: "Billing", s: "NEG", sc: -0.9 },
    { t: "Cached chart rendering speed on multi-workspace dashboards", th: "Performance & Speed", fa: "Dashboard", s: "POS", sc: 0.9 },
    { t: "Dark mode contrast ratio for accessibility WCAG compliance", th: "Mobile Experience", fa: "A11y", s: "NEU", sc: 0.2 },
    { t: "HubSpot contact association for sales call transcript imports", th: "Integrations & APIs", fa: "CRM", s: "POS", sc: 0.8 },
    { t: "Keyword sentiment heatmap visualization view", th: "Feature Requests", fa: "Analytics", s: "POS", sc: 0.85 },
  ];

  for (let i = 0; i < 75; i++) {
    const tmpl = templates[i % templates.length];
    const top = topics[i % topics.length];
    const daysAgo = (i % 28) + 1;
    const isNeg = i % 3 === 0;
    const isPos = i % 3 === 1;

    expanded.push({
      content: `${tmpl.prefix}Regarding ${top.t}. ${isNeg ? "We ran into several unexpected roadblocks and delays." : isPos ? "The current implementation has exceeded our expectations." : "Standard baseline requirements are met but more flexibility is needed."} ${tmpl.suffix}`,
      channel: tmpl.chan,
      customerLabel: `Account-${100 + (i % 20)} (${i % 2 === 0 ? "Enterprise" : "Mid-Market"})`,
      sentiment: isNeg ? "NEG" : isPos ? "POS" : "NEU",
      sentimentScore: isNeg ? -0.7 : isPos ? 0.85 : 0.1,
      status: i % 4 === 0 ? "NEW" : i % 4 === 1 ? "REVIEWED" : "ACTIONED",
      theme: top.th,
      featureArea: top.fa,
      daysAgo,
    });
  }

  return expanded;
}

async function main() {
  console.log("🌱 Starting enterprise database seeding for Project LOOP...");

  // 1. Create Demo Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corp (Demo)",
      slug: "acme-corp",
    },
  });
  console.log(`✅ Workspace ready: ${workspace.name} (ID: ${workspace.id})`);

  // 2. Create 3 Demo Users (Admin, Analyst, Viewer) with password 'password123'
  const passwordHash = await bcrypt.hash("password123", 10);

  const usersData = [
    { email: "admin@loop.dev", name: "Alex Admin", role: "ADMIN" },
    { email: "analyst@loop.dev", name: "Sam Analyst", role: "ANALYST" },
    { email: "viewer@loop.dev", name: "Valerie Viewer", role: "VIEWER" },
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, passwordHash, workspaceId: workspace.id },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash,
        workspaceId: workspace.id,
      },
    });
  }
  console.log("✅ Seeded 3 demo users: admin@loop.dev, analyst@loop.dev, viewer@loop.dev");

  // 3. Create Canonical Themes
  const themesData = [
    { name: "Onboarding & Setup", description: "Signup flows, invitations, team setup, and first-run experience", color: "#3b82f6" },
    { name: "Billing & Invoices", description: "Pricing, checkout, invoices, credit card payments, and refunds", color: "#ef4444" },
    { name: "Performance & Speed", description: "Page load speeds, search latency, table rendering, and server timeouts", color: "#f59e0b" },
    { name: "Mobile Experience", description: "iOS, Android, mobile web responsiveness, and touch navigation", color: "#8b5cf6" },
    { name: "Integrations & APIs", description: "SSO, REST API, webhooks, Zendesk, Slack, and Jira connectors", color: "#10b981" },
    { name: "Feature Requests", description: "Customer suggestions, new workflow ideas, and roadmap requests", color: "#06b6d4" },
  ];

  const themeMap = new Map<string, string>();
  for (const t of themesData) {
    const theme = await prisma.theme.upsert({
      where: {
        workspaceId_name: {
          workspaceId: workspace.id,
          name: t.name,
        },
      },
      update: { description: t.description, color: t.color },
      create: {
        name: t.name,
        description: t.description,
        color: t.color,
        workspaceId: workspace.id,
      },
    });
    themeMap.set(t.name, theme.id);
  }
  console.log(`✅ Seeded ${themeMap.size} canonical themes`);

  // 4. Create Initial Dataset Entity
  const initialDataset = await prisma.dataset.create({
    data: {
      name: "Acme Multi-Channel Feedback Corpus 2026",
      fileName: "customer_signals_q3_q4.csv",
      fileType: "CSV",
      recordCount: 127,
      validCount: 127,
      errorCount: 0,
      qualityScore: 98.5,
      status: "READY",
      qualityMetrics: JSON.stringify({
        totalRecords: 127,
        validRecords: 127,
        invalidRecords: 0,
        duplicateRecords: 0,
        emptyFeedbackRecords: 0,
        completenessPct: 98,
        duplicateRatePct: 0,
        overallQualityScore: 98.5,
      }),
      workspaceId: workspace.id,
    },
  });
  console.log(`✅ Seeded core dataset metadata: ${initialDataset.name}`);

  // 5. Populate 125+ realistic feedback items with enriched intelligence
  const allFeedback = expandFeedbackDataset();
  console.log(`📦 Inserting ${allFeedback.length} enriched feedback records with NLP intelligence & vectors...`);

  // Clear existing items in demo workspace for clean repeatable seeding
  await prisma.feedbackTheme.deleteMany({});
  await prisma.embedding.deleteMany({});
  await prisma.feedback.deleteMany({ where: { workspaceId: workspace.id } });

  const now = new Date();
  const regions = ["US-East", "US-West", "EU-West", "APAC"];

  for (let i = 0; i < allFeedback.length; i++) {
    const item = allFeedback[i];
    const createdAt = new Date(now.getTime() - item.daysAgo * 24 * 60 * 60 * 1000 - i * 120000);
    const vectorStr = generateVector(item.content);

    // Run through deterministic NLP classification
    const aiResult = deterministicClassify(item.content, Array.from(themeMap.keys()));

    const region = regions[i % regions.length];

    const createdFb = await prisma.feedback.create({
      data: {
        content: item.content,
        channel: item.channel,
        sourceRef: `REF-${1000 + i}`,
        customerLabel: item.customerLabel,
        product: item.featureArea,
        region,
        datasetId: initialDataset.id,
        sentiment: aiResult.sentiment,
        sentimentScore: aiResult.sentimentScore,
        aiConfidence: aiResult.aiConfidence,
        emotion: aiResult.emotion,
        emotionConfidence: aiResult.emotionConfidence,
        intent: aiResult.intent,
        aspectsJson: JSON.stringify(aiResult.aspects),
        featureArea: item.featureArea || aiResult.featureArea,
        severityScore: aiResult.severityScore,
        priority: aiResult.priority,
        severityRationale: aiResult.severityRationale,
        churnRiskSignal: aiResult.churnRiskSignal,
        churnRiskRationale: aiResult.churnRiskRationale,
        rootCauseHypothesis: aiResult.rootCauseHypothesis,
        detectedEntities: JSON.stringify(aiResult.detectedEntities),
        rationale: aiResult.rationale,
        status: item.status,
        workspaceId: workspace.id,
        createdAt,
        embedding: {
          create: {
            vector: vectorStr,
          },
        },
      },
    });

    const themeId = themeMap.get(item.theme) || themeMap.get("Onboarding & Setup");
    if (themeId) {
      await prisma.feedbackTheme.create({
        data: {
          feedbackId: createdFb.id,
          themeId,
          confidence: 0.95,
        },
      });
    }
  }

  // 6. Seed Sample Active Alerts
  await prisma.alert.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.alert.createMany({
    data: [
      {
        title: "VAT invoice export timeout spike",
        message: "Multiple enterprise accounts encountered HTTP 500 timeouts when downloading monthly VAT invoices.",
        severity: "CRITICAL",
        type: "COMPLAINT_SPIKE",
        metric: "5 critical complaints in 24h | Severity: 90/100",
        status: "ACTIVE",
        workspaceId: workspace.id,
      },
      {
        title: "SSO authentication blockers on pipeline deals",
        message: "Sales notes indicate 3 enterprise prospects ($240k combined ARR) require SAML 2.0 SSO prior to signing.",
        severity: "HIGH",
        type: "CHURN_RISK",
        metric: "3 deals blocked | Severity: 75/100",
        status: "ACTIVE",
        workspaceId: workspace.id,
      },
      {
        title: "Mobile Safari horizontal overflow regression",
        message: "User reviews on iOS Safari report table overflow and clipped columns after the v2.3 update.",
        severity: "MEDIUM",
        type: "ANOMALY",
        metric: "Velocity +40% week-over-week",
        status: "ACTIVE",
        workspaceId: workspace.id,
      },
    ],
  });
  console.log("✅ Seeded 3 active intelligence alerts");

  // 7. Seed Strategic AI Recommendations
  await prisma.aIRecommendation.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.aIRecommendation.createMany({
    data: [
      {
        problem: "Synchronous PDF invoice compilation causing server timeouts",
        evidence: "14 customer tickets reported 500 error when downloading past invoices.",
        businessImpact: "Frustrates finance stakeholders and delays monthly vendor reconciliation.",
        recommendedAction: "Migrate invoice generation to an asynchronous background worker and cache generated PDFs in object storage.",
        priority: "CRITICAL",
        expectedOutcome: "Zero billing page timeouts and 60% reduction in billing support tickets.",
        status: "OPEN",
        workspaceId: workspace.id,
      },
      {
        problem: "Team invitation emails landing in corporate spam filters",
        evidence: "Globex and StartupX accounts reported multi-day employee onboarding delays.",
        businessImpact: "Slows corporate seat activation and diminishes initial platform momentum.",
        recommendedAction: "Add custom domain DKIM/SPF support and allow administrators to copy direct magic invite links.",
        priority: "HIGH",
        expectedOutcome: "Immediate 99% invitation delivery rate and accelerated team rollout.",
        status: "IN_PROGRESS",
        workspaceId: workspace.id,
      },
      {
        problem: "Demand for SAML 2.0 SSO blocking mid-market expansion",
        evidence: "Sales discovery records from Gong show prospects requiring Okta/Google SSO.",
        businessImpact: "At least $240,000 in annual recurring revenue pipeline currently unclosed.",
        recommendedAction: "Fast-track Okta SAML 2.0 integration and provide self-serve configuration documentation.",
        priority: "HIGH",
        expectedOutcome: "Unblock enterprise sales pipeline and shorten sales cycle duration by 2 weeks.",
        status: "OPEN",
        workspaceId: workspace.id,
      },
    ],
  });
  console.log("✅ Seeded 3 strategic AI recommendations");

  // 8. Seed Sample VoC Report
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@loop.dev" } });
  if (adminUser) {
    const sampleReportContent = JSON.stringify({
      executiveSummary: "Over the past 30 days, Project LOOP analyzed 120+ verified customer signals across support tickets, app reviews, and sales notes. Product satisfaction remains robust across speed and integrations (+58% positive), while recent billing timeout issues and team invite confusion require targeted engineering resolution to protect enterprise ARR.",
      keyFindings: [
        "Net Sentiment Score stabilized at +35 across 127 multi-channel signals.",
        "Billing & Invoices represents the highest customer complaint volume with acute frustration.",
        "Performance optimizations yielded significant positive satisfaction improvements (+95%).",
        "SSO authentication remains the #1 requested enterprise capability across sales discovery calls.",
      ],
      topThemesNarrative: [
        { theme: "Billing & Invoices", analysis: "Finance administrators reported recurring 500 timeouts when exporting VAT invoices.", severity: "High" },
        { theme: "Onboarding & Setup", analysis: "Friction around team invitations landing in spam folders and missing SSO during initial signup.", severity: "Medium" },
        { theme: "Performance & Speed", analysis: "Users gave high praise for dashboard responsiveness and snappy table pagination.", severity: "Low" }
      ],
      aspectBreakdown: [
        { aspect: "Billing & Invoices", sentiment: "NEG", impact: "High support ticket burden and payment friction." },
        { aspect: "Performance & Latency", sentiment: "POS", impact: "Key retention driver and positive word-of-mouth." },
        { aspect: "Mobile Experience", sentiment: "NEU", impact: "Usable but requires touch target optimizations." },
      ],
      sentimentShifts: "Overall positive sentiment rose by 14% following the recent dashboard performance release.",
      rootCauseAnalysis: [
        { problem: "VAT invoice export timeout", hypothesis: "Synchronous PDF generation bottleneck on large transactions.", evidence: "14 tickets logged." },
        { problem: "Invite delivery delay", hypothesis: "Corporate spam filtering on default email sender.", evidence: "Reported by Globex & StartupX." },
      ],
      notableQuotes: [
        { quote: "The new dashboard is gorgeous and finally fast. Huge improvement over v1.", context: "App Store Review", sentiment: "POS", emotion: "excitement" },
        { quote: "Billing page keeps timing out when I try to download our monthly VAT invoice.", context: "Support Ticket", sentiment: "NEG", emotion: "frustration" }
      ],
      recommendedActions: [
        { title: "Invoice Background Generation", priority: "CRITICAL", description: "Offload PDF invoice generation to background queue to resolve timeout errors.", expectedOutcome: "Eliminate 500 errors on invoice downloads." },
        { title: "Team Invitation Resend & Direct Links", priority: "HIGH", description: "Allow users to copy direct magic invite links to bypass email spam filters.", expectedOutcome: "Resolve onboarding delays." }
      ]
    });

    await prisma.report.create({
      data: {
        title: "Executive Voice-of-Customer Digest (Monthly Review)",
        periodStart: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: now,
        contentJson: sampleReportContent,
        generatedById: adminUser.id,
        workspaceId: workspace.id,
      },
    });
    console.log("✅ Seeded sample VoC Report");
  }

  // 9. Seed Sample Roadmap Items
  await prisma.roadmapItem.deleteMany({ where: { workspaceId: workspace.id } });
  const billingTheme = themeMap.get("Billing & Invoices");
  const onboardingTheme = themeMap.get("Onboarding & Setup");
  const integrationsTheme = themeMap.get("Integrations & APIs");

  await prisma.roadmapItem.createMany({
    data: [
      {
        title: "Google Workspace & Okta SSO Auth Integration",
        description: "Allow enterprise teams to authenticate via Google/Okta SAML SSO and auto-join workspace domain.",
        stage: "IN_PROGRESS",
        impactScore: 95.0,
        targetRelease: "v2.4 (Q4 2026)",
        themeId: onboardingTheme,
        workspaceId: workspace.id,
      },
      {
        title: "PDF Invoice Background Queue & Async Downloads",
        description: "Offload PDF invoice generation to background queue to prevent 500 server timeouts.",
        stage: "IN_PROGRESS",
        impactScore: 92.0,
        targetRelease: "v2.4 (Q4 2026)",
        themeId: billingTheme,
        workspaceId: workspace.id,
      },
      {
        title: "Bi-Directional Linear & Jira Integration Sync",
        description: "Convert triaged negative feedback directly into tracked Linear/Jira engineering issues.",
        stage: "COMPLETED",
        impactScore: 90.0,
        targetRelease: "v2.3 (Current)",
        themeId: integrationsTheme,
        workspaceId: workspace.id,
      },
      {
        title: "Multilingual Customer Feedback AI Translation",
        description: "Translate Japanese, German, and Spanish customer feedback automatically into English.",
        stage: "CONSIDERATION",
        impactScore: 78.0,
        targetRelease: "v2.5 (Q1 2027)",
        themeId: integrationsTheme,
        workspaceId: workspace.id,
      },
      {
        title: "Custom Automated Tagging & Regex Rules Engine",
        description: "Allow workspace admins to define custom regex tag rules for incoming signals.",
        stage: "CONSIDERATION",
        impactScore: 82.0,
        targetRelease: "v2.5 (Q1 2027)",
        workspaceId: workspace.id,
      },
    ],
  });
  console.log("✅ Seeded 5 Feedback-Driven Roadmap items");

  // 10. Seed Sample Action Items (Linear/Jira tickets)
  await prisma.actionItem.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.actionItem.createMany({
    data: [
      {
        title: "Fix PDF invoice timeout on multi-currency VAT downloads",
        description: "Reported by Enterprise - Omnicorp (REF-1010). Resolves 500 server error.",
        integration: "LINEAR",
        externalKey: "LOO-142",
        status: "IN_PROGRESS",
        priority: "URGENT",
        createdById: adminUser?.id,
        workspaceId: workspace.id,
      },
      {
        title: "Implement Okta SAML 2.0 SSO handler",
        description: "Requested by FinTech Corp & StateGov prospects during sales call.",
        integration: "JIRA",
        externalKey: "ENG-809",
        status: "TODO",
        priority: "HIGH",
        createdById: adminUser?.id,
        workspaceId: workspace.id,
      },
      {
        title: "Optimize table pagination query for >2000 records",
        description: "Reported by Enterprise - DataSys. Added SQL index on createdAt + sentiment.",
        integration: "LINEAR",
        externalKey: "LOO-138",
        status: "DONE",
        priority: "HIGH",
        createdById: adminUser?.id,
        workspaceId: workspace.id,
      },
    ],
  });
  console.log("✅ Seeded sample Linear/Jira Action Items");

  console.log(`🎉 Seeding complete! ${allFeedback.length} feedback items seeded successfully with enterprise AI attributes.`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
