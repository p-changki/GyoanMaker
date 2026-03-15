// Core Firestore
export { getDb, getStorageBucket } from "./firebase-admin";

// Users
export {
  isAdmin,
  getUser,
  getUserStatus,
  findOrCreateUser,
  updateUserStatus,
  listUsers,
  softDeleteUser,
  deleteUser,
  type AppUser,
  type UserStatus,
} from "./users";

// Quota
export {
  getQuotaStatus,
  incrementUsage,
  reserveQuota,
  rollbackQuota,
  setQuotaLimits,
  setStorageUsed,
  reserveStorageSlot,
  incrementStorageUsed,
  purgeExpiredCredits,
  initializeQuota,
  incrementIllustrationUsage,
  DEFAULT_QUOTA,
  QuotaExceededError,
  type LegacyQuotaLimits,
  type QuotaLimitsUpdate,
  type QuotaModelStatus,
  type QuotaStatus,
  type ReservationReceipt,
} from "./quota/index";

// Subscription
export {
  getSubscription,
  changePlan,
  changePlanManual,
  expirePlanIfNeeded,
  addTopUpCredits,
  getSubscriptionExtended,
  revokeCredits,
  type SubscriptionExtended,
} from "./subscription";

// Plan History
export {
  logPlanChange,
  getPlanHistory,
  type PlanHistoryEntry,
  type PlanHistoryRow,
} from "./plan-history";

// Orders
export { getUserOrders, type OrderRow } from "./orders";

// Usage Logs
export {
  logUsage,
  getUsageSummary,
  estimateCostUsd,
  getUserUsageLogs,
  TOKEN_PRICING,
  type UsageLogEntry,
  type UsageSummary,
  type UsageLogRow,
  type UserUsageLogsResult,
} from "./usageLog";

// Email
export {
  sendOrderApprovedEmail,
  sendOrderRejectedEmail,
  sendAdminPurchaseNotificationEmail,
  sendAdminBankTransferNotificationEmail,
  sendOrderReceivedEmail,
} from "./email";

// Firebase Storage
export {
  buildIllustrationStoragePrefix,
  buildIllustrationStoragePath,
  buildIllustrationReferenceStoragePath,
  isOwnedStoragePath,
  uploadIllustrationBase64,
  uploadIllustrationReferenceImageBase64,
  getIllustrationSignedReadUrl,
  readIllustrationImageBase64,
  deleteIllustrationImage,
  deleteIllustrationFolder,
} from "./firebase-storage";

// Illustration Presets
export {
  listIllustrationPresets,
  addIllustrationPreset,
  removeIllustrationPreset,
  getIllustrationPreset,
} from "./illustration-presets";

// Telegram
export {
  sendBankTransferTelegramNotification,
  type BankTransferTelegramInfo,
} from "./telegram";

// Illustration Samples
export {
  listIllustrationSamples,
  countIllustrationSamples,
  saveIllustrationSample,
  activateIllustrationSample,
  deactivateIllustrationSample,
  activatePresetSample,
  getActivePresetId,
  deleteIllustrationSample,
} from "./illustration-samples";
