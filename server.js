const express = require("express");
const app = express();

app.use(express.json());

/* ===============================
   DUMMY DATA (simulate Jira bugs)
================================ */
const existingBugs = [
  "signup button not displaying",
  "login page not loading",
  "dashboard icon not visible",
  "submit button not working",
  "profile page crash on save"
];

/* ===============================
   SYNONYMS (SMART MATCHING)
================================ */
const synonyms = {
  button: ["icon", "btn"],
  icon: ["button", "btn"],
  click: ["press"],
  clickable: ["working"],
  working: ["clickable", "functioning"],
  visible: ["displaying", "showing"],
  displaying: ["visible", "showing"],
  error: ["issue", "bug"],
  crash: ["fail", "break"],
  loading: ["opening"],
  page: ["screen"]
};

/* ===============================
   NORMALIZE TEXT
================================ */
function normalize(text) {
  return text
    .toLowerCase()
    .split(" ")
    .map(word => {
      for (let key in synonyms) {
        if (key === word || synonyms[key].includes(word)) {
          return key;
        }
      }
      return word;
    })
    .join(" ");
}

/* ===============================
   SIMILARITY FUNCTION
================================ */
function similarity(a, b) {
  const w1 = a.split(" ");
  const w2 = b.split(" ");

  const match = w1.filter(x => w2.includes(x));
  return Math.round((match.length / Math.max(w1.length, w2.length)) * 100);
}

/* ===============================
   CHECK DUPLICATE
================================ */
app.post("/check-bug", (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title required" });
  }

  const normalizedInput = normalize(title);

  const results = existingBugs.map(bug => {
    const normalizedBug = normalize(bug);
    return {
      summary: bug,
      similarity: similarity(normalizedInput, normalizedBug)
    };
  }).sort((a, b) => b.similarity - a.similarity);

  res.json({
    duplicate: results[0].similarity > 60,
    suggestions: results.slice(0, 3)
  });
});

/* ===============================
   UI
================================ */
app.get("/", (req, res) => {
  res.send(`
  <html>
  <body style="font-family:Arial;background:#f5f7fa;padding:40px;">

  <div style="max-width:650px;margin:auto;background:white;padding:25px;border-radius:12px;box-shadow:0 0 10px #ccc;">
    
    <h2 style="text-align:center;">🚀 Smart Jira Bug Checker</h2>

    <input id="title" placeholder="Enter Bug Title"
      style="width:100%;padding:12px;border-radius:8px;border:1px solid #ccc;">

    <br><br>

    <button onclick="check()"
      style="width:100%;padding:12px;background:#007bff;color:white;border:none;border-radius:8px;">
      Check Duplicate
    </button>

    <div id="out" style="margin-top:20px;"></div>
  </div>

<script>
async function check(){
  const title = document.getElementById("title").value;

  document.getElementById("out").innerHTML = "Checking...";

  const res = await fetch("/check-bug",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({title})
  });

  const data = await res.json();

  let html = "";
  const topMatch = data.suggestions[0]?.similarity || 0;

  // ❌ STRICT DUPLICATE BLOCK
  if(topMatch > 60){
    html += "<p style='color:red;font-weight:bold;'>❌ Duplicate Bug Detected</p>";
    html += "<p>Bug creation is blocked to avoid duplication.</p>";
  }

  // ⚠️ SIMILAR WARNING
  else if(topMatch >= 40){
    html += "<p style='color:orange;font-weight:bold;'>⚠️ Similar Bug Found</p>";
    html += "<button onclick='createBug()' style='padding:10px;background:orange;color:white;border:none;border-radius:6px;'>Create Anyway</button>";
  }

  // ✅ SAFE
  else{
    html += "<p style='color:green;font-weight:bold;'>✅ No Duplicate Found</p>";
    html += "<button onclick='createBug()' style='padding:10px;background:green;color:white;border:none;border-radius:6px;'>Create Bug</button>";
  }

  html += "<h4>Similar Issues:</h4>";

  data.suggestions.forEach(s => {
    html += "<p>• " + s.summary + " (" + s.similarity + "%)</p>";
  });

  document.getElementById("out").innerHTML = html;
}

/* ===============================
   CREATE BUG (JIRA)
================================ */
function createBug(){
  const title = document.getElementById("title").value;

  const jiraUrl = "https://tomargourav10.atlassian.net";

  // ⚠️ UPDATE THESE FROM YOUR JIRA
  const projectId = "10001";
  const issueTypeId = "10042"; // BUG ID

  const description = \`
Steps to Reproduce:
1. Open application
2. Navigate to page
3. Observe issue

Actual Result:
\${title}

Expected Result:
Proper behavior expected

Environment:
Browser: Chrome
OS: Windows
  \`;

  const url = jiraUrl +
    "/secure/CreateIssueDetails!init.jspa" +
    "?pid=" + projectId +
    "&issuetype=" + issueTypeId +
    "&summary=" + encodeURIComponent(title) +
    "&description=" + encodeURIComponent(description);

  window.open(url, "_blank");
}
</script>

  </body>
  </html>
  `);
});

/* ===============================
   START SERVER
================================ */
app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});