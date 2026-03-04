const { randomUUID } = require("crypto");

function addIfValue(target, key, value) {
  if (value !== undefined && value !== null && String(value).trim() !== "") {
    target[key] = String(value).trim();
  }
}

function parseProgramIdMap(rawValue) {
  if (!rawValue) {
    return {};
  }
  try {
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

module.exports = async function handler(req, res) {
  const requestId = randomUUID();
  const now = new Date().toISOString();

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed", requestId });
  }

  try {
    const {
      firstName = "",
      lastName = "",
      fromEmail = "",
      notes = "",
      phone = "",
      city = "",
      state = "",
      postalcode = "",
      country = "",
      selectedPrograms = [],
      selectedProgramKeys = [],
      comparisonLink = "",
      honey = ""
    } = req.body || {};

    const sanitizedPrograms = (Array.isArray(selectedPrograms) ? selectedPrograms : [])
      .map((title) => String(title || "").trim())
      .filter(Boolean)
      .slice(0, 10);
    const sanitizedProgramKeys = (Array.isArray(selectedProgramKeys) ? selectedProgramKeys : [])
      .map((key) => String(key || "").trim())
      .filter(Boolean)
      .slice(0, 10);

    const logPayload = {
      requestId,
      timestamp: now,
      firstName: String(firstName || "").trim() || "Not provided",
      lastName: String(lastName || "").trim() || "Not provided",
      fromEmail: String(fromEmail || "").trim() || "Not provided",
      programCount: sanitizedPrograms.length,
      selectedPrograms: sanitizedPrograms,
      selectedProgramKeys: sanitizedProgramKeys,
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

    const trimmedFirstName = String(firstName).trim();
    const trimmedLastName = String(lastName).trim();
    if (!trimmedFirstName || !trimmedLastName) {
      console.warn("[advisor-request] validation_failed", { requestId, reason: "missing_name_parts" });
      return res.status(400).json({ error: "First and last name are required.", requestId });
    }

    const bulipApiKey = process.env.BULIP_API_KEY;
    const bulipBaseUrl = (process.env.BULIP_BASE_URL || "https://bulip-f3d46bf27788.herokuapp.com").replace(/\/+$/, "");
    const bulipEndpoint = process.env.BULIP_ENDPOINT || "/leads/web-forms";
    const bulipProgramDefault = process.env.BULIP_PROGRAM_ID;
    const bulipProgramIdMap = parseProgramIdMap(process.env.BULIP_PROGRAM_ID_MAP_JSON);
    const bulipUploadType = process.env.BULIP_UPLOAD_TYPE || "Inquiry";
    const bulipOppstage = process.env.BULIP_OPPSTAGE || "Inquiry";
    const bulipAdmissionsdata = process.env.BULIP_ADMISSIONSDATA || "true";

    if (!bulipApiKey) {
      console.error("[advisor-request] config_missing", {
        requestId,
        hasBulipApiKey: Boolean(bulipApiKey)
      });
      return res.status(500).json({
        error: "Form service is not configured. Set BULIP_API_KEY.",
        requestId
      });
    }

    let targets = [];
    if (sanitizedProgramKeys.length > 1) {
      const missingKeys = sanitizedProgramKeys.filter((key) => !bulipProgramIdMap[key]);
      if (missingKeys.length) {
        console.error("[advisor-request] config_missing_program_ids", {
          requestId,
          missingKeys
        });
        return res.status(500).json({
          error: "Program IDs are missing for one or more selected programs.",
          requestId
        });
      }
      targets = sanitizedProgramKeys.map((key, idx) => ({
        key,
        title: sanitizedPrograms[idx] || key,
        programId: bulipProgramIdMap[key]
      }));
    } else {
      const singleKey = sanitizedProgramKeys[0];
      const mappedProgramId = singleKey ? bulipProgramIdMap[singleKey] : "";
      const singleProgramId = mappedProgramId || bulipProgramDefault;
      if (!singleProgramId) {
        console.error("[advisor-request] config_missing", {
          requestId,
          hasDefaultProgramId: Boolean(bulipProgramDefault),
          hasMappedProgramId: Boolean(mappedProgramId),
          singleKey: singleKey || null
        });
        return res.status(500).json({
          error: "Program ID is not configured.",
          requestId
        });
      }
      targets = [{
        key: singleKey || "",
        title: sanitizedPrograms[0] || "Selected Program",
        programId: singleProgramId
      }];
    }

    const bulipUrl = `${bulipBaseUrl}${bulipEndpoint.startsWith("/") ? bulipEndpoint : `/${bulipEndpoint}`}`;
    const failures = [];
    for (const target of targets) {
      const bulipData = {
        program: target.programId,
        upload_type: bulipUploadType,
        oppstage: bulipOppstage,
        admissionsdata: bulipAdmissionsdata,
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        email: trimmedEmail
      };

      addIfValue(bulipData, "phone", phone);
      addIfValue(bulipData, "City", city);
      addIfValue(bulipData, "state", state);
      addIfValue(bulipData, "postalcode", postalcode);
      addIfValue(bulipData, "country", country);
      addIfValue(bulipData, "notes", notes);
      addIfValue(bulipData, "comparison_link", comparisonLink);
      addIfValue(bulipData, "selected_programs", sanitizedPrograms.join(" | "));
      addIfValue(bulipData, "selected_program", target.title);
      addIfValue(bulipData, "utmsource", process.env.BULIP_UTM_SOURCE);
      addIfValue(bulipData, "utmcampaign", process.env.BULIP_UTM_CAMPAIGN);
      addIfValue(bulipData, "utmcontent", process.env.BULIP_UTM_CONTENT);
      addIfValue(bulipData, "utmgroup", process.env.BULIP_UTM_GROUP);
      addIfValue(bulipData, "utmkeyword", process.env.BULIP_UTM_KEYWORD);
      addIfValue(bulipData, "utm_medium", process.env.BULIP_UTM_MEDIUM);
      addIfValue(bulipData, "utmterm", process.env.BULIP_UTM_TERM);

      const bulipResponse = await fetch(bulipUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": bulipApiKey
        },
        body: JSON.stringify({
          data: bulipData
        })
      });

      if (!bulipResponse.ok) {
        const errorText = await bulipResponse.text();
        failures.push({
          programKey: target.key,
          programTitle: target.title,
          status: bulipResponse.status,
          detail: errorText.slice(0, 300)
        });
      }
    }

    if (failures.length) {
      console.error("[advisor-request] provider_rejected", {
        requestId,
        failures
      });
      return res.status(502).json({
        error: "BULIP rejected the request.",
        detail: JSON.stringify(failures).slice(0, 400),
        requestId
      });
    }

    console.log("[advisor-request] sent", {
      requestId,
      timestamp: new Date().toISOString(),
      bulipUrl,
      sentInquiryCount: targets.length,
      selectedPrograms: sanitizedPrograms,
      targets: targets.map((target) => ({ key: target.key, programId: target.programId }))
    });
    return res.status(200).json({ ok: true, requestId, sentInquiryCount: targets.length });
  } catch {
    console.error("[advisor-request] unexpected_error", { requestId });
    return res.status(500).json({ error: "Unable to send request right now.", requestId });
  }
};
