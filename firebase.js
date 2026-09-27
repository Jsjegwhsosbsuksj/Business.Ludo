/* ==========================================
   BUSINESS LUDO - FIREBASE.JS
========================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* ==========================================
   YOUR FIREBASE CONFIG
========================================== */

const firebaseConfig = {
  apiKey: "AIzaSyD3k-jQemFlioXbCpCIon-7bdRDJ_GTLsc",
  authDomain: "business-ludo-8493e.firebaseapp.com",
  databaseURL: "https://business-ludo-8493e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "business-ludo-8493e",
  storageBucket: "business-ludo-8493e.firebasestorage.app",
  messagingSenderId: "583772367923",
  appId: "1:583772367923:web:1bf513772ba8b7b4c10746"
};

/* ==========================================
   INITIALIZE FIREBASE
========================================== */

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* ==========================================
   DEFAULT TEAM DATA
========================================== */

const defaultTeam = {
  currentCase: 1,
  status: "available",
  answer: "",
  score: 0
};

/* ==========================================
   TEAM FUNCTIONS
========================================== */

window.getTeamData = async function(club){

  const snapshot = await get(ref(db, "teams/" + club));

  if(snapshot.exists()){
    return snapshot.val();
  }

  await set(ref(db, "teams/" + club), defaultTeam);

  return defaultTeam;
};

window.saveTeamData = async function(club, data){

  await set(ref(db, "teams/" + club), data);

};

/* ==========================================
   SUBMISSION FUNCTIONS
========================================== */

window.saveSubmission = async function(data){

  const id = `${data.club}_${data.caseId}`;

  await set(ref(db, "submissions/" + id), data);

};

window.getAllSubmissions = async function(){

  const snapshot = await get(ref(db, "submissions"));

  if(!snapshot.exists()) return [];

  return Object.values(snapshot.val());

};

window.updateSubmission = async function(club, caseId, status){

  const id = `${club}_${caseId}`;

  await update(ref(db, "submissions/" + id), {
    status: status
  });

};

/* ==========================================
   REALTIME LISTENERS
========================================== */

window.listenTeams = function(callback){

  onValue(ref(db, "teams"), (snapshot)=>{

    callback(snapshot.val() || {});

  });

};

window.listenSubmissions = function(callback){

  onValue(ref(db, "submissions"), (snapshot)=>{

    callback(snapshot.val() || {});

  });

};

/* ==========================================
   AUTO REFRESH
========================================== */

listenTeams(()=>{

  if(typeof loadLeaderboard === "function"){
    loadLeaderboard();
  }

});

listenSubmissions(()=>{

  if(typeof loadAdmin === "function"){
    loadAdmin();
  }

});