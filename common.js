// common.js — include with <script src="common.js"></script> on every page
// Uses Firebase compat SDK (no import/export needed)

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBmd3BqGl8nlutKiY8MNVm8Cpc_UG_64fc",
  authDomain: "igc-sudama-sewa.firebaseapp.com",
  projectId: "igc-sudama-sewa",
  storageBucket: "igc-sudama-sewa.firebasestorage.app",
  messagingSenderId: "348826796176",
  appId: "1:348826796176:web:a7ae157cb0eb5fcf94d815"
};

// Init Firebase once
if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
const db   = firebase.firestore();

// ── Constants ──────────────────────────────────────────────────────────
const DEPARTMENTS_TEAMS = {
  "Accounts":   ["Accounts Team A","Accounts Team B"],
  "IT":         ["IT Team A","IT Team B","IT Team C"],
  "Operations": ["Ops Team A","Ops Team B","Ops Team C"],
  "Marketing":  ["Marketing Team A","Marketing Team B"],
  "HR":         ["HR Team A","HR Team B"],
  "Admin":      ["Admin Team A","Admin Team B"],
  "Finance":    ["Finance Team A","Finance Team B"],
  "Sales":      ["Sales Team A","Sales Team B","Sales Team C"],
  "Logistics":  ["Logistics Team A","Logistics Team B"],
  "Security":   ["Security Team A","Security Team B"]
};
const MONTHLY_TARGET = 5000;
const FY_MONTHS = [
  {label:"April",month:4},{label:"May",month:5},{label:"June",month:6},
  {label:"July",month:7},{label:"August",month:8},{label:"September",month:9},
  {label:"October",month:10},{label:"November",month:11},{label:"December",month:12},
  {label:"January",month:1},{label:"February",month:2},{label:"March",month:3}
];

// ── Helpers ────────────────────────────────────────────────────────────
function formatINR(n) {
  return "₹" + Number(n||0).toLocaleString("en-IN");
}
function achColor(pct) {
  if (pct >= 80) return "#22c55e";
  if (pct >= 50) return "#f59e0b";
  return "#ef4444";
}
function achBadge(pct) {
  if (pct >= 80) return '<span class="badge badge-success">✅ On Track</span>';
  if (pct >= 50) return '<span class="badge badge-warning">⚠️ Moderate</span>';
  return '<span class="badge badge-danger">🔴 Low</span>';
}
function fyFilter(donations, fy, month) {
  const fyYear = parseInt(fy.split("-")[0]);
  return donations.filter(d => {
    if (!d.date) return false;
    const dt = new Date(d.date), m = dt.getMonth()+1, y = dt.getFullYear();
    const inFY = (y===fyYear && m>=4)||(y===fyYear+1 && m<=3);
    if (!inFY) return false;
    if (!month || month==="all") return true;
    return m === parseInt(month);
  });
}
function buildDeptOptions(sel) {
  return '<option value="">Select Department</option>' +
    Object.keys(DEPARTMENTS_TEAMS).map(d=>
      `<option value="${d}"${d===sel?" selected":""}>${d}</option>`
    ).join("");
}
function buildTeamOptions(dept, sel) {
  const teams = DEPARTMENTS_TEAMS[dept]||[];
  return '<option value="">Select Team</option>' +
    teams.map(t=>`<option value="${t}"${t===sel?" selected":""}>${t}</option>`).join("");
}

// ── Toast ──────────────────────────────────────────────────────────────
function toast(msg, type) {
  type = type||"success";
  let c = document.getElementById("toast-container");
  if (!c) { c = document.createElement("div"); c.id="toast-container"; document.body.appendChild(c); }
  const el = document.createElement("div");
  el.className = "toast "+type;
  el.innerHTML = (type==="success"?"✅ ":"❌ ") + msg;
  c.appendChild(el);
  setTimeout(()=>el.remove(), 3500);
}

// ── Auth guard + sidebar init ──────────────────────────────────────────
function initPage(activeHref, callback) {
  auth.onAuthStateChanged(async function(user) {
    if (!user) { location.href = "index.html"; return; }
    // Get user role
    let role = "viewer", dept = null, team = null;
    try {
      const snap = await db.collection("users").doc(user.uid).get();
      if (snap.exists) { role = snap.data().role||"viewer"; dept=snap.data().department||null; team=snap.data().team||null; }
    } catch(e) {}
    const isAdmin = (role==="admin"||role==="superadmin");
    const name = user.displayName || user.email.split("@")[0];

    // Build sidebar
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.innerHTML = buildSidebar(activeHref, name, role);

    // Logout
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) logoutBtn.onclick = async function() {
      await auth.signOut(); location.href = "index.html";
    };

    // Mobile hamburger
    const ham = document.getElementById("hamburger");
    if (ham) ham.onclick = function() { sidebar && sidebar.classList.toggle("open"); };

    // Close sidebar on nav click (mobile)
    if (sidebar) sidebar.querySelectorAll("nav a").forEach(function(a) {
      a.onclick = function() { sidebar.classList.remove("open"); };
    });

    if (callback) callback({ user, role, isAdmin, dept, team });
  });
}

function buildSidebar(activeHref, name, role) {
  const links = [
    {href:"dashboard.html",  icon:"📊", label:"Dashboard"},
    {href:"donations.html",  icon:"💰", label:"Donations"},
    {href:"donors.html",     icon:"👥", label:"Donors"},
    {href:"departments.html",icon:"🏛️", label:"Departments"},
    {href:"reports.html",    icon:"📈", label:"Reports"},
    {href:"users.html",      icon:"🛡️", label:"User Management", adminOnly:true},
  ];
  const isAdmin = role==="admin"||role==="superadmin";
  const roleLabel = role==="superadmin"?"👑 Super Admin":role==="admin"?"🛡️ Admin":"👁️ Viewer";
  const roleCls   = role==="superadmin"?"badge-saffron":role==="admin"?"badge-gold":"badge-success";
  return `
    <div class="sidebar-logo">
      <div class="logo-icon">🪷</div>
      <div><div class="logo-text">IGC Sudama Sewa</div><div class="logo-sub">Donation Tracker</div></div>
    </div>
    <div class="sidebar-user">
      <div class="u-name">${name}</div>
      <div class="u-role"><span class="badge ${roleCls}">${roleLabel}</span></div>
    </div>
    <nav>
      ${links.filter(l=>!l.adminOnly||isAdmin).map(l=>
        `<a href="${l.href}" class="${l.href===activeHref?"active":""}">
          <span style="font-size:17px">${l.icon}</span> ${l.label}
        </a>`).join("")}
    </nav>
    <div class="sidebar-footer">
      <button class="btn btn-outline btn-block" id="logout-btn">🚪 Sign Out</button>
      <p class="text-center text-muted text-sm mt-2">🙏 Jai Shri Krishna</p>
    </div>`;
}
