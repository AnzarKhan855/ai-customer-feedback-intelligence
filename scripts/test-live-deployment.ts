/**
 * Complete Live Production Deployment Verification & User Journey Test Suite
 * Tests against https://ai-customer-feedback-intelligence-black.vercel.app
 */

const BASE_URL = "https://ai-customer-feedback-intelligence-black.vercel.app";

// Helper for cookie jar management
class CookieJar {
  cookies: Record<string, string> = {};

  absorb(res: Response) {
    const setCookies = res.headers.getSetCookie
      ? res.headers.getSetCookie()
      : [res.headers.get("set-cookie") || ""];
    for (const c of setCookies) {
      if (!c) continue;
      const mainPart = c.split(";")[0];
      const eqIdx = mainPart.indexOf("=");
      if (eqIdx !== -1) {
        const key = mainPart.slice(0, eqIdx).trim();
        const val = mainPart.slice(eqIdx + 1).trim();
        this.cookies[key] = val;
      }
    }
  }

  toHeader(): string {
    return Object.entries(this.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  hasSession(): boolean {
    return Boolean(
      this.cookies["next-auth.session-token"] ||
        this.cookies["__Secure-next-auth.session-token"]
    );
  }

  clear() {
    this.cookies = {};
  }
}

async function performLogin(email: string, pass: string): Promise<{ status: number; jar: CookieJar }> {
  const jar = new CookieJar();
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  jar.absorb(csrfRes);

  const params = new URLSearchParams();
  params.append("csrfToken", csrfData.csrfToken);
  params.append("email", email);
  params.append("password", pass);
  params.append("json", "true");

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: jar.toHeader(),
    },
    body: params.toString(),
    redirect: "manual",
  });

  jar.absorb(loginRes);
  return { status: loginRes.status, jar };
}

async function runFullUserJourney() {
  const results: Array<{ step: string; status: "PASS" | "FAIL"; detail: string }> = [];

  const record = (step: string, pass: boolean, detail: string) => {
    results.push({ step, status: pass ? "PASS" : "FAIL", detail });
    console.log(`${pass ? "✅ PASS" : "❌ FAIL"}: [${step}] - ${detail}`);
  };

  console.log("======================================================================");
  console.log("LOOP 2.0 — COMPLETE LIVE PRODUCTION USER JOURNEY VERIFICATION");
  console.log("Live Target:", BASE_URL);
  console.log("Timestamp:", new Date().toISOString());
  console.log("======================================================================\n");

  // SECTION 1: PUBLIC & STATIC ASSETS
  try {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();
    const hasGrounded = html.includes("Grounded AI Analyst");
    const hasZero = html.includes("Zero Hallucination Guarantee");
    const hasAvailability = html.includes("100% availability");
    const pass = res.status === 200 && hasGrounded && !hasZero && !hasAvailability;
    record("1.1 Landing Page Status & Copy", pass, `HTTP ${res.status}, GroundedCopy=${hasGrounded}`);

    const resFav = await fetch(`${BASE_URL}/favicon.ico`);
    record("1.2 Favicon HTTP 200", resFav.status === 200, `HTTP ${resFav.status}, Type=${resFav.headers.get("content-type")}`);

    const resRob = await fetch(`${BASE_URL}/robots.txt`);
    const robText = await resRob.text();
    record("1.3 Robots.txt HTTP 200", resRob.status === 200 && robText.includes("User-agent"), `HTTP ${resRob.status}`);

    const resHealth = await fetch(`${BASE_URL}/api/health`);
    const healthData = await resHealth.json();
    const healthPass = resHealth.status === 200 && healthData.status === "ready" && healthData.database?.status === "healthy";
    record("1.4 Health Check API", healthPass, `HTTP ${resHealth.status}, Status=${healthData.status}, DBLatency=${healthData.database?.latencyMs}ms`);
  } catch (err: any) {
    record("1.0 Public Infrastructure", false, err.message);
  }

  // SECTION 2: AUTHENTICATION FLOWS (DEMO USERS & SECURITY)
  let adminJar = new CookieJar();
  let analystJar = new CookieJar();
  let viewerJar = new CookieJar();

  try {
    // Admin login
    const adminLogin = await performLogin("admin@loop.dev", "password123");
    adminJar = adminLogin.jar;
    record("2.1 Admin Login (admin@loop.dev)", (adminLogin.status === 200 || adminLogin.status === 302) && adminJar.hasSession(), `HTTP ${adminLogin.status}, SessionTokenActive=${adminJar.hasSession()}`);

    // Analyst login
    const analystLogin = await performLogin("analyst@loop.dev", "password123");
    analystJar = analystLogin.jar;
    record("2.2 Analyst Login (analyst@loop.dev)", (analystLogin.status === 200 || analystLogin.status === 302) && analystJar.hasSession(), `HTTP ${analystLogin.status}, SessionTokenActive=${analystJar.hasSession()}`);

    // Viewer login
    const viewerLogin = await performLogin("viewer@loop.dev", "password123");
    viewerJar = viewerLogin.jar;
    record("2.3 Viewer Login (viewer@loop.dev)", (viewerLogin.status === 200 || viewerLogin.status === 302) && viewerJar.hasSession(), `HTTP ${viewerLogin.status}, SessionTokenActive=${viewerJar.hasSession()}`);

    // Bad password
    const badPass = await performLogin("admin@loop.dev", "wrong-password");
    record("2.4 Invalid Password Rejection", badPass.status === 401 || !badPass.jar.hasSession(), `HTTP ${badPass.status}, RejectedProperly=${!badPass.jar.hasSession()}`);

    // Nonexistent user
    const noUser = await performLogin("nonexistent_user_999@loop.dev", "password123");
    record("2.5 Nonexistent User Rejection", noUser.status === 401 || !noUser.jar.hasSession(), `HTTP ${noUser.status}, RejectedProperly=${!noUser.jar.hasSession()}`);
  } catch (err: any) {
    record("2.0 Authentication Suite", false, err.message);
  }

  // Helper for admin fetch
  const adminFetch = (path: string, options: RequestInit = {}) => {
    return fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        Cookie: adminJar.toHeader(),
      },
    });
  };

  // SECTION 3: CORE ANALYTICS & DASHBOARD DATA
  try {
    // Dashboard stats
    const statsRes = await adminFetch("/api/dashboard/stats");
    const statsData = await statsRes.json();
    const statsPass = statsRes.status === 200 && typeof statsData.metrics?.totalFeedback === "number" && statsData.metrics.totalFeedback > 0;
    record("3.1 Dashboard Stats & KPIs", statsPass, `HTTP ${statsRes.status}, TotalFeedback=${statsData.metrics?.totalFeedback}, NetSentiment=${statsData.metrics?.netSentimentScore}`);

    // Feedback list
    const fbRes = await adminFetch("/api/feedback?limit=10&page=1");
    const fbData = await fbRes.json();
    const fbPass = fbRes.status === 200 && Array.isArray(fbData.items) && fbData.items.length > 0;
    record("3.2 Feedback Inbox Query", fbPass, `HTTP ${fbRes.status}, ReturnedItems=${fbData.items?.length}, TotalCount=${fbData.pagination?.totalCount}`);

    // Alerts
    const alertsRes = await adminFetch("/api/alerts");
    const alertsData = await alertsRes.json();
    const alertsPass = alertsRes.status === 200 && Array.isArray(alertsData.alerts) && alertsData.alerts.length > 0;
    record("3.3 Real-time Anomaly Alerts", alertsPass, `HTTP ${alertsRes.status}, Count=${alertsData.alerts?.length}`);

    // Recommendations
    const recsRes = await adminFetch("/api/recommendations");
    const recsData = await recsRes.json();
    const recsPass = recsRes.status === 200 && Array.isArray(recsData.recommendations) && recsData.recommendations.length > 0;
    record("3.4 AI Strategic Recommendations", recsPass, `HTTP ${recsRes.status}, Count=${recsData.recommendations?.length}`);

    // Roadmap
    const roadRes = await adminFetch("/api/roadmap");
    const roadData = await roadRes.json();
    const roadPass = roadRes.status === 200 && Array.isArray(roadData.items) && roadData.items.length > 0;
    record("3.5 Roadmap Initiatives", roadPass, `HTTP ${roadRes.status}, Count=${roadData.items?.length}`);

    // Themes
    const themeRes = await adminFetch("/api/themes");
    const themeData = await themeRes.json();
    const themePass = themeRes.status === 200 && Array.isArray(themeData.themes) && themeData.themes.length > 0;
    record("3.6 Clustered Feedback Themes", themePass, `HTTP ${themeRes.status}, Count=${themeData.themes?.length}`);

    // Reports list
    const repRes = await adminFetch("/api/reports");
    const repData = await repRes.json();
    const repPass = repRes.status === 200 && Array.isArray(repData.reports);
    record("3.7 VoC Executive Reports", repPass, `HTTP ${repRes.status}, Count=${repData.reports?.length}`);
  } catch (err: any) {
    record("3.0 Dashboard Analytics", false, err.message);
  }

  // SECTION 4: FEEDBACK INGESTION & DATA QUALITY
  let createdFeedbackId = "";
  try {
    // 4.1 Single feedback creation
    const singlePayload = {
      content: "The SAML SSO authentication setup on Okta threw an invalid signature error during our quarterly audit.",
      channel: "SUPPORT_TICKET",
      customerLabel: "Enterprise Bank Security Lead",
      sourceRef: `SEC-AUDIT-${Date.now()}`,
    };
    const singleRes = await adminFetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(singlePayload),
    });
    const singleData = await singleRes.json();
    const singlePass = singleRes.status === 200 && singleData.success === true && Boolean(singleData.feedback?.id);
    createdFeedbackId = singleData.feedback?.id || "";
    record(
      "4.1 Ingest Single Feedback (POST /api/feedback)",
      singlePass,
      `HTTP ${singleRes.status}, ID=${singleData.feedback?.id}, Sentiment=${singleData.feedback?.sentiment}, Severity=${singleData.feedback?.severityScore}/100, Themes=${singleData.feedback?.themes?.join(", ")}`
    );

    // 4.2 Stream simulation (SimulateChannelModal)
    const simRes = await adminFetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        simulateBatch: true,
        channel: "NPS_SURVEY",
        count: 2,
      }),
    });
    const simData = await simRes.json();
    const simPass = simRes.status === 200 && simData.success === true && simData.count === 2;
    record("4.2 Simulate Channel Stream (SimulateChannelModal Batch)", simPass, `HTTP ${simRes.status}, Count=${simData.count}`);

    // 4.3 Validation error check (missing content)
    const badFbRes = await adminFetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "ab" }), // less than 3 chars
    });
    record("4.3 Validation Error on Invalid Input", badFbRes.status === 400, `HTTP ${badFbRes.status}`);

    // 4.4 Bulk CSV Ingestion
    const bulkPayload = {
      datasetName: `Audit Ingestion ${Date.now()}`,
      fileName: "feedback_import.csv",
      fileType: "CSV",
      rows: [
        { feedback: "Super intuitive filter bar. Found our top user complaints in seconds.", channel: "COMMUNITY", customer: "Beta Tester" },
        { feedback: "Invoice PDF download returns 500 internal server error repeatedly.", channel: "SUPPORT_TICKET", customer: "Accounting Firm" },
      ],
    };
    const bulkRes = await adminFetch("/api/feedback/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bulkPayload),
    });
    const bulkData = await bulkRes.json();
    const bulkPass = bulkRes.status === 200 && bulkData.success === true && bulkData.imported === 2;
    record("4.4 Bulk Ingestion Engine (POST /api/feedback/bulk)", bulkPass, `HTTP ${bulkRes.status}, DatasetID=${bulkData.datasetId}, ValidRows=${bulkData.imported}`);
  } catch (err: any) {
    record("4.0 Feedback Ingestion", false, err.message);
  }

  // SECTION 5: ACTIONS & ROADMAP PERSISTENCE
  try {
    // Create Action Item
    const actionRes = await adminFetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Fix Okta SAML signature validation (${Date.now()})`,
        description: "Investigate and patch certificate chain validation issue.",
        integration: "LINEAR",
        priority: "HIGH",
        feedbackId: createdFeedbackId || undefined,
      }),
    });
    const actionData = await actionRes.json();
    const actionPass = (actionRes.status === 200 || actionRes.status === 201) && Boolean(actionData.id || actionData.action?.id);
    record("5.1 Create Action Item (POST /api/actions)", actionPass, `HTTP ${actionRes.status}, ActionID=${actionData.id || actionData.action?.id}`);

    // Create Roadmap Item
    const roadCreateRes = await adminFetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Enterprise SAML SSO Hardening (${Date.now()})`,
        description: "Full SCIM directory sync and multi-certificate rotation.",
        stage: "IN_PROGRESS",
        impactScore: 92,
        targetRelease: "Q2 2026",
      }),
    });
    const roadCreateData = await roadCreateRes.json();
    const roadCreatePass = (roadCreateRes.status === 200 || roadCreateRes.status === 201) && Boolean(roadCreateData.id || roadCreateData.item?.id);
    record("5.2 Create Roadmap Item (POST /api/roadmap)", roadCreatePass, `HTTP ${roadCreateRes.status}`);

    // Generate VoC Executive Report
    const reportGenRes = await adminFetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        period: "30d",
        type: "executive",
        title: `Production Audit VoC Report (${new Date().toLocaleDateString()})`,
      }),
    });
    const reportGenData = await reportGenRes.json();
    const reportGenPass = (reportGenRes.status === 200 || reportGenRes.status === 201) && Boolean(reportGenData.report?.id);
    record("5.3 Generate VoC Executive Report (POST /api/reports)", reportGenPass, `HTTP ${reportGenRes.status}, ReportID=${reportGenData.report?.id}`);
  } catch (err: any) {
    record("5.0 Actions & Reports", false, err.message);
  }

  // SECTION 6: AI ANALYST & RAG GROUNDING RIGOR
  try {
    // 6.1 Grounded Query
    const askGroundedRes = await adminFetch("/api/insights/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "What issues are customers reporting about refunds and billing?",
      }),
    });
    const askGroundedData = await askGroundedRes.json();
    const hasCitations = Array.isArray(askGroundedData.citedFeedback) && askGroundedData.citedFeedback.length > 0;
    const hasAnswer = typeof askGroundedData.answer === "string" && askGroundedData.answer.length > 20;
    const groundedPass = askGroundedRes.status === 200 && hasAnswer && hasCitations;
    record(
      "6.1 Grounded AI Analyst Query (POST /api/insights/ask)",
      groundedPass,
      `HTTP ${askGroundedRes.status}, CitationsCount=${askGroundedData.citedFeedback?.length || 0}, Confidence=${askGroundedData.confidence}`
    );

    // 6.2 Absent Query (Honest Zero-Match)
    const askAbsentRes = await adminFetch("/api/insights/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "Why are customers complaining about audio playback and buffering?",
      }),
    });
    const askAbsentData = await askAbsentRes.json();
    const zeroCitations = !askAbsentData.citedFeedback || askAbsentData.citedFeedback.length === 0;
    const honestAnswer = typeof askAbsentData.answer === "string" && /No relevant customer feedback was found/i.test(askAbsentData.answer);
    const absentPass = askAbsentRes.status === 200 && zeroCitations && honestAnswer;
    record(
      "6.2 Honest Zero-Match Detection on Absent Topic",
      absentPass,
      `HTTP ${askAbsentRes.status}, CitationsCount=${askAbsentData.citedFeedback?.length || 0}, HonestAcknowledgment=${honestAnswer}`
    );
  } catch (err: any) {
    record("6.0 AI Analyst & RAG", false, err.message);
  }

  // SECTION 7: RBAC SERVER-SIDE ENFORCEMENT
  try {
    // Viewer cannot ingest feedback
    const viewerForbiddenRes = await fetch(`${BASE_URL}/api/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: viewerJar.toHeader(),
      },
      body: JSON.stringify({
        content: "Unauthorized attempt by viewer to ingest feedback.",
        channel: "SUPPORT_TICKET",
      }),
    });
    const rbacViewerPass = viewerForbiddenRes.status === 403;
    record("7.1 RBAC Enforcement: Viewer Blocked from Feedback Ingestion", rbacViewerPass, `HTTP ${viewerForbiddenRes.status} (Expected 403)`);

    // Analyst CAN ingest feedback
    const analystAllowedRes = await fetch(`${BASE_URL}/api/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: analystJar.toHeader(),
      },
      body: JSON.stringify({
        content: "Authorized feedback submission by certified analyst user.",
        channel: "COMMUNITY",
      }),
    });
    const rbacAnalystPass = analystAllowedRes.status === 200;
    record("7.2 RBAC Enforcement: Analyst Allowed Feedback Ingestion", rbacAnalystPass, `HTTP ${analystAllowedRes.status} (Expected 200)`);
  } catch (err: any) {
    record("7.0 RBAC Enforcement", false, err.message);
  }

  // SECTION 8: TENANT SIGNUP, ISOLATION & IDOR PROTECTION
  let newTenantJar = new CookieJar();
  const uniqueTenantEmail = `tenant_audit_${Date.now()}@iso-test.dev`;
  try {
    // Signup new tenant
    const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Audit Tenant Lead",
        email: uniqueTenantEmail,
        password: "tenantSecretPassword123!",
        workspaceName: `Audit Workspace ${Date.now()}`,
      }),
    });
    const signupData = await signupRes.json();
    const signupPass = signupRes.status === 200 && Boolean(signupData.workspaceId);
    record("8.1 Tenant Signup (POST /api/auth/signup)", signupPass, `HTTP ${signupRes.status}, WorkspaceID=${signupData.workspaceId}`);

    // Duplicate email registration rejected
    const dupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate User",
        email: uniqueTenantEmail,
        password: "tenantSecretPassword123!",
        workspaceName: "Duplicate Org",
      }),
    });
    record("8.2 Duplicate Registration Rejection (HTTP 400)", dupRes.status === 400, `HTTP ${dupRes.status} (Expected 400)`);

    // Login as new tenant
    const tenantLogin = await performLogin(uniqueTenantEmail, "tenantSecretPassword123!");
    newTenantJar = tenantLogin.jar;
    record("8.3 Login to Freshly Created Tenant Workspace", tenantLogin.jar.hasSession(), `SessionActive=${tenantLogin.jar.hasSession()}`);

    // Verify workspace isolation (0 records in new tenant feedback)
    const isolationRes = await fetch(`${BASE_URL}/api/feedback`, {
      headers: { Cookie: newTenantJar.toHeader() },
    });
    const isolationData = await isolationRes.json();
    const isolationPass = isolationRes.status === 200 && isolationData.items?.length === 0;
    record("8.4 Strict Tenant Workspace Isolation (Zero Cross-Tenant Leakage)", isolationPass, `HTTP ${isolationRes.status}, FeedbackCount=${isolationData.items?.length || 0}`);

    // IDOR Protection: attempt to access Acme Corp feedback ID from new tenant
    if (createdFeedbackId) {
      const idorRes = await fetch(`${BASE_URL}/api/feedback/${createdFeedbackId}`, {
        headers: { Cookie: newTenantJar.toHeader() },
      });
      const idorPass = idorRes.status === 404;
      record("8.5 IDOR Protection (Cross-Workspace Item Access Blocked)", idorPass, `HTTP ${idorRes.status} (Expected 404 Not Found)`);
    }
  } catch (err: any) {
    record("8.0 Tenant Isolation", false, err.message);
  }

  // SECTION 9: LOGOUT & UNAUTHENTICATED PROTECTION
  try {
    const unauthStats = await fetch(`${BASE_URL}/api/dashboard/stats`);
    record("9.1 Unauthenticated API Request Rejection", unauthStats.status === 401, `HTTP ${unauthStats.status} (Expected 401 Unauthorized)`);
  } catch (err: any) {
    record("9.0 Logout & Protection", false, err.message);
  }

  console.log("\n======================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`TOTAL USER JOURNEY CHECKS: ${total}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`PASS RATE: ${Math.round((passed / total) * 100)}%`);
  console.log("======================================================================");

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runFullUserJourney().catch((e) => {
  console.error("Fatal test runner error:", e);
  process.exit(1);
});
