


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




// Initialize TronLink

let tronWeb;
let trxPrice = 0;
let depositTimer;
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
  1: 0.0001,
  3: 0.000165,
  5: 0.000275,
  10: 0.00055,
  15: 0.00075,
  30: 0.00135
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

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";


const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

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
    await push(ref(db, "stakes"), stakeData);
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





