
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.database();



// 🕒 Auto Fulfill Stakes every 24h
exports.autoFulfillStakes = onSchedule("every 24 hours", async () => {
  const now = Date.now();
  const snapshot = await db.ref("stakes").once("value");

  if (!snapshot.exists()) {
    console.log("No stakes found.");
    return;
  }

  const updates = {};
  snapshot.forEach(child => {
    const stake = child.val();
   // ✅ Fulfill only if:
// - Not already claimed
// - endsAt is in the past (staking complete)
if (!stake.claimed && stake.endsAt && stake.endsAt <= now) {
    const path = child.key;
    updates[`${path}/claimed`] = true;
    updates[`${path}/claimedAt`] = now;
  }
  
  });

  if (Object.keys(updates).length > 0) {
    await db.ref("stakes").update(updates);
    console.log("✅ Stakes auto-fulfilled:", updates);
  } else {
    console.log("⚠️ No eligible stakes to fulfill.");
  }
});

// 🧾 Pending Sale Creator (manual POST)
exports.createPendingSale = functions.https.onRequest((req, res) => {
  if (req.method !== "POST") return res.status(405).send("Only POST allowed");

  const { wallet, type, amount, duration } = req.body;
  if (!wallet || !type || !amount || !duration) {
    return res.status(400).send("Missing fields");
  }

  db.ref("/pendingSales").push({
    wallet,
    type,
    amount,
    duration,
    timestamp: Date.now()
  })
    .then(() => res.status(200).send("Sale saved"))
    .catch(err => {
      console.error("Error:", err);
      res.status(500).send("Internal error");
    });
});




