/**
 * Shared queue metrics helpers.
 * Keeps wait-time calculations consistent across queue, token, and public tracking flows.
 */
const tokenRepository = require('../repositories/token.repository');

function resolveAverageServiceTime(avgValue, fallbackAvg = 5) {
  const normalizedAvg = Number(avgValue);
  const fallback = Number(fallbackAvg) || 5;
  return normalizedAvg > 0 ? Math.round(normalizedAvg) : fallback;
}

async function getDynamicAverageServiceTime(queueId, fallbackAvg = 5) {
  const result = await tokenRepository.getQueueAverageServiceTime(queueId);
  return resolveAverageServiceTime(result.rows[0]?.avg_service_time, fallbackAvg);
}

function calculateEstimatedWait(peopleAhead, averageServiceTime) {
  const ahead = Math.max(0, Number(peopleAhead) || 0);
  const avg = Math.max(0, Number(averageServiceTime) || 0);
  return Math.max(0, Math.round(ahead * avg));
}

module.exports = {
  resolveAverageServiceTime,
  getDynamicAverageServiceTime,
  calculateEstimatedWait,
};
