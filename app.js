const programs = [
  {
    id: "ms-se-ai",
    title: "Online Master of Science in Software Engineering for Artificial Intelligence",
    credential: "Master's Degree",
    school: "College of Engineering",
    focus: "Software Engineering for AI",
    format: "100% Online",
    completionTime: "16 months",
    credits: 30,
    tuition: "$25,000",
    idealFor: "Engineers and developers building advanced AI-enabled software systems.",
    skills: ["AI Systems Design", "Model Deployment", "Scalable Engineering"],
    careers: ["AI Software Engineer", "ML Platform Engineer", "Engineering Lead"],
    link: "https://www.bu.edu/online/degrees-certificates/ai-programs/online-master-of-science-in-software-engineering-for-artificial-intelligence/"
  },
  {
    id: "ms-cs-ai",
    title: "Online Master of Science in Computer Science: Artificial Intelligence",
    credential: "Master's Degree",
    school: "Graduate School of Arts & Sciences",
    focus: "Computer Science + AI",
    format: "100% Online",
    completionTime: "Not listed",
    credits: 30,
    tuition: "$25,000",
    idealFor: "Students seeking a CS-focused path with advanced AI methods.",
    skills: ["Algorithms", "Machine Learning", "AI Applications"],
    careers: ["AI Engineer", "Software Engineer", "Research Engineer"],
    link: "https://www.bu.edu/online/degrees-certificates/ai-programs/online-master-of-science-in-computer-science-artificial-intelligence/"
  },
  {
    id: "ms-enterprise-ai",
    title: "Online Master of Science in Enterprise AI",
    credential: "Master's Degree",
    school: "Questrom School of Business",
    focus: "Enterprise AI",
    format: "100% Online",
    completionTime: "Not listed",
    credits: 30,
    tuition: "$25,000",
    idealFor: "Professionals implementing AI strategies at organizational scale.",
    skills: ["AI Strategy", "Process Automation", "Data-Driven Transformation"],
    careers: ["AI Program Manager", "Enterprise Data Lead", "Digital Transformation Manager"],
    link: "https://www.bu.edu/online/degrees-certificates/ai-programs/online-master-of-science-in-enterprise-ai/"
  },
  {
    id: "ms-ai-business",
    title: "Online Master of Science in AI in Business",
    credential: "Master's Degree",
    school: "Questrom School of Business",
    focus: "AI in Business",
    format: "100% Online",
    completionTime: "Not listed",
    credits: 32,
    tuition: "$25,000",
    idealFor: "Business professionals applying AI to strategy, operations, and growth.",
    skills: ["Business Analytics", "AI Decision Support", "Strategic Management"],
    careers: ["Product Manager", "Business Intelligence Lead", "Operations Strategy Manager"],
    link: "https://www.bu.edu/online/degrees-certificates/ai-programs/online-master-of-science-in-ai-in-business/"
  },
  {
    id: "med-ai-education",
    title: "Online Master of Education in AI and Education",
    credential: "Master's Degree",
    school: "Wheelock College of Education & Human Development",
    focus: "AI and Education",
    format: "100% Online",
    completionTime: "Not listed",
    credits: 30,
    tuition: "$30,000",
    idealFor: "Educators and academic leaders integrating AI into teaching and learning.",
    skills: ["Instructional Design", "AI Literacy", "Education Leadership"],
    careers: ["Instructional Technology Leader", "Curriculum Designer", "Education Administrator"],
    link: "https://www.bu.edu/online/degrees-certificates/ai-programs/online-master-of-education-in-ai-and-education/"
  },
  {
    id: "msds",
    title: "MS in Data Science",
    credential: "Master's Degree",
    school: "Faculty of Computing & Data Sciences",
    focus: "Data Science",
    format: "100% Online",
    completionTime: "2 years",
    credits: 30,
    tuition: "$25,000",
    idealFor: "Professionals building broad foundations in machine learning and computational data science.",
    skills: ["Machine Learning", "Data Engineering", "Statistical Modeling"],
    careers: ["Data Scientist", "Machine Learning Engineer", "Data Engineer"],
    link: "https://www.bu.edu/online/degrees-certificates/data-science/ms-data-science/"
  }
];

const maxCompare = 4;
const selection = new Set();

const hideSameRows = document.getElementById("hideSameRows");
const programGrid = document.getElementById("programGrid");
const selectionSummary = document.getElementById("selectionSummary");
const clearSelectionBtn = document.getElementById("clearSelection");
const copyShareLinkBtn = document.getElementById("copyShareLink");
const advisorForm = document.getElementById("advisorForm");
const sendAdvisorBtn = document.getElementById("sendAdvisor");
const advisorStatus = document.getElementById("advisorStatus");

const tableHead = document.querySelector("#comparisonTable thead");
const tableBody = document.querySelector("#comparisonTable tbody");

const rowSchema = [
  ["credential", "Credential"],
  ["school", "School"],
  ["focus", "Primary Focus"],
  ["format", "Format"],
  ["completionTime", "Completion Time"],
  ["credits", "Credits"],
  ["tuition", "Estimated Tuition"],
  ["idealFor", "Ideal For"],
  ["skills", "Key Skills"],
  ["careers", "Career Paths"]
];

function enrichProgram(program) {
  return {
    ...program
  };
}

const enrichedPrograms = programs.map(enrichProgram);

function toComparableString(value) {
  if (Array.isArray(value)) {
    return value.join(" | ");
  }
  if (value === undefined || value === null) {
    return "";
  }
  return String(value);
}

function buildQueryString() {
  const params = new URLSearchParams();
  if (selection.size > 0) {
    params.set("compare", [...selection].join(","));
  }
  if (hideSameRows.checked) {
    params.set("hideSame", "1");
  }
  return params.toString();
}

function syncUrl() {
  const query = buildQueryString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  history.replaceState(null, "", nextUrl);
}

function hydrateFromQueryString() {
  const params = new URLSearchParams(window.location.search);
  const compareIds = (params.get("compare") || "").split(",").filter(Boolean);
  compareIds.slice(0, maxCompare).forEach((id) => {
    if (enrichedPrograms.some((program) => program.id === id)) {
      selection.add(id);
    }
  });

  hideSameRows.checked = params.get("hideSame") === "1";
}

function renderCards() {
  programGrid.innerHTML = "";
  const visible = [...enrichedPrograms].sort((a, b) => a.title.localeCompare(b.title));

  visible.forEach((program) => {
    const selected = selection.has(program.id);
    const card = document.createElement("article");
    card.className = `program-card${selected ? " selected" : ""}`;

    card.innerHTML = `
      <span class="badge">${program.credential}</span>
      <h4>${program.title}</h4>
      <p class="meta">${program.school}</p>
      <ul class="program-points">
        <li><strong>Focus:</strong> ${program.focus}</li>
        <li><strong>Credits:</strong> ${program.credits}</li>
        <li><strong>Tuition:</strong> ${program.tuition}</li>
      </ul>
      <div class="card-actions">
        <button class="compare-toggle${selected ? " active" : ""}" data-program-id="${program.id}" type="button">
          ${selected ? "Selected" : "Compare"}
        </button>
        <a class="link-btn" href="${program.link}" target="_blank" rel="noopener noreferrer">Program page</a>
      </div>
    `;

    programGrid.appendChild(card);
  });

  document.querySelectorAll(".compare-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.programId;
      if (!id) {
        return;
      }
      if (selection.has(id)) {
        selection.delete(id);
      } else if (selection.size < maxCompare) {
        selection.add(id);
      } else {
        window.alert(`You can compare up to ${maxCompare} programs at once.`);
      }
      rerender();
    });
  });
}

function selectionPrograms() {
  return [...selection]
    .map((id) => enrichedPrograms.find((program) => program.id === id))
    .filter(Boolean);
}

function formatCellValue(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return String(value);
}

function renderComparisonTable() {
  const selected = selectionPrograms();

  if (!selected.length) {
    tableHead.innerHTML = "";
    tableBody.innerHTML = `
      <tr>
        <td>Select programs to generate a side-by-side comparison.</td>
      </tr>
    `;
    return;
  }

  tableHead.innerHTML = `
    <tr>
      <th>Attribute</th>
      ${selected.map((program) => `<th>${program.title}</th>`).join("")}
    </tr>
  `;

  const rows = rowSchema
    .map(([key, label]) => {
      const values = selected.map((program) => toComparableString(program[key]));
      const allSame = values.every((value) => value === values[0]);
      return { label, values, hidden: hideSameRows.checked && allSame };
    })
    .filter((row) => !row.hidden);

  tableBody.innerHTML = rows
    .map(
      (row) => `
      <tr>
        <th scope="row">${row.label}</th>
        ${row.values.map((value) => `<td>${formatCellValue(value)}</td>`).join("")}
      </tr>
    `
    )
    .join("");
}

function renderSelectionSummary() {
  const count = selection.size;
  if (count === 0) {
    selectionSummary.textContent = "No programs selected.";
    return;
  }
  selectionSummary.textContent = `${count} of ${maxCompare} selected for comparison.`;
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    copyShareLinkBtn.textContent = "Copied";
    setTimeout(() => {
      copyShareLinkBtn.textContent = "Copy Share Link";
    }, 1200);
  } catch {
    window.alert("Unable to copy automatically. Please copy the URL from your browser.");
  }
}

function buildAdvisorMailtoLink(recipient, selected, fromName, fromEmail, notes) {
  const subject = "BU Online Program Information Request";
  const selectedList = selected.map((program) => `- ${program.title}`).join("\n");
  const body = [
    "Hello,",
    "",
    "I would like more information on the following BU Online programs:",
    selectedList,
    "",
    `Name: ${fromName || "Not provided"}`,
    `Email: ${fromEmail || "Not provided"}`,
    "",
    "Notes:",
    notes || "No additional notes provided.",
    "",
    `Comparison link: ${window.location.href}`
  ].join("\n");

  return `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function sendToAdvisor(event) {
  event.preventDefault();
  const selected = selectionPrograms();
  if (!selected.length) {
    window.alert("Select at least one program before requesting info.");
    return;
  }

  const formData = new FormData(advisorForm);
  const fromName = (formData.get("advisorName") || "").toString().trim();
  const fromEmail = (formData.get("advisorEmail") || "").toString().trim();
  const recipient = (formData.get("advisorRecipient") || "buvem@bu.edu").toString().trim();
  const notes = (formData.get("advisorNotes") || "").toString().trim();
  const honey = (formData.get("advisorCompany") || "").toString().trim();

  if (!fromEmail) {
    window.alert("Please enter your email address.");
    return;
  }

  sendAdvisorBtn.disabled = true;
  sendAdvisorBtn.textContent = "Sending...";
  advisorStatus.textContent = "Sending your request...";
  advisorStatus.className = "advisor-status pending";

  const payload = {
    fromName,
    fromEmail,
    notes,
    honey,
    comparisonLink: window.location.href,
    selectedPrograms: selected.map((program) => program.title)
  };

  try {
    const response = await fetch("/api/send-advisor-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = data.error || "Unable to send right now. Please try again.";
      throw new Error(message);
    }

    advisorStatus.textContent = "Request sent. An advisor should follow up shortly.";
    advisorStatus.className = "advisor-status success";
    advisorForm.reset();
  } catch (error) {
    advisorStatus.textContent = "Direct send unavailable. Opening your email app as fallback...";
    advisorStatus.className = "advisor-status error";
    const mailtoLink = buildAdvisorMailtoLink(recipient, selected, fromName, fromEmail, notes);
    window.location.href = mailtoLink;
  } finally {
    sendAdvisorBtn.disabled = false;
    sendAdvisorBtn.textContent = "Request Info";
  }

}

function rerender() {
  renderCards();
  renderSelectionSummary();
  renderComparisonTable();
  syncUrl();
}

function attachEvents() {
  hideSameRows.addEventListener("change", rerender);

  clearSelectionBtn.addEventListener("click", () => {
    selection.clear();
    rerender();
  });

  copyShareLinkBtn.addEventListener("click", copyShareLink);
  advisorForm.addEventListener("submit", sendToAdvisor);
}

function init() {
  hydrateFromQueryString();
  attachEvents();

  if (!selection.size) {
    selection.add("ms-se-ai");
    selection.add("msds");
  }

  rerender();
}

init();
