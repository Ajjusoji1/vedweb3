
let tronWeb;
let trxPrice = 0;
let latestEnergyTRX = 0;
let latestBandwidthTRX = 0;
let depositTimer;
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
    console.log("TronLink initiated");
  } else {
    console.warn("Waiting for TronLink...");
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

// 🔄 On load: detect TronLink
window.addEventListener("load", () => {
  if (window.tronWeb && window.tronWeb.defaultAddress.base58) {
    tronWeb = window.tronWeb;
    console.log("TronLink connected:", tronWeb.defaultAddress.base58);
  } else {
    console.warn("Waiting for TronLink...");
  }
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

// ⚡ Buy Energy
document.getElementById("buyEnergy").addEventListener("click", async () => {
  const amount = parseFloat(document.getElementById("energyAmount").value);
  const days = document.getElementById("energyDays").value;

  if (!window.tronWeb || !tronWeb.defaultAddress.base58) {
    alert("❗ Please connect TronLink wallet.");
    return;
  }

  if (isNaN(amount) || amount < 50000) {
    alert("❗ Minimum 50,000 energy required.");
    return;
  }

  const totalSun = tronWeb.toSun(latestEnergyTRX);

  try {
    const contract = await tronWeb.contract().at(ownerAddress);
await contract.buyEnergy(amount, days).send({ callValue: totalSun });

    alert(`✅ Energy purchase: ${amount} for ${days} day(s)`);
  } catch (err) {
    console.error(err);
    alert("❌ Energy transaction failed!");
  }
});

// 📶 Buy Bandwidth
document.getElementById("buyBandwidth").addEventListener("click", async () => {
  const amount = parseFloat(document.getElementById("bandwidthAmount").value);
  const days = document.getElementById("bandwidthDays").value;

  if (!window.tronWeb || !tronWeb.defaultAddress.base58) {
    alert("❗ Please connect TronLink wallet.");
    return;
  }

  if (isNaN(amount) || amount < 1000) {
    alert("❗ Minimum 1000 bandwidth required.");
    return;
  }

  const totalSun = tronWeb.toSun(latestBandwidthTRX);

  try {
    await contract.buyBandwidth(amount, days).send({ callValue: totalSun });

    alert(`✅ Bandwidth purchase: ${amount} for ${days} day(s)`);
  } catch (err) {
    console.error(err);
    alert("❌ Bandwidth transaction failed!");
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

// Estimate Calculation
function calculateEstimate(idAmount, idDays, ratePerUnit, estimateId) {
  const amount = parseFloat(document.getElementById(idAmount).value) || 0;
  const days = parseInt(document.getElementById(idDays).value) || 1;
  const cost = (amount * days * ratePerUnit) / 1_000_000;
  document.getElementById(estimateId).innerText = cost.toFixed(3);
}

// Estimation Events
document.getElementById('bandwidthAmount').addEventListener('input', () =>
  calculateEstimate('bandwidthAmount', 'bandwidthDays', 10, 'bandwidthEstimate')
);
document.getElementById('bandwidthDays').addEventListener('change', () =>
  calculateEstimate('bandwidthAmount', 'bandwidthDays', 10, 'bandwidthEstimate')
);

document.getElementById('energyAmount').addEventListener('input', () =>
  calculateEstimate('energyAmount', 'energyDays', 0.5, 'energyEstimate')
);
document.getElementById('energyDays').addEventListener('change', () =>
  calculateEstimate('energyAmount', 'energyDays', 0.5, 'energyEstimate')
);

// Run on Start
fetchTRXPrice();

// Update TRX Price every 1 minutes
setInterval(fetchTRXPrice, 1 * 60 * 1000);



// 📶 Auto detect TronLink every 2 sec
function detectTronLink(retry = 10) {
  if (window.tronWeb && window.tronWeb.ready) {
    console.log("✅ TronLink Connected:", tronWeb.defaultAddress.base58);
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


// Central pricing
const pricing = {
  energy: {
    1: 0.0001,3: 0.000165,5: 0.000275,10: 0.00055,15: 0.00075,30: 0.00135
  },
  bandwidth: { 1: 1.56 / 1000, 3: 4.095 / 1000, 5: 6.825 / 1000, 10: 13.65 / 1000, 15: 20.475 / 1000, 30: 40.95 / 1000 }
};

const platformWallet = "TMvfDAN4NNWhRCwbHZqj2LvQptHZQJE6gA";


// Validate + Calculate total TRX
function validateAndCalc() {
  const type = document.getElementById("finalType").value;
  const amt = parseFloat(document.getElementById("finalAmount").value);
  const days = document.getElementById("finalDays").value;
  const toAddr = document.getElementById("finalToAddress").value.trim();
  const totalTxt = document.getElementById("finalTotal");
  const depositBtn = document.getElementById("finalDepositBtn");

  let valid = true;
  if (!type) valid = false;
  if (!amt || (type === "energy" && amt < 50000) || (type === "bandwidth" && amt < 1000)) valid = false;
  if (!days) valid = false;
  if (toAddr.length !== 34) valid = false;

  if (valid) {
    const rate = pricing[type][days];
    const total = (amt * rate).toFixed(3);
    totalTxt.innerText = total + " TRX";
    depositBtn.disabled = false;
  } else {
    totalTxt.innerText = "-";
    depositBtn.disabled = true;
  }
}

// Deposit popup open
function openDepositPopup() {
  document.getElementById("depositPopup").classList.remove("hidden");
}
function closePopup() {
  document.getElementById("depositPopup").classList.add("hidden");
}


// Copy wallet address
function copyPlatformWallet() {
  navigator.clipboard.writeText(platformWallet);
  alert("📋 Copied platform wallet!");
}

// Confirm deposit & start 15m timer
function confirmDeposit() {
  const userAddr = document.getElementById("userDepositAddress").value.trim();
  if (!userAddr || userAddr.length !== 34) return alert("❗ Enter valid deposit wallet address.");

  document.getElementById("depositPopup").classList.add("hidden");
  start15MinTimer();
  document.getElementById("finalDepositBtn").disabled = true;
}

// 15m timer logic
function start15MinTimer() {
  let time = 900;
  const timerEl = document.getElementById("finalTimer");

  clearInterval(depositTimer); // clear any running timer
  depositTimer = setInterval(() => {
    const min = Math.floor(time / 60);
    const sec = time % 60;
    timerEl.innerText = `⏳ ${min}:${sec < 10 ? "0" : ""}${sec}`;
    if (time-- <= 0) {
      clearInterval(depositTimer);
      timerEl.innerText = "⏰ Time expired!";
      document.getElementById("finalDepositBtn").disabled = false;
    }
  }, 1000);
}

// Button click lag detection (3 sec)
function detectLag(btnId) {
  const btn = document.getElementById(btnId);
  const start = Date.now();

  setTimeout(() => {
    const diff = Date.now() - start;
    if (diff > 3000) {
      alert("⚠️ Network or wallet slow — retry if needed.");
    }
  }, 3000);
}

// Attach events
document.getElementById("finalType").addEventListener("change", validateAndCalc);
document.getElementById("finalAmount").addEventListener("input", validateAndCalc);
document.getElementById("finalDays").addEventListener("change", validateAndCalc);
document.getElementById("finalToAddress").addEventListener("input", validateAndCalc);
document.getElementById("finalDepositBtn").addEventListener("click", () => {
  openDepositPopup();
  detectLag("finalDepositBtn");
});
