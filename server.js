const express = require("express");
const app = express();

app.use(express.json());

/* ===============================
   DUMMY DATA
================================ */
const existingBugs = [
  "signup button not displaying",
  "login page not loading",
  "dashboard icon not visible",
  "submit button not working",
  "profile page crash on save"
];

/* ===============================
   SIMILARITY FUNCTION
================================ */
function similarity(a, b) {
  const w1 = a.toLowerCase().split(" ");
  const w2 = b.toLowerCase().split(" ");
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

  const results = existingBugs.map(bug => ({
    summary: bug,
    similarity: similarity(title, bug)
  })).sort((a, b) => b.similarity - a.similarity);

  if (results[0].similarity > 60) {
    return res.json({
      duplicate: true,
      suggestions: results.slice(0, 3)
    });
  }

  res.json({
    duplicate: false,
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
    
    <h2 style="text-align:center;">🚀 Smart Bug Checker</h2>

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

  if(data.duplicate){
    html += "<p style='color:red;'>❌ Duplicate Found</p>";
  } else {
    html += "<p style='color:green;'>✅ No Duplicate Found</p>";
  }

  html += "<h4>Suggestions:</h4>";

  data.suggestions.forEach(s => {
    html += "<p>• " + s.summary + " (" + s.similarity + "%)</p>";
  });

  if(!data.duplicate){
    html += "<br><button onclick='createBug()' style='padding:10px;background:green;color:white;border:none;border-radius:6px;'>Create Bug</button>";
  }

  document.getElementById("out").innerHTML = html;
}

/* ===============================
   CREATE BUG (FINAL FIX)
================================ */
function createBug(){
  const title = document.getElementById("title").value;

  const jiraUrl = "https://tomargourav10.atlassian.net";

  // ✅ UPDATE THESE VALUES
  const projectId = "10001";     // My AI Team project ID
  const issueTypeId = "10042";   // Bug ID

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
  console.log("🚀 http://localhost:3000");
});