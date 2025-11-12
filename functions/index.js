// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {Expo} = require("expo-server-sdk");

try {
  admin.initializeApp();
} catch (e) {
  // Ya estaba inicializado (pasa en hot reload/local); lo ignoramos.
  // No dejamos el catch vacío para cumplir ESLint (no-empty).
  console.warn("[init] admin already initialized");
}

const expo = new Expo();

exports.onIncidentWrite = functions.firestore
    .document("incidents/{incidentId}")
    .onWrite(async (change, context) => {
      const before = change.before.exists ? change.before.data() : null;
      const after = change.after.exists ? change.after.data() : null;

      if (!after) return null;

      const userId = after.userId;
      if (!userId) return null;

      const statusChanged = !before || before.status !== after.status;
      const assignChanged =
      !before ||
      before.assignedDeptId !== after.assignedDeptId ||
      before.assignedUnitId !== after.assignedUnitId;

      if (!statusChanged && !assignChanged) return null;

      // pushToken del dueño
      const userRef = admin.firestore().doc(`users/${userId}`);
      const userSnap = await userRef.get();
      if (!userSnap.exists) return null;

      const pushToken = userSnap.get("pushToken");
      if (!pushToken || !Expo.isExpoPushToken(pushToken)) return null;

      const title = statusChanged ?
      `Tu reporte cambió a: ${after.status}` :
      "Tu reporte ha sido asignado";

      const parts = [];
      if (after.category) parts.push(after.category);
      if (after.subcategory) parts.push(after.subcategory);

      const hasAssignText = assignChanged &&
      (after.assignedDept || after.assignedUnit);

      if (hasAssignText) {
        const right = after.assignedUnit ? ` · ${after.assignedUnit}` : "";
        const left = after.assignedDept || "";
        parts.push(`→ ${left}${right}`);
      }

      const body = parts.filter(Boolean).join(" - ") ||
      "Actualización de tu reporte";

      const messages = [{
        to: pushToken,
        sound: "default",
        title,
        body,
        data: {
          incidentId: context.params.incidentId,
          status: after.status || "",
        },
      }];

      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        try {
          await expo.sendPushNotificationsAsync(chunk);
        } catch (err) {
          console.error("Expo push error:", err);
        }
      }
      return null;
    });
