/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
admin.initializeApp();
const db = admin.database();

// 🪙 Claim Reward Function
exports.claimStakeReward = functions.https.onCall(async (data, context) => {
const { stakeId } = data;

if (!stakeId) throw new functions.https.HttpsError("invalid-argument", "Missing stakeId");

const ref = db.ref(`stakes/${stakeId}`);
const snapshot = await ref.once("value");

if (!snapshot.exists()) {
throw new functions.https.HttpsError("not-found", "Stake not found");
}

const stake = snapshot.val();
if (stake.claimed) {
throw new functions.https.HttpsError("already-exists", "Already claimed");
}

// ✅ Mark as claimed
await ref.update({ claimed: true, claimedAt: Date.now() });
return { success: true, message: "Reward claimed!" };
});