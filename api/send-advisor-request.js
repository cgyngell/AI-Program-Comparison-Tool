const { randomUUID } = require("crypto");

module.exports = async function handler(req, res) {
  const requestId = randomUUID();
  const now = new Date().toISOString();

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed", requestId });
  }

  try {
    const {
      fromName = "",
      fromEmail = "",
      notes = "",
      selectedPrograms = [],
      comparisonLink = "",
      honey = ""
    } = req.body || {};

    const sanitizedPrograms = (Array.isArray(selectedPrograms) ? selectedPrograms : [])
      .map((title) => String(title || "").trim())
      .filter(Boolean)
      .slice(0, 10);

    const logPayload = {
      requestId,
      timestamp: now,
      fromName: String(fromName || "").trim() || "Not provided",
      fromEmail: String(fromEmail || "").trim() || "Not provided",
      programCount: sanitizedPrograms.length,
      selectedPrograms: sanitizedPrograms,
      comparisonLink: String(comparisonLink || "").trim() || "Not provided",
      ip: String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown"
    };

    console.log("[advisor-request] received", logPayload);

    if (honey) {
      console.log("[advisor-request] honeypot_blocked", { requestId, timestamp: now });
      return res.status(200).json({ ok: true, requestId });
    }

    if (sanitizedPrograms.length === 0) {
      console.warn("[advisor-request] validation_failed", { requestId, reason: "no_selected_programs" });
      return res.status(400).json({ error: "Select at least one program.", requestId });
    }

    const trimmedEmail = String(fromEmail).trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailPattern.test(trimmedEmail)) {
      console.warn("[advisor-request] validation_failed", { requestId, reason: "invalid_email" });
      return res.status(400).json({ error: "A valid email is required.", requestId });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.ADVISOR_TO_EMAIL || "buvem@bu.edu";
    const fromEmailAddress = process.env.ADVISOR_FROM_EMAIL;

    if (!resendApiKey || !fromEmailAddress) {
      console.error("[advisor-request] config_missing", {
        requestId,
        hasResendApiKey: Boolean(resendApiKey),
        hasFromEmail: Boolean(fromEmailAddress)
      });
      return res.status(500).json({
        error: "Email service is not configured. Set RESEND_API_KEY and ADVISOR_FROM_EMAIL.",
        requestId
      });
    }

    const selectedList = sanitizedPrograms.map((title) => `- ${title}`).join("\n");
    const subject = "BU Online Program Information Request";
    const textBody = [
      "Hello,",
      "",
      "I would like more information on the following BU Online programs:",
      selectedList,
      "",
      `Name: ${String(fromName || "").trim() || "Not provided"}`,
      `Email: ${trimmedEmail}`,
      "",
      "Notes:",
      String(notes || "").trim() || "No additional notes provided.",
      "",
      `Comparison link: ${String(comparisonLink || "").trim() || "Not provided"}`
    ].join("\n");

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmailAddress,
        to: [toEmail],
        subject,
        text: textBody,
        reply_to: trimmedEmail
      })
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("[advisor-request] provider_rejected", {
        requestId,
        status: resendResponse.status,
        detail: errorText.slice(0, 400)
      });
      return res.status(502).json({
        error: "Email provider rejected the request.",
        detail: errorText.slice(0, 400),
        requestId
      });
    }

    console.log("[advisor-request] sent", {
      requestId,
      timestamp: new Date().toISOString(),
      toEmail,
      programCount: sanitizedPrograms.length,
      selectedPrograms: sanitizedPrograms
    });
    return res.status(200).json({ ok: true, requestId });
  } catch {
    console.error("[advisor-request] unexpected_error", { requestId });
    return res.status(500).json({ error: "Unable to send request right now.", requestId });
  }
};
