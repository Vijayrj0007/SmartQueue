/**
 * Public token tracking service.
 * Anonymous, read-only projection for token status tracking.
 */
const publicTokenRepository = require('../repositories/publicToken.repository');
const {
  getDynamicAverageServiceTime,
  calculateEstimatedWait,
} = require('./queueMetrics.service');

const TRACKABLE_STATUSES = new Set(['waiting', 'called', 'serving', 'completed', 'missed']);

function normalizePublicStatus(status) {
  if (status === 'called' || status === 'serving') return 'serving';
  return status;
}

function getQueuePosition(status, peopleAhead) {
  return status === 'waiting' ? peopleAhead + 1 : 0;
}

function getEstimatedWait(status, peopleAhead, avgServiceTime) {
  return status === 'waiting' ? calculateEstimatedWait(peopleAhead, avgServiceTime) : 0;
}

async function getPublicTokenStatus(tokenIdentifier) {
  const normalizedIdentifier = String(tokenIdentifier || '').trim();
  if (!normalizedIdentifier) {
    return { ok: false, status: 400, message: 'Token ID is required.' };
  }

  const result = await publicTokenRepository.findTrackableTokenByIdentifier(normalizedIdentifier);
  if (result.rows.length === 0) {
    return { ok: false, status: 404, message: 'Token not found.' };
  }

  const token = result.rows[0];
  if (!TRACKABLE_STATUSES.has(token.status)) {
    return {
      ok: false,
      status: 404,
      message: 'Token not found or not available for public tracking.',
    };
  }

  const averageServiceTime = await getDynamicAverageServiceTime(token.queue_id, token.avg_service_time);
  const peopleAheadResult =
    token.status === 'waiting'
      ? await publicTokenRepository.countWaitingAhead(token.queue_id, token.position, token.priority_level)
      : { rows: [{ count: 0 }] };

  const peopleAhead = parseInt(peopleAheadResult.rows[0]?.count || 0, 10);
  const normalizedStatus = normalizePublicStatus(token.status);

  return {
    ok: true,
    data: {
      token_id: token.id,
      queue_id: token.queue_id,
      token_number: token.token_number,
      status: normalizedStatus,
      queue_name: token.queue_name,
      current_serving_token: token.current_serving_token,
      position_in_queue: getQueuePosition(token.status, peopleAhead),
      estimated_wait_time: getEstimatedWait(token.status, peopleAhead, averageServiceTime),
    },
  };
}

module.exports = {
  getPublicTokenStatus,
};
