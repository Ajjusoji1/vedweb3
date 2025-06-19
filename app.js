// ✅ FINAL app.js CODE
// ✅ Firebase imports (module based)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getDatabase, ref, child, get
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";


// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAvyCHq4NDM4zh2IFhm-NczTNy_WJNxv7w",
  authDomain: "veddev-design.firebaseapp.com",
  databaseURL: "https://veddev-design-default-rtdb.firebaseio.com/",
  projectId: "veddev-design",
  storageBucket: "veddev-design.appspot.com",
  messagingSenderId: "1005840455508",
  appId: "1:1005840455508:web:944c6890fbf82167e55ac1",
  measurementId: "G-JVCYDNDW7L"
};


// ✅ Initialize
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Initialize TronLink

let tronWeb;
let trxPrice = 0;
let selectedWallet = ""; // wallet used in transaction

const ownerAddress = 'TMvfDAN4NNWhRCwbHZqj2LvQptHZQJE6gA'; // Replace with your address


const priceData = [
  { icon: "🔷", text: "TRX $0.2818" },
  { icon: "⚡", text: "Energy 100K = 10 TRX" },
  { icon: "📶", text: "Bandwidth 1000 = 1.56 TRX" },
  { icon: "🔥", text: "JustLend 5% APY" },
  { icon: "💼", text: "1M+ TRX staked today" },
  { icon: "💎", text: "TRX Gas Fees 99% lower than ETH" },
  { icon: "📈", text: "TRX Market Cap $10B+" },
  { icon: "🎯", text: "10,000+ daily rentals on-chain" },
  { icon: "🛡️", text: "Smart Contract Audited by XYZ" },
  { icon: "🚀", text: "VedWeb3 Live Now!" }
];

const ticker = document.getElementById("newsTicker");
priceData.forEach(item => {
  const span = document.createElement("span");
  span.innerText = `${item.icon} ${item.text}`;
  ticker.appendChild(span);
});

// menu toggle
document.addEventListener("click", function (event) {
  const sidebar = document.getElementById("sidebarMenu");
  const button = document.querySelector(".menu-toggle");
  if (!sidebar.contains(event.target) && !button.contains(event.target)) {
    sidebar.classList.remove("show");
  }
});

// referral link generation


function generateReferralLink() {
  const baseUrl = "https://vedweb3.com/referral?ref=";
  const walletAddress = window.tronWeb?.defaultAddress?.base58 || "unknown";
  return baseUrl + walletAddress;
}
// Display referral link
document.getElementById("referralLink").innerText = generateReferralLink();
// Copy referral link to clipboard
document.getElementById("copyReferral").addEventListener("click", () => {
  const link = generateReferralLink();
  navigator.clipboard.writeText(link).then(() => {
    alert("✅ Referral link copied to clipboard!");
  }).catch(err => {
    console.error("❌ Failed to copy referral link:", err);
  });
});
// Initialize TronLink if available
if (window.tronWeb && window.tronWeb.ready) {
  tronWeb = window.tronWeb;
  console.log("✅ TronLink detected:", tronWeb.defaultAddress.base58);
}
// If TronLink is not available, wait for it to load
if (!tronWeb) {
  console.warn("⏳ Waiting for TronLink...");
  const checkTronLink = setInterval(() => {
    if (window.tronWeb && window.tronWeb.ready) {
      tronWeb = window.tronWeb;
      clearInterval(checkTronLink);
      console.log("✅ TronLink connected:", tronWeb.defaultAddress.base58);
    }
  }, 2000);
}

async function loadReferralRewards(wallet) {
  const snapshot = await get(child(ref(db), "referrals/" + wallet));
  if (!snapshot.exists()) return;
  
  const data = snapshot.val();
  const total = data.total || 0;
  const claimed = data.claimed || 0;
  const pending = data.pending || 0;
  
  document.getElementById("totalReferral").textContent = total.toFixed(2);
  document.getElementById("claimedReferral").textContent = claimed.toFixed(2);
  document.getElementById("pendingReferral").textContent = pending.toFixed(2);
  
  const btn = document.getElementById("claimReferralBtn");
  btn.disabled = pending <= 0;
  
  btn.onclick = async () => {
  btn.textContent = "⏳ Claiming...";
  btn.disabled = true;
  try {
  const res = await fetch("https://us-central1-veddev-design.cloudfunctions.net/claimReferralReward", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ wallet })
  });
  const result = await res.json();
  if (result.success) {
  btn.textContent = "✅ Claimed";
  loadReferralRewards(wallet); // Reload updated values
  } else {
  btn.textContent = "❌ Failed";
  alert("Error: " + result.message);
  btn.disabled = false;
  }
  } catch (err) {
  console.error(err);
  btn.textContent = "❌ Error";
  btn.disabled = false;
  }
  };
  }
  
  window.addEventListener("load", async () => {
  const wallet = window.tronWeb?.defaultAddress?.base58;
  if (wallet) {
  loadReferralRewards(wallet);
  }
  });

// 🔍 Referral detection from URL
function getReferrerFromURL() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref && ref.startsWith("T")) {
    return ref;
  }
  return null;
}

// 📨 Stake submission handler
async function submitStake() {
  const amount = parseFloat(document.getElementById("stakeAmount").value);
  const days = parseInt(document.getElementById("stakeDays").value);
  const wallet = window.tronWeb.defaultAddress.base58;

  if (!wallet || !amount || !days) {
    alert("All fields required.");
    return;
  }

  const reward = amount * days * 0.001; // Change your reward logic as needed
  const createdAt = Date.now();
  const endsAt = createdAt + days * 24 * 60 * 60 * 1000;

  const stakeData = {
    wallet,
    amount,
    days,
    reward,
    createdAt,
    endsAt,
    claimed: false
  };

  // ✅ If referrer exists in URL, attach to stake
  const referrer = getReferrerFromURL();
  if (referrer && referrer !== wallet) {
    stakeData.referrer = referrer;
  }

  // Push to Firebase
  const stakeRef = push(ref(db, "stakes"));
  await set(stakeRef, stakeData);

  alert("✅ Stake submitted!");
}
// claim reward button
document.getElementById("claimRewardBtn").addEventListener("click", async () => {

  const wallet = window.tronWeb?.defaultAddress?.base58;
  if (!wallet) {
    alert("Please connect your wallet first.");
    return;
  }
  const stakeId = document.getElementById("stakeIdInput").value;
  if (!stakeId) {
    alert("Please enter a valid stake ID.");
    return;
  }
  const claimBtn = document.getElementById("claimRewardBtn");
  claimBtn.textContent = "⏳ Claiming...";
  claimBtn.disabled = true;
  try {
    const res = await fetch("https://us-central1-veddev-design.cloudfunctions.net/claimStakeReward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stakeId, wallet })
    });
    const result = await res.json();
    if (result.success) {
      claimBtn.textContent = "✅ Claimed";
      claimBtn.disabled = true;
      alert("🎉 Your reward has been claimed successfully!")
      } else {
                claimBtn.textContent = "❌ Failed";
                alert("Error: " + result.message);
                claimBtn.disabled = false;
      }
  } catch (err) {
    console.error("Claim error:", err);
    claimBtn.textContent = "❌ Error";
    claimBtn.disabled = false;
    alert("❌ Failed to claim reward. Please try again later.");
  }
});

// claim reward function
async function claimReward(stakeId) {
  if (!window.tronWeb || !window.tronWeb.defaultAddress.base58) {
    alert("Please connect your TronLink wallet first.");
    return;
  }
  const wallet = window.tronWeb.defaultAddress.base58;
  const claimBtn = document.getElementById("claimRewardBtn");
  claimBtn.textContent = "⏳ Claiming...";
  claimBtn.disabled = true;
  try {
    const res = await fetch("https://us-central1-veddev-design.cloudfunctions.net/claimStakeReward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stakeId, wallet })
    });
    const result = await res.json();
    if (result.success) {
      claimBtn.textContent = "✅ Claimed";
      claimBtn.disabled = true;
      alert("🎉 Your reward has been claimed successfully!")
        } else {          
              claimBtn.textContent = "❌ Failed";
              alert("Error: " + result.message);
              claimBtn.disabled = false;
        }
  } catch (err) {
    console.error("Claim error:", err);
    claimBtn.textContent = "❌ Error";
    claimBtn.disabled = false;
    alert("❌ Failed to claim reward. Please try again later.");
  }
}

// referral rewards on page load
async function loadReferralAnalytics() {
  const wallet = window.tronWeb?.defaultAddress?.base58;
  if (!wallet) return;

  const snapshot = await firebase.database().ref("referralRewards").orderByChild("to").equalTo(wallet).once("value");
  const data = snapshot.val() || {};

  let total = 0;
  let claimed = 0;
  let count = 0;

  Object.values(data).forEach(entry => {
    total += parseFloat(entry.reward || 0);
    if (entry.status === "claimed") claimed += parseFloat(entry.reward || 0);
    count++;
  });

  const pending = total - claimed;

  document.getElementById("referralTotal").innerText = `${total.toFixed(2)} TRX`;
  document.getElementById("referralClaimed").innerText = `${claimed.toFixed(2)} TRX`;
  document.getElementById("referralPending").innerText = `${pending.toFixed(2)} TRX`;
  document.getElementById("referralCount").innerText = count;
}

// TronLink connected પછી call કરો
window.addEventListener("load", () => {
  setTimeout(loadReferralAnalytics, 2000);
});

// Add Chart Loading Logic
async function loadReferralChart() {
  const wallet = window.tronWeb?.defaultAddress?.base58;
  if (!wallet) return;

  const snapshot = await firebase.database().ref("referralRewards").orderByChild("to").equalTo(wallet).once("value");
  const data = snapshot.val() || {};

  const rewardByWallet = {};

  Object.values(data).forEach(entry => {
    const from = entry.from || "Unknown";
    const reward = parseFloat(entry.reward || 0);
    if (!rewardByWallet[from]) rewardByWallet[from] = 0;
    rewardByWallet[from] += reward;
  });

  const labels = Object.keys(rewardByWallet);
  const values = Object.values(rewardByWallet);

  const ctx = document.getElementById("referralChart").getContext("2d");
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          "#00ffff", "#00ffaa", "#00aaff", "#ffaa00", "#ff44cc", "#ff9999", "#88ff99", "#ffaaee"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: "#fff" }
        }
      }
    }
  });
}
// Call chart loading after referral analytics
window.addEventListener("load", () => {
  setTimeout(() => {
    loadReferralAnalytics();
    loadReferralChart();
  }, 2000);
});









// approveWithdraw function
async function approveWithdraw(withdrawId) {
  const withdrawRef = ref(db, "withdraws/" + withdrawId);
update(withdrawRef, { status: "approved" })
.then(() => {
alert("✅ Withdraw approved");
})
.catch((err) => {
console.error("❌ Approval failed", err);
alert("❌ Approval failed");
});
}

// ✅ Withdraw Summary Loader for Admin Panel
async function loadWithdrawSummary() {
  const tableBody = document.querySelector("#withdrawTable tbody");
if (!tableBody) return;

const withdrawsRef = ref(db, "withdraws");
onValue(withdrawsRef, (snapshot) => {
tableBody.innerHTML = "";
snapshot.forEach((childSnapshot) => {
  const data = childSnapshot.val();
  const withdrawId = childSnapshot.key;

  const formattedDate = data.date
    ? new Date(data.date).toLocaleDateString()
    : "N/A";

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${data.wallet || "—"}</td>
    <td>${data.amount || 0} TRX</td>
    <td>${formattedDate}</td>
    <td>${data.status || "pending"}</td>
    <td>
      ${
        data.status === "pending"
          ? `<button onclick="approveWithdraw('${withdrawId}')">Approve</button>`
          : "✅"
      }
    </td>
  `;
  tableBody.appendChild(row);
});

}, { onlyOnce: true });
}

// Call function on page load
window.addEventListener("load", () => {
  loadWithdrawSummary();
  });


  // 🧠 Load pending referral rewards
async function loadPendingReferralRewards() {
  const table = document.getElementById("pendingReferralBody");
  table.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;
  const snapshot = await get(ref(db, "referralRewards"));
  const rewards = snapshot.exists() ? snapshot.val() : {};
  const rows = Object.entries(rewards)
    .filter(([id, data]) => data.status === "pending")
    .map(([id, data]) => {
      return `
        <tr>
          <td>${data.from}</td>
          <td>${data.to}</td>
          <td>${data.stakeAmount}</td>
          <td>${data.rewardAmount}</td>
          <td>
            <button onclick="approveReferralReward('${id}')">✅ Approve</button>
          </td>
        </tr>
      `;
    });
  table.innerHTML = rows.length ? rows.join("") : `<tr><td colspan="5">No pending rewards</td></tr>`;
}

// ✅ Approve referral reward
async function approveReferralReward(rewardId) {
  const rewardRef = ref(db, `referralRewards/${rewardId}`);
  await update(rewardRef, { status: "approved" });
  alert("✅ Reward Approved!");
  loadPendingReferralRewards();
}

// 🔃 Load on page load
window.addEventListener("DOMContentLoaded", () => {
  loadPendingReferralRewards();
});









// Add Stake Growth Chart Loading Logic
async function loadStakeGrowthChart() {
  const wallet = window.tronWeb?.defaultAddress?.base58;
  if (!wallet) return;

  const snapshot = await firebase.database().ref("stakes").orderByChild("wallet").equalTo(wallet).once("value");
  const data = snapshot.val() || {};

  const stakeDates = [];
  const stakeAmounts = [];

  Object.values(data).forEach(entry => {
    const date = entry.createdAt || "Unknown";
    const amount = parseFloat(entry.amount || 0);

    const formattedDate = new Date(date).toLocaleDateString("en-GB"); // dd/mm/yyyy
    stakeDates.push(formattedDate);
    stakeAmounts.push(amount);
  });

  const ctx = document.getElementById("stakeGrowthChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: stakeDates,
      datasets: [{
        label: "Staked TRX",
        data: stakeAmounts,
        borderColor: "#00ffff",
        backgroundColor: "rgba(0,255,255,0.2)",
        tension: 0.3,
        pointBackgroundColor: "#fff",
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: "#fff" }
        }
      },
      scales: {
        x: {
          ticks: { color: "#fff" }
        },
        y: {
          ticks: { color: "#fff" }
        }
      }
    }
  });
}
// Call stake growth chart loading after referral analytics
window.addEventListener("load", () => {
  setTimeout(() => {
    loadUserSummary();  // already exists
    loadStakeGrowthChart(); // 🔥 new
  }, 2000);
});

function filterReferralRewards() {
  const selected = document.getElementById("referralStatusFilter").value;
  loadReferralRewardHistory(selected); // filter value pass કરો
}

// Add event listener to filter dropdown
async function loadReferralRewardHistory(statusFilter = "all") {
  const wallet = window.tronWeb?.defaultAddress?.base58;
  if (!wallet) return;

  const snapshot = await firebase.database().ref("referralRewards").orderByChild("to").equalTo(wallet).once("value");
  const referrals = snapshot.val() || {};

  const table = document.getElementById("referralRewardsTable");
  table.innerHTML = ""; // જૂના rows clear

  Object.values(referrals).forEach(entry => {
    const status = entry.claimed ? "claimed" : "pending";

    if (statusFilter !== "all" && statusFilter !== status) return;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.from}</td>
      <td>${entry.amount}</td>
      <td>${entry.reward}</td>
      <td>${entry.date || "-"}</td>
      <td>${entry.claimed ? "✅ Claimed" : "⏳ Pending"}</td>
    `;
    table.appendChild(row);
  });
}

// load leader board 
function loadLeaderboard() {
  const leaderboardTable = document.getElementById("leaderboardTable").querySelector("tbody");
  leaderboardTable.innerHTML = "<tr><td colspan='4'>⏳ Loading...</td></tr>";
  
  firebase.database().ref("stakes").once("value").then(snapshot => {
  const stakeMap = {};
    snapshot.forEach(childSnapshot => {
      const stake = childSnapshot.val();
      if (!stake || !stake.wallet) return;
      if (!stakeMap[stake.wallet]) {
        stakeMap[stake.wallet] = { totalStaked: 0, count: 0 };
      }
      stakeMap[stake.wallet].totalStaked += parseFloat(stake.amount || 0);
      stakeMap[stake.wallet].count++;
    });
  const leaderboardData = Object.entries(stakeMap).map(([wallet, data]) => ({

    wallet,
      totalStaked: data.totalStaked,
      count: data.count
    })).sort((a, b) => b.totalStaked - a.totalStaked).slice(0, 10);
    leaderboardTable.innerHTML = ""; // Clear previous data
    leaderboardData.forEach((entry, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${entry.wallet}</td>
        <td>${entry.totalStaked.toFixed(2)} TRX</td>
        <td>${entry.count} Stakes</td>
      `;
      leaderboardTable.appendChild(row);
    });
  }).catch(error => {
    console.error("❌ Error loading leaderboard:", error);
    leaderboardTable.innerHTML = "<tr><td colspan='4'>❌ Error loading data</td></tr>";
  });
}
// Call leaderboard loading on page load
window.addEventListener("load", () => {
  setTimeout(() => {
    loadLeaderboard(); // 🔥 new
    if (window.tronWeb && window.tronWeb.ready) {
      const wallet = window.tronWeb.defaultAddress.base58;
      loadUserSummary(wallet); // 🔥 new
      loadReferralRewards(wallet); // 🔥 new
    }
  }, 2000);
});






// Wait for TronLink to be ready
window.addEventListener("load", async () => {
  if (window.tronWeb && window.tronWeb.defaultAddress.base58) {
    tronWeb = window.tronWeb;
    console.log("✅ TronLink connected:", tronWeb.defaultAddress.base58);
  } else {
    console.warn("⏳ Waiting for TronLink...");
  }
});



// Connect Wallet Button
document.getElementById("connectWallet").addEventListener("click", async () => {
  if (window.tronWeb && window.tronWeb.ready) {
    tronWeb = window.tronWeb;
    alert("Wallet Connected: " + tronWeb.defaultAddress.base58);
  } else {
    alert("Please install or unlock TronLink wallet!");
  }
});

document.getElementById("connectWallet").addEventListener("click", async () => {
  if (window.tronWeb && window.tronWeb.ready) {
    const address = window.tronWeb.defaultAddress.base58;
    document.getElementById("walletStatus").innerText = "Connected: " + address;
  } else {
    alert("Please install or open TronLink or compatible wallet");
  }
});

window.addEventListener("load", () => {
  if (window.tronWeb && window.tronWeb.ready) {
    document.getElementById("walletStatus").innerText = "Wallet detected";
  }
});


// 🔄 On load: detect TronLink
document.getElementById("connectWallet").addEventListener("click", () => {
  if (window.tronWeb && window.tronWeb.ready) {
    tronWeb = window.tronWeb;
    alert("Wallet connected: " + tronWeb.defaultAddress.base58);
  } else {
    alert("Please install or unlock TronLink wallet!");
  }
});

window.addEventListener("load", () => {
  const savedWallets = JSON.parse(localStorage.getItem("vedWallets") || "[]");
  const select = document.getElementById("walletSelect");

  savedWallets.forEach(addr => {
    const opt = document.createElement("option");
    opt.value = addr;
    opt.text = addr;
    select.appendChild(opt);
  });

  select.addEventListener("change", () => {
    const selected = select.value;
    if (selected === "auto") {
      selectedWallet = tronWeb.defaultAddress.base58;
    } else {
      selectedWallet = selected;
    }
    console.log("✅ Selected wallet:", selectedWallet);
  });
});



// Price Tables
const bandwidthPrices = {
  1: 0.00104, 3: 0.00273, 5: 0.00455, 10: 0.00910, 15: 0.01365, 30: 0.02730
};

const energyPrices = {
  1: 0.00010,
  3: 0.000225,
  5: 0.000405,
  10: 0.00075,
  15: 0.00140,
  30: 0.00225
}

async function checkMyEnergy() {
  const contract = await tronWeb.contract().at(ownerAddress);
  const result = await contract.getEnergyBalance(tronWeb.defaultAddress.base58).call();
  alert(`⚡ Smart Contract Energy: ${result} units`);
}


// 📶 Bandwidth Calculator
document.getElementById("bandwidthAmount").addEventListener("input", updateBandwidthPrice);
document.getElementById("bandwidthDays").addEventListener("change", updateBandwidthPrice);

function updateBandwidthPrice() {
  const amount = parseFloat(document.getElementById("bandwidthAmount").value);
  const days = document.getElementById("bandwidthDays").value;
  const rate = pricing.bandwidth[days];

  if (!isNaN(amount) && rate) {
    const total = amount * rate;
    latestBandwidthTRX = total;
    document.getElementById("bandwidthPriceDisplay").innerText = `💰 Total TRX: ${total.toFixed(3)} TRX`;
  } else {
    latestBandwidthTRX = 0;
    document.getElementById("bandwidthPriceDisplay").innerText = "";
  }
}

// ⚡ Energy Calculator
document.getElementById("energyAmount").addEventListener("input", updateEnergyPrice);
document.getElementById("energyDays").addEventListener("change", updateEnergyPrice);

function updateEnergyPrice() {
  const amount = parseFloat(document.getElementById("energyAmount").value);
  const days = document.getElementById("energyDays").value;
  const rate = pricing.energy[days];

  if (!isNaN(amount) && rate) {
    const total = amount * rate;
    latestEnergyTRX = total;
    document.getElementById("energyPriceDisplay").innerText = `💰 Total TRX: ${total.toFixed(3)} TRX`;
  } else {
    latestEnergyTRX = 0;
    document.getElementById("energyPriceDisplay").innerText = "";
  }
}

// ⚡ Buy Energy (સુધારેલું ફંક્શન)

let latestEnergyTRX = 10;
let latestBandwidthTRX = 5;

document.getElementById("buyEnergy").addEventListener("click", async () => {
  const amount = parseInt(document.getElementById("energyAmount").value);
  const days = parseInt(document.getElementById("energyDays").value);
  const wallet = window.tronWeb?.defaultAddress?.base58 || "unknown";

  const sale = {
    saleType: "energy",
    wallet,
    amount,
    days,
    trxPaid: latestEnergyTRX,
    status: "pending",
    createdAt: Date.now()
  };

  try {
    await push(ref(db, "pendingSales"), sale);
    alert("✅ Energy purchase saved");
  } catch (e) {
    alert("❌ Error: " + e.message);
  }
});





// 📶 Buy Bandwidth (સુધારેલું ફંક્શન)
document.getElementById("buyBandwidth").addEventListener("click", async () => {
  const amount = parseInt(document.getElementById("bandwidthAmount").value);
  const days = parseInt(document.getElementById("bandwidthDays").value);
  const wallet = window.tronWeb?.defaultAddress?.base58 || "unknown";

  const sale = {
    saleType: "bandwidth",
    wallet,
    amount,
    days,
    trxPaid: latestBandwidthTRX,
    status: "pending",
    createdAt: Date.now()
  };

  try {
    await push(ref(db, "pendingSales"), sale);
    alert("✅ Bandwidth purchase saved");
  } catch (e) {
    alert("❌ Error: " + e.message);
  }
});



 
// other wallet section



const pricing = {
  energy: { 1: 0.0001, 3: 0.000165, 5: 0.000275, 10: 0.00055, 15: 0.00075, 30: 0.00135 },
  bandwidth: { 1: 0.00156, 3: 0.004095, 5: 0.006825, 10: 0.01365, 15: 0.020475, 30: 0.04095 },
  staking: { 1: 0.1, 3: 0.25, 5: 0.35, 10: 0.6, 15: 0.8, 30: 1.2 }
};

const typeSel = document.getElementById("typeSelect");
const amtInp = document.getElementById("amountInput");
const daySel = document.getElementById("daysSelect");
const targetInp = document.getElementById("targetWallet");
const totalOut = document.getElementById("totalTRX");
const btn = document.getElementById("confirmBtn");

function updateTRX() {
  const type = typeSel.value;
  const amt = parseFloat(amtInp.value);
  const day = parseInt(daySel.value);
  if (!isNaN(amt) && pricing[type][day]) {
    const total = amt * pricing[type][day];
    totalOut.textContent = `TRX: ${total.toFixed(3)}`;
    return total;
  }
  totalOut.textContent = "TRX: -";
  return null;
}

amtInp.addEventListener("input", updateTRX);
daySel.addEventListener("change", updateTRX);
typeSel.addEventListener("change", updateTRX);

btn.addEventListener("click", async () => {
  const type = typeSel.value;
  const amt = parseFloat(amtInp.value);
  const day = parseInt(daySel.value);
  const wallet = targetInp.value.trim();

  if (!window.tronWeb || !window.tronWeb.defaultAddress.base58) {
    return alert("Connect TronLink first.");
  }
  if (!wallet || wallet.length !== 34 || !wallet.startsWith("T")) {
    return alert("Invalid wallet address.");
  }
  if (isNaN(amt) || amt <= 0) {
    return alert("Enter valid amount.");
  }

  const rate = pricing[type][day];
  if (!rate) return alert("Invalid day selected.");
  const total = amt * rate;

  const saleData = {
    saleType: type,
    wallet,
    amount: amt,
    days: day,
    trxPaid: total,
    status: "pending",
    createdAt: Date.now()
  };

  try {
    await push(ref(db, "pendingSales"), saleData);
    alert("✅ Request submitted!");
  } catch (e) {
    console.error("Firebase error:", e);
    alert("❌ Failed to submit.");
  }
});



// ⚙️ CONFIG
const STAKE_REWARD_PERCENT = 6; // Company sets 5–8%
const MIN_STAKE_DAYS = 30;

// 📦 STAKE NOW
document.getElementById("stakeNow").addEventListener("click", async () => {
  const amount = parseFloat(document.getElementById("stakeAmount").value);
  const days = parseInt(document.getElementById("stakeDays").value);
  const wallet = window.tronWeb?.defaultAddress?.base58 || "";

  if (!wallet || isNaN(amount) || amount <= 0 || isNaN(days) || days < MIN_STAKE_DAYS) {
    return alert("⚠️ Enter valid amount and minimum 30 days");
  }

  const reward = amount + (amount * STAKE_REWARD_PERCENT / 100);
  const createdAt = Date.now();
  const endsAt = createdAt + days * 24 * 60 * 60 * 1000;

  const stakeData = {
    wallet,
    amount,
    days,
    reward: parseFloat(reward.toFixed(2)),
    createdAt,
    endsAt,
    claimed: false
  };

   try {
    if (existingKey) {
      // ✅ Already exists — override only if not manually modified
      const existing = stakes[existingKey];
      if (!existing.endsAt || existing.endsAt === existing.createdAt + existing.days * 24 * 60 * 60 * 1000) {
        await set(ref(db, `stakes/${existingKey}`), stakeData);
      } else {
        alert("⚠️ Existing stake found. Manual modification detected. Skipping override.");
        return;
      }
    } else {
      await push(stakeRef, stakeData);
    }

    document.getElementById("rewardDisplay").textContent = `✅ Staked! Will get ${reward.toFixed(2)} TRX`;
    startCountdown(endsAt);
  } catch (e) {
    alert("❌ Firebase error: " + e.message);
  }
});

// 🎁 LIVE REWARD PREVIEW
document.getElementById("stakeAmount").addEventListener("input", () => {
  const amt = parseFloat(document.getElementById("stakeAmount").value);
  const reward = amt + (amt * STAKE_REWARD_PERCENT / 100);
  if (!isNaN(reward)) {
    document.getElementById("rewardDisplay").textContent = `🎁 Estimated Reward: ${reward.toFixed(2)} TRX`;
  } else {
    document.getElementById("rewardDisplay").textContent = "🎁 Estimated Reward: -";
  }
});

// ⏳ COUNTDOWN TIMER
function startCountdown(endTime) {
  const display = document.getElementById("stakeCountdown");
  const claimBtn = document.getElementById("claimRewardBtn");

  const interval = setInterval(() => {
    const now = Date.now();
    const diff = endTime - now;

    if (diff <= 0) {
      clearInterval(interval);
      display.textContent = "✅ Staking complete!";
      claimBtn.style.display = "block";
    } else {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      display.textContent = `⏳ Time left: ${days}d ${hours}h ${mins}m`;
    }
  }, 1000);
}

// 🎉 CLAIM REWARD (UI only – backend will handle real transfer)
document.getElementById("claimRewardBtn").addEventListener("click", () => {
  alert("🎉 Your reward will be distributed by backend after maturity.");
});






// 🚀 Load Stakes and Render Table (used in history.html)
window.loadStakeTable = async function () {
  const tableBody = document.getElementById("stakeTableBody");
  tableBody.innerHTML = "<tr><td colspan='7'>Loading...</td></tr>";

  const snapshot = await get(child(ref(db), "stakes"));
  tableBody.innerHTML = "";
  if (!snapshot.exists()) {
    tableBody.innerHTML = "<tr><td colspan='7'>No data</td></tr>";
    return;
  }

  const data = snapshot.val();
  const allStakes = Object.entries(data).map(([id, stake]) => ({ ...stake, id }));

  for (const stake of allStakes) {
    const isClaimable = !stake.claimed && Date.now() >= stake.endsAt;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${stake.wallet}</td>
      <td>${stake.amount}</td>
      <td>${stake.days}</td>
      <td>${stake.reward}</td>
      <td>${new Date(stake.createdAt).toLocaleDateString()}</td>
      <td>${new Date(stake.endsAt).toLocaleDateString()}</td>
      <td>
        ${stake.claimed
          ? "✅ Claimed"
          : isClaimable
          ? `<button class="claimBtn" data-id="${stake.id}">Claim</button>`
          : "⏳ Not Ready"}
      </td>
    `;
    tableBody.appendChild(tr);
  }

  document.querySelectorAll(".claimBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const stakeId = btn.dataset.id;
      btn.textContent = "⏳ Claiming...";
      btn.disabled = true;

      try {
        const res = await fetch("https://us-central1-veddev-design.cloudfunctions.net/claimStakeReward", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stakeId })
        });
        const result = await res.json();
        if (result.success) {
          btn.textContent = "✅ Claimed";
          loadStakeTable();
        } else {
          btn.textContent = "❌ Error";
          alert(result.message);
        }
      } catch (e) {
        btn.textContent = "❌ Error";
        alert("Network error");
      }
    });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("stakeTableBody")) {
    loadStakeTable();
  }
});


// 🔄 Load Summary Stats
async function loadUserSummary(wallet) {
  const db = getDatabase();
  const snapshot = await get(child(ref(db), "stakes"));

  if (!snapshot.exists()) return;

  let totalStaked = 0;
  let totalRewards = 0;
  let count = 0;
  let claimed = 0;
  let active = 0;

  snapshot.forEach(childSnap => {
    const stake = childSnap.val();
    if (stake.wallet === wallet) {
      count++;
      totalStaked += parseFloat(stake.amount);
      totalRewards += parseFloat(stake.reward);
      if (stake.claimed) claimed++;
      if (!stake.claimed && stake.endsAt > Date.now()) active++;
    }
  });

  document.getElementById("summaryWallet").textContent = wallet;
  document.getElementById("summaryTotalStaked").textContent = totalStaked.toFixed(2);
  document.getElementById("summaryTotalRewards").textContent = totalRewards.toFixed(2);
  document.getElementById("summaryCount").textContent = count;
  document.getElementById("summaryClaimed").textContent = claimed;
  document.getElementById("summaryActive").textContent = active;
}

// TronLink Wallet Loaded પછી Call કરો
window.addEventListener("load", async () => {
  if (window.tronWeb && window.tronWeb.defaultAddress.base58) {
    const wallet = window.tronWeb.defaultAddress.base58;
    await loadUserSummary(wallet);
  } else {
    const checkWallet = setInterval(() => {
      if (window.tronWeb && window.tronWeb.defaultAddress.base58) {
        clearInterval(checkWallet);
        const wallet = window.tronWeb.defaultAddress.base58;
        loadUserSummary(wallet);
      }
    }, 500);
  }
});














// Check Bandwidth


document.getElementById("checkBandwidth").addEventListener("click", async () => {
  if (!window.tronWeb || !window.tronWeb.ready) {
    alert("Please connect TronLink first.");
    return;
  }

  try {
    const balance = await tronWeb.trx.getBandwidth(tronWeb.defaultAddress.base58);
    document.getElementById("balanceDisplay").textContent = `📶Your Bandwidth Balance: ${balance} points`;
  } catch (err) {
    console.error("Bandwidth Check Error:", err);
    alert("❌Failed to fetch bandwidth.");
  }
});

// Energy Balance Check


document.getElementById("checkEnergy").addEventListener("click", async () => {
    if (!window.tronWeb || !window.tronWeb.ready) {
        alert("Please connect TronLink first.");
        return;
      }
  try {
    const address = tronWeb.defaultAddress.base58;
    const energy = await tronWeb.trx.getAccountResources(address);
    const energyBalance = energy.EnergyRemaining || 0;
    document.getElementById("energyDisplay").innerText = `⚡Your Energy Balance: ${energyBalance} units`;
  } catch (err) {
    console.error("Energy Check Error:", err);
    alert("❌Failed to fetch energy balance.");
  }
});



  
// Wait for TronLink to be available
function waitForTronLink(callback, retryInterval = 1000, maxRetries = 10) {
    let attempts = 0;
    const checkTronLink = () => {
      if (window.tronWeb && window.tronWeb.defaultAddress.base58) {
        callback();
      } else if (attempts++ < maxRetries) {
        setTimeout(checkTronLink, retryInterval);
      } else {
        console.warn("TronLink not found after retries.");
      }
    };
    checkTronLink();
  }
  

  
  // Example Usage
  waitForTronLink(() => {
    console.log("TronLink is connected:", window.tronWeb.defaultAddress.base58);
  });
  

// Fetch TRX Price
async function fetchTRXPrice() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd');
    const data = await res.json();
    trxPrice = data.tron.usd;
    document.getElementById('trxPriceCard').innerText = `📈 TRX Price: $${trxPrice}`;
  } catch (err) {
    document.getElementById('trxPriceCard').innerText = '❌ Failed to load TRX Price';
  }
}




// Run on Start
fetchTRXPrice();

// Update TRX Price every 1 minutes
setInterval(fetchTRXPrice, 1 * 60 * 1000);



// 📶 Auto detect TronLink every 2 sec
function detectTronLink(retry = 10) {
  if (window.tronWeb && window.tronWeb.ready) {
    tronWeb = window.tronWeb;
    console.log("✅ TronLink detected:", tronWeb.defaultAddress.base58);
    document.getElementById("connectWallet").innerText = "Connected: " + tronWeb.defaultAddress.base58;
  } else if (retry > 0) {
    console.log("⏳ Waiting for TronLink...");
    setTimeout(() => detectTronLink(retry - 1), 2000);
  } else {
    alert("❌ TronLink not found. Please install and login.");
  }
}

// 💸 Convert TRX to Sun
function trxToSun(trx) {
  return tronWeb.toSun(trx);
}

// 📦 Get price based on type, amount and days
function calculatePrice(type, days) {
  const priceTable = type === "bandwidth" ? bandwidthPrices : energyPrices;
  return priceTable[days] || 0;
}

// 🚀 Send transaction
async function sendTransaction(contractAddress, functionName, params, valueTrx) {
  const valueSun = trxToSun(valueTrx);
  const contract = await tronWeb.contract().at(contractAddress);
  const result = await contract[functionName](...params).send({
    callValue: valueSun,
    feeLimit: 500_000_000
  });
  return result;
}

// 📦 Auto price display on input
function updatePrice(type, amountInput, daysSelect, priceDisplay) {
  const days = parseInt(document.getElementById(daysSelect).value);
  const pricePerUnit = calculatePrice(type, days);
  const totalPrice = pricePerUnit * parseFloat(document.getElementById(amountInput).value || 0);
  document.getElementById(priceDisplay).innerText = `Price: ${totalPrice.toFixed(3)} TRX`;
}

// 👆 Similarly for Energy Button...

// 📶 On page load
detectTronLink();



//admin
// Admin functionality 

// FILTERING LOGIC
const statusFilter = document.getElementById("filterStatus").value;
const minAmount = parseFloat(document.getElementById("minAmount").value) || 0;

const filteredStakes = stakes.filter(stake => {
  const isCompleted = stake.endsAt && Date.now() > stake.endsAt;
  const isActive = !isCompleted;
  const matchStatus =
    statusFilter === "all" ||
    (statusFilter === "active" && isActive) ||
    (statusFilter === "completed" && isCompleted);
  return matchStatus && stake.amount >= minAmount;
});

for (const stake of filteredStakes) {
  document.getElementById("applyFilters").addEventListener("click", () => {
    if (window.tronWeb?.defaultAddress?.base58) {
      renderStakes(window.tronWeb.defaultAddress.base58);
    }
  });
}

function renderStakes(walletAddress) {
  const list = document.getElementById("stakeList");
  list.innerHTML = "⏳ Loading...";
  get(child(ref(db), "stakes")).then(snapshot => {
    const allStakes = [];
    snapshot.forEach(childSnap => {
      const data = childSnap.val();
      if (data.wallet === walletAddress) {
        allStakes.push(data);
      }
    });

    // 👇 Apply filters
    const statusFilter = document.getElementById("filterStatus").value;
    const minAmount = parseFloat(document.getElementById("minAmount").value) || 0;

    const filteredStakes = allStakes.filter(stake => {
      const isCompleted = stake.endsAt && Date.now() > stake.endsAt;
      const isActive = !isCompleted;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "completed" && isCompleted);
      return matchStatus && stake.amount >= minAmount;
    });

    // 👇 Render table
    list.innerHTML = "";
    if (filteredStakes.length === 0) {
      list.innerHTML = "❌ No matching records found.";
      return;
    }

    const table = document.createElement("table");
    table.innerHTML = `
      <tr>
        <th>Amount</th>
        <th>Reward</th>
        <th>Duration</th>
        <th>Ends In</th>
        <th>Status</th>
      </tr>
    `;
    for (const stake of filteredStakes) {
      const endsIn = stake.endsAt - Date.now();
      const days = Math.max(0, Math.floor(endsIn / (1000 * 60 * 60 * 24)));
      const status = stake.claimed
        ? "✅ Claimed"
        : endsIn <= 0
        ? "🟢 Completed"
        : "⏳ Active";

      table.innerHTML += `
        <tr>
          <td>${stake.amount}</td>
          <td>${stake.reward}</td>
          <td>${stake.days}</td>
          <td>${days} days</td>
          <td>${status}</td>
        </tr>
      `;
    }

    list.appendChild(table);
  });
}
document.getElementById("applyFilters").addEventListener("click", () => {
  const wallet = window.tronWeb?.defaultAddress?.base58;
  if (wallet) {
    renderStakes(wallet);
  } else {
    alert("Connect TronLink first.");
  }
});
window.addEventListener("load", () => {
  const wallet = window.tronWeb?.defaultAddress?.base58;
  if (wallet) {
    renderStakes(wallet);
  }
});

// ✅ Stake Reward Claim Handler (Inside history.html page)

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("stakeTableBody");

  // 🧠 Load stakes
  const snapshot = await get(child(ref(db), "stakes"));
  if (snapshot.exists()) {
    const data = snapshot.val();
    const entries = Object.entries(data);
    entries.forEach(([id, stake]) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${stake.wallet}</td>
        <td>${stake.amount}</td>
        <td>${stake.days}</td>
        <td>${stake.reward}</td>
        <td>${new Date(stake.createdAt).toLocaleDateString()}</td>
        <td>${new Date(stake.endsAt).toLocaleDateString()}</td>
       <td>
  ${
    stake.claimed
      ? "✅ Claimed"
      : Date.now() > stake.endsAt
        ? `<button class="claimBtn" data-id="${id}">Claim</button>`
        : "⏳ Not Ready"
  }
</td>


      `;
      tableBody.appendChild(tr);
    });

    // 🧩 Claim button logic
    document.querySelectorAll(".claimBtn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const stakeId = btn.getAttribute("data-id");
        btn.textContent = "⏳ Claiming...";
        btn.disabled = true;

        try {
          const res = await fetch(
            "https://us-central1-veddev-design.cloudfunctions.net/claimStakeReward",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ stakeId }) // make sure stakeId is sent!
            }
          );
          const result = await res.json();
        
          if (result.success) {
            btn.textContent = "✅ Claimed";
          } else {
            btn.textContent = "❌ Failed";
            btn.disabled = false;
            alert("Error: " + result.message);
          }
        } catch (e) {
          btn.textContent = "❌ Error";
          btn.disabled = false;
          alert("Error: " + e.message);
        }
        
      });
    });
  } else {
    tableBody.innerHTML = "<tr><td colspan='7'>No staking history</td></tr>";
  }
});
