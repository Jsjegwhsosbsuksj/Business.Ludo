/* ==========================================
   BUSINESS LUDO - SCRIPT.JS
========================================== */

let currentClub = "";
let currentCase = 1;
let currentStatus = "available";
let currentSubmission = null;

let cases = [];
let teamData = {};

// ---------- Navigation ----------

const pages = [
  "home",
  "clubPage",
  "teamPage",
  "adminLogin",
  "adminPage",
  "boardPage"
];

function showPage(id){
  pages.forEach(p=>{
    document.getElementById(p).classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}

function goHome(){ showPage("home"); }
function openClub(){ showPage("clubPage"); }
function openAdmin(){ showPage("adminLogin"); }
function openBoard(){
  showPage("boardPage");
  loadLeaderboard();
}

// ---------- Load Cases ----------

async function loadCases(){
  if(cases.length>0) return;
  const res = await fetch("cases.json");
  cases = await res.json();
}

// ---------- Club Login ----------

async function loginClub(club){

  currentClub = club;

  await loadCases();

  teamData = await getTeamData(club);

  currentCase = teamData.currentCase || 1;

  currentStatus = teamData.status || "available";

  renderTeam();

  showPage("teamPage");

}

// ---------- Team Screen ----------

function renderTeam(){

  const c = cases[currentCase-1];

  document.getElementById("teamTitle").innerHTML =
    `Welcome ${currentClub} Team`;

  document.getElementById("caseBadge").innerHTML =
    `Case ${currentCase}`;

  document.getElementById("progressLabel").innerHTML =
    `${currentCase} / 100`;

  document.getElementById("progressFill").style.width =
    `${currentCase}%`;

  updateStatus();

  const question = rotateQuestion(c);

  const disabled =
    currentStatus==="waiting" ? "readonly" : "";

  const button =
    currentStatus==="waiting"
    ? `<button class="submit-btn" disabled>Waiting...</button>`
    : `<button class="submit-btn" onclick="submitAnswer()">Finish</button>`;

  document.getElementById("caseContainer").innerHTML = `
  <div class="case-card">

      <h2>${c.title}</h2>

      <p>${c.case}</p>

      <table class="dataset">
      <tr>
      <th>Variable</th>
      <th>Sample</th>
      <th>Description</th>
      </tr>

      <tr><td>Month</td><td>${c.month}</td><td>Historical</td></tr>
      <tr><td>Records</td><td>${c.records}</td><td>Transactions</td></tr>
      <tr><td>KPI</td><td>${c.kpi}</td><td>Performance</td></tr>
      <tr><td>Target</td><td>${c.target}</td><td>Goal</td></tr>
      <tr><td>Satisfaction</td><td>${c.satisfaction}</td><td>Survey</td></tr>
      </table>

      <div class="question">
          <h3>Your Question</h3>
          <p>${question}</p>
      </div>

      <textarea id="answerBox" ${disabled}
      placeholder="Write your complete business analysis here...">${teamData.answer || ""}</textarea>

      ${button}

  </div>
  `;

}
async function refreshCurrentTeam(){

    teamData = await getTeamData(currentClub);

    currentCase = teamData.currentCase;

    currentStatus = teamData.status;

    renderTeam();

}

// ---------- Question Shuffle ----------

function rotateQuestion(c){

  const q=[c.q1,c.q2,c.q3,c.q4];

  const r=(currentCase-1)%4;

  if(currentClub==="HR") return q[(0+r)%4];

  if(currentClub==="Marketing") return q[(1+r)%4];

  if(currentClub==="Finance") return q[(2+r)%4];

  return q[(3+r)%4];

}

// ---------- Status ----------

function updateStatus(){

  const panel=document.getElementById("statusPanel");
  const title=document.getElementById("statusTitle");
  const text=document.getElementById("statusText");

  panel.className="status";

  if(currentStatus==="available"){
      panel.classList.add("available");
      title.innerHTML="Case Available";
      text.innerHTML="Solve the current business case.";
  }

  if(currentStatus==="waiting"){
      panel.classList.add("waiting");
      title.innerHTML="Waiting For Admin";
      text.innerHTML="Your answer has been submitted.";
  }

  if(currentStatus==="correct"){
      panel.classList.add("correct");
      title.innerHTML="Correct Answer";
      text.innerHTML="Next case unlocked successfully.";
  }

  if(currentStatus==="wrong"){
      panel.classList.add("wrong");
      title.innerHTML="Incorrect Answer";
      text.innerHTML="Please rewrite and submit again.";
  }

}

// ---------- Submit ----------

async function submitAnswer(){

  const ans=document.getElementById("answerBox").value.trim();

  if(ans===""){
      alert("Enter your answer.");
      return;
  }

  teamData.answer=ans;
  teamData.status="waiting";

  await saveTeamData(currentClub,teamData);

  await saveSubmission({
      club:currentClub,
      caseId:currentCase,
      answer:ans,
      status:"waiting",
      timestamp:new Date().toLocaleTimeString()
  });

  currentStatus="waiting";

  renderTeam();

}

// ---------- Admin Login ----------

function adminLogin(){

  const pass=document.getElementById("adminPassword").value;

  if(pass==="admin123"){

      showPage("adminPage");

      loadAdmin();

  }else{

      alert("Wrong Password");

  }

}

// ---------- Admin Dashboard ----------

async function loadAdmin(){

  const list=await getAllSubmissions();

  document.getElementById("submissionList").innerHTML="";

  let pending=0,approved=0,rejected=0;

  list.forEach((s,index)=>{

      if(s.status==="waiting") pending++;
      if(s.status==="correct") approved++;
      if(s.status==="wrong") rejected++;

      document.getElementById("submissionList").innerHTML += `

      <div class="submission-card">

          <h3>${s.club} — Case ${s.caseId}</h3>

          <p>Status : <b>${s.status}</b></p>

          <p>${s.timestamp}</p>

          <div class="admin-actions">

              <button class="view-btn"
              onclick="viewAnswer(${index})">
              View
              </button>

              <button class="approve-btn"
              onclick="approve(${index})">
              Correct
              </button>

              <button class="reject-btn"
              onclick="reject(${index})">
              Wrong
              </button>

          </div>

      </div>

      `;

  });

  document.getElementById("pendingCount").innerHTML=pending;
  document.getElementById("approvedCount").innerHTML=approved;
  document.getElementById("rejectedCount").innerHTML=rejected;
  document.getElementById("totalCount").innerHTML=list.length;

  window.adminList=list;

}

// ---------- View ----------

function viewAnswer(i){

  currentSubmission=window.adminList[i];

  document.getElementById("modalClub").innerHTML=
  currentSubmission.club+" Team";

  document.getElementById("modalCase").innerHTML=
  "Case "+currentSubmission.caseId;

  document.getElementById("modalAnswer").innerText=
  currentSubmission.answer;

  document.getElementById("answerModal")
  .classList.add("show");

}

function closeModal(){

  document.getElementById("answerModal")
  .classList.remove("show");

}

// ---------- Approve ----------

async function approve(i){

  const s=window.adminList[i];

  await updateSubmission(s.club,s.caseId,"correct");

  let t=await getTeamData(s.club);

  t.currentCase++;
  t.answer="";
  t.status="available";

  await saveTeamData(s.club,t);

  closeModal();

  loadAdmin();

  loadLeaderboard();

}

// ---------- Reject ----------

async function reject(i){

    const s = window.adminList[i];

    await updateSubmission(s.club, s.caseId, "wrong");

    let t = await getTeamData(s.club);

    t.status = "wrong";

    await saveTeamData(s.club, t);

    closeModal();

}
// ---------- Ludo Path ----------

const PATH = [
 {x:300,y:560},
 {x:300,y:520},
 {x:300,y:480},
 {x:300,y:440},
 {x:300,y:400},
 {x:260,y:360},
 {x:220,y:360},
 {x:180,y:360},
 {x:140,y:360},
 {x:100,y:360},
 {x:60,y:360},
 {x:60,y:320},
 {x:60,y:280},
 {x:100,y:280},
 {x:140,y:280},
 {x:180,y:280},
 {x:220,y:280},
 {x:260,y:280},
 {x:300,y:240},
 {x:300,y:200},
 {x:300,y:160},
 {x:300,y:120},
 {x:300,y:80},
 {x:340,y:80},
 {x:380,y:80},
 {x:420,y:80},
 {x:460,y:80},
 {x:500,y:80},
 {x:540,y:80},
 {x:540,y:120},
 {x:540,y:160},
 {x:540,y:200},
 {x:500,y:240},
 {x:460,y:280},
 {x:420,y:280},
 {x:380,y:280},
 {x:340,y:280},
 {x:340,y:320},
 {x:340,y:360},
 {x:380,y:360},
 {x:420,y:360},
 {x:460,y:360},
 {x:500,y:360},
 {x:540,y:360},
 {x:540,y:400},
 {x:540,y:440},
 {x:540,y:480},
 {x:500,y:520},
 {x:460,y:560},
 {x:420,y:560},
 {x:380,y:560},
 {x:340,y:560}
];

// ---------- Leaderboard ----------

async function loadLeaderboard(){

  const clubs = [
    "HR",
    "Marketing",
    "Finance",
    "Operations"
  ];

  const ids = {
    HR: "tokenHR",
    Marketing: "tokenMarketing",
    Finance: "tokenFinance",
    Operations: "tokenOperations"
  };

  document.getElementById("teamScores").innerHTML = "";

  for (let club of clubs){

    const t = await getTeamData(club);

    const step = Math.max(1, t.currentCase - 1);

    const pos = PATH[Math.min(step - 1, PATH.length - 1)];

    // ===== SVG TOKEN MOVEMENT =====
    const token = document.getElementById(ids[club]);

    token.setAttribute("cx", pos.x);
    token.setAttribute("cy", pos.y);

    // ===== SCORE =====
    const score = t.score || 0;

    document.getElementById("teamScores").innerHTML += `
      <div class="team-score"
      style="background:${
        club==="HR" ? "#2563EB" :
        club==="Marketing" ? "#EC4899" :
        club==="Finance" ? "#16A34A" :
        "#EA580C"
      }">

        <b>${club}</b><br>

        Progress : ${step}<br>

        Score : ${score}<br>

        Staff Coin : ${step-1}<br>

        AI Coin : ${(step-1)*2}

      </div>
    `;

  }

}

// ---------- Realtime Refresh ----------

listenTeams(() => {

    if(document.getElementById("boardPage").classList.contains("active")){
        loadLeaderboard();
    }

    if(document.getElementById("teamPage").classList.contains("active") && currentClub){
        refreshCurrentTeam();
    }

});

listenSubmissions(() => {

    if(document.getElementById("adminPage").classList.contains("active")){
        loadAdmin();
    }

});
// ===== Make functions available to HTML =====
window.goHome = goHome;
window.openClub = openClub;
window.openAdmin = openAdmin;
window.openBoard = openBoard;

window.loginClub = loginClub;
window.adminLogin = adminLogin;

window.submitAnswer = submitAnswer;

window.viewAnswer = viewAnswer;
window.closeModal = closeModal;
window.approve = approve;
window.reject = reject;