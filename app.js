// app.js — shared across all pages

// ─── Firebase Config ───────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, getDoc, setDoc }
  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile }
  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBmd3BqGl8nlutKiY8MNVm8Cpc_UG_64fc",
  authDomain: "igc-sudama-sewa.firebaseapp.com",
  projectId: "igc-sudama-sewa",
  storageBucket: "igc-sudama-sewa.firebasestorage.app",
  messagingSenderId: "348826796176",
  appId: "1:348826796176:web:a7ae157cb0eb5fcf94d815"
};

const app   = initializeApp(firebaseConfig);
const db    = getFirestore(app);
const auth  = getAuth(app);

export { db, auth, collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, where, getDoc, setDoc,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile };

// ─── Constants ─────────────────────────────────────────────────────
export const DEPARTMENTS_TEAMS = {
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

export const MONTHLY_TARGET = 5000;
export const CURRENT_FY     = "2025-26";

export const FY_MONTHS = [
  {label:"April",   month:4}, {label:"May",      month:5}, {label:"June",     month:6},
  {label:"July",    month:7}, {label:"August",   month:8}, {label:"September",month:9},
  {label:"October", month:10},{label:"November", month:11},{label:"December", month:12},
  {label:"January", month:1}, {label:"February", month:2}, {label:"March",    month:3}
];

export function formatINR(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}

export function achColor(pct) {
  if (pct >= 80) return "#22c55e";
  if (pct >= 50) return "#f59e0b";
  return "#ef4444";
}

export function achBadge(pct) {
  if (pct >= 80) return '<span class="badge badge-success">✅ On Track</span>';
  if (pct >= 50) return '<span class="badge badge-warning">⚠️ Moderate</span>';
  return '<span class="badge badge-danger">🔴 Low</span>';
}

export function fyFilter(donations, fy, month) {
  const fyYear = parseInt(fy.split("-")[0]);
  return donations.filter(d => {
    if (!d.date) return false;
    const dt = new Date(d.date);
    const m  = dt.getMonth() + 1;
    const y  = dt.getFullYear();
    const inFY = (y === fyYear && m >= 4) || (y === fyYear + 1 && m <= 3);
    if (!inFY) return false;
    if (!month || month === "all") return true;
    return m === parseInt(month);
  });
}

// ─── Toast ─────────────────────────────────────────────────────────
export function toast(msg, type = "success") {
  let cont = document.getElementById("toast-container");
  if (!cont) {
    cont = document.createElement("div");
    cont.id = "toast-container";
    document.body.appendChild(cont);
  }
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type === "success" ? "✅" : "❌"}</span> ${msg}`;
  cont.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ─── Auth guard ────────────────────────────────────────────────────
export async function requireAuth() {
  return new Promise(resolve => {
    onAuthStateChanged(auth, async user => {
      if (!user) { window.location.href = "index.html"; return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.exists() ? snap.data() : {};
      resolve({ user, role: data.role || "viewer", dept: data.department || null, team: data.team || null });
    });
  });
}

// ─── Sidebar builder ───────────────────────────────────────────────
export function buildSidebar(activePage, userName, userRole) {
  const links = [
    { href:"dashboard.html", icon:"📊", label:"Dashboard",       roles:["viewer","admin","superadmin"] },
    { href:"donations.html", icon:"💰", label:"Donations",       roles:["viewer","admin","superadmin"] },
    { href:"donors.html",    icon:"👥", label:"Donors",          roles:["viewer","admin","superadmin"] },
    { href:"departments.html",icon:"🏛️",label:"Departments",     roles:["viewer","admin","superadmin"] },
    { href:"reports.html",   icon:"📈", label:"Reports",         roles:["viewer","admin","superadmin"] },
    { href:"users.html",     icon:"🛡️", label:"User Management", roles:["admin","superadmin"] },
  ];

  const roleLabel = userRole === "superadmin" ? "👑 Super Admin"
                  : userRole === "admin"      ? "🛡️ Admin" : "👁️ Viewer";
  const roleBadgeClass = userRole === "superadmin" ? "badge-saffron"
                       : userRole === "admin"      ? "badge-gold" : "badge-success";

  return `
  <div class="sidebar-logo">
    <div class="logo-icon">🪷</div>
    <div>
      <div class="logo-text">IGC Sudama Sewa</div>
      <div class="logo-sub">Donation Tracker</div>
    </div>
  </div>
  <div class="sidebar-user">
    <div class="u-name">${userName || "User"}</div>
    <div class="u-role"><span class="badge ${roleBadgeClass}">${roleLabel}</span></div>
  </div>
  <nav>
    ${links
      .filter(l => l.roles.includes(userRole))
      .map(l => `
      <a href="${l.href}" class="${activePage === l.href ? 'active' : ''}">
        <span class="nav-icon">${l.icon}</span> ${l.label}
      </a>`).join("")}
  </nav>
  <div class="sidebar-footer">
    <button class="btn btn-outline btn-block" id="logout-btn">🚪 Sign Out</button>
    <p class="text-center text-muted text-sm mt-2">🙏 Jai Shri Krishna</p>
  </div>`;
}

export async function initSidebar(activePage) {
  const { user, role } = await requireAuth();
  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    sidebar.innerHTML = buildSidebar(activePage, user.displayName || user.email.split("@")[0], role);
    document.getElementById("logout-btn").addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "index.html";
    });
  }
  // Mobile hamburger
  const ham = document.getElementById("hamburger");
  if (ham) ham.addEventListener("click", () => sidebar.classList.toggle("open"));

  return { user, role, isAdmin: role === "admin" || role === "superadmin" };
}

// ─── Dept/Team select helpers ──────────────────────────────────────
export function buildDeptOptions(selectedDept = "") {
  return `<option value="">Select Department</option>` +
    Object.keys(DEPARTMENTS_TEAMS).map(d =>
      `<option value="${d}" ${d === selectedDept ? "selected" : ""}>${d}</option>`
    ).join("");
}

export function buildTeamOptions(dept, selectedTeam = "") {
  const teams = DEPARTMENTS_TEAMS[dept] || [];
  return `<option value="">Select Team</option>` +
    teams.map(t => `<option value="${t}" ${t === selectedTeam ? "selected" : ""}>${t}</option>`).join("");
}
