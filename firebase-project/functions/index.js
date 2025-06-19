const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.database();

// 🎉 Claim Reward (Callable Function)
exports.claimStakeReward = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*'); // CORS fix
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // Preflight OPTIONS request
    if (req.method === 'OPTIONS') {
    return res.status(204).send('');
    }
    
    if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }
    
    const { stakeId } = req.body;
    
    if (!stakeId) {
    return res.status(400).json({ success: false, message: 'Missing stakeId' });
    }
    
    try {
    const ref = admin.database().ref(`stakes/${stakeId}`);
    const snapshot = await ref.once('value');

    if (!snapshot.exists()) {
        return res.status(404).json({ success: false, message: 'Stake not found' });
      }
      
      const stake = snapshot.val();
      
      if (stake.claimed) {
        return res.status(400).json({ success: false, message: 'Already claimed' });
      }
      
      await ref.update({ claimed: true, claimedAt: Date.now() });
      
      return res.status(200).json({ success: true, message: 'Reward claimed!' });
    } catch (error) {
        console.error('Error claiming reward:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
        }
        });      
  

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


// 🏦 Create or Update Stake (manual POST)
exports.createOrUpdateStake = functions.https.onRequest(async (req, res) => {
    const data = req.body;
    if (!data.wallet || !data.amount || !data.days) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }
  
    const stakeId = data.stakeId || push(child(ref(db), "stakes")).key;
    const createdAt = data.createdAt || Date.now();
    const existingSnapshot = await get(child(ref(db), `stakes/${stakeId}`));
    const existing = existingSnapshot.exists() ? existingSnapshot.val() : {};
  
    const endsAt = existing.endsAt || createdAt + data.days * 24 * 60 * 60 * 1000;
  
    await update(ref(db, `stakes/${stakeId}`), {
      wallet: data.wallet,
      amount: data.amount,
      days: data.days,
      reward: data.reward || 0,
      claimed: false,
      createdAt,
      endsAt,
    });
  
    return res.json({ success: true, stakeId });
  });
  
  

// 💰 Handle Referral Rewards on new stakes
exports.handleReferralRewards = onRequest(async (req, res) => {
  const { stakeId, referrer } = req.body;

  if (!stakeId || !referrer) {
    return res.status(400).json({ success: false, message: "Missing stakeId or referrer" });
  }

  try {
    const stakeRef = db.ref(`stakes/${stakeId}`);
    const stakeSnapshot = await stakeRef.once("value");

    if (!stakeSnapshot.exists()) {
      return res.status(404).json({ success: false, message: "Stake not found" });
    }

    const stake = stakeSnapshot.val();
    if (stake.claimed) {
      return res.status(400).json({ success: false, message: "Stake already claimed" });
    }

    // Update the referrer with the new reward
    const referrerRef = db.ref(`referrers/${referrer}`);
    await referrerRef.transaction(referrerData => {
      if (!referrerData) {
        referrerData = { totalRewards: 0 };
      }
      referrerData.totalRewards += stake.reward || 0;
      return referrerData;
    });

    // Mark the stake as claimed
    await stakeRef.update({ claimed: true, claimedAt: Date.now() });

    return res.status(200).json({ success: true, message: "Referral reward processed" });
  } catch (error) {
    console.error("Error processing referral reward:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

//  Firebase Callable Function: claim Referral Reward
exports.claimReferralReward = onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*'); // CORS fix
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { referrer } = req.body;

  if (!referrer) {
    return res.status(400).json({ success: false, message: 'Missing referrer' });
  }

  try {
    const referrerRef = db.ref(`referrers/${referrer}`);
    const snapshot = await referrerRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ success: false, message: 'Referrer not found' });
    }

    const referrerData = snapshot.val();
    
    if (referrerData.claimed) {
      return res.status(400).json({ success: false, message: 'Already claimed' });
    }

    await referrerRef.update({ claimed: true, claimedAt: Date.now() });

    return res.status(200).json({ success: true, message: 'Referral reward claimed!' });
  } catch (error) {
    console.error('Error claiming referral reward:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 🏷️ Referral System: Create or Update Referrer
exports.createOrUpdateReferrer = onRequest(async (req, res) => {
  const { referrer, wallet } = req.body;

  if (!referrer || !wallet) {
    return res.status(400).json({ success: false, message: "Missing referrer or wallet" });
  }

  try {
    const referrerRef = db.ref(`referrers/${referrer}`);
    await referrerRef.set({
      wallet,
      totalRewards: 0,
      createdAt: Date.now(),
      claimed: false
    });

    return res.status(200).json({ success: true, message: "Referrer created/updated" });
  } catch (error) {
    console.error("Error creating/updating referrer:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// 📊 Get Referrer Stats
exports.getReferrerStats = onRequest(async (req, res) => {
  const { referrer } = req.query;

  if (!referrer) {
    return res.status(400).json({ success: false, message: "Missing referrer" });
  }

  try {
    const referrerRef = db.ref(`referrers/${referrer}`);
    const snapshot = await referrerRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ success: false, message: "Referrer not found" });
    }

    const referrerData = snapshot.val();
    return res.status(200).json({ success: true, data: referrerData });
  } catch (error) {
    console.error("Error fetching referrer stats:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// claim Referrer Reward
exports.claimReferrerReward = onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*'); // CORS fix
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { referrer } = req.body;

  if (!referrer) {
    return res.status(400).json({ success: false, message: 'Missing referrer' });
  }

  try {
    const referrerRef = db.ref(`referrers/${referrer}`);
    const snapshot = await referrerRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ success: false, message: 'Referrer not found' });
    }

    const referrerData = snapshot.val();
    
    if (referrerData.claimed) {
      return res.status(400).json({ success: false, message: 'Already claimed' });
    }

    await referrerRef.update({ claimed: true, claimedAt: Date.now() });

    return res.status(200).json({ success: true, message: 'Referrer reward claimed!' });
  } catch (error) {
    console.error('Error claiming referrer reward:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

