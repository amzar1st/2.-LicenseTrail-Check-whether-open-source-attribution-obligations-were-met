export const POLICY = 'licensetrail-attribution-v1';
const pin = /^https:\/\/raw\.githubusercontent\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/[a-f0-9]{40}\/[A-Za-z0-9_./-]+$/;

export function pinnedUrl(url) {
  return typeof url === 'string' && url.length <= 320 && pin.test(url)
    && url.split('/').slice(3).every(part => part && part !== '.' && part !== '..');
}

export async function reviewId(url, sha256) {
  if (!pinnedUrl(url) || !/^[a-f0-9]{64}$/.test(sha256)) {
    throw new Error('Enter a raw GitHub URL pinned to a full commit and a valid SHA-256.');
  }
  const bytes = new TextEncoder().encode(JSON.stringify([POLICY, {sha256, url}]));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function receiptState(tx) {
  const status = tx?.statusName ?? (typeof tx?.status === 'string' ? tx.status : '');
  if (!tx || !status) return 'Waiting for Studio to index this transaction.';
  const leader = tx.consensus_data?.leader_receipt;
  const execution = tx.txExecutionResultName ?? (Array.isArray(leader) ? leader[0] : leader)?.execution_result;
  if (status === 'FINALIZED') {
    if (execution === 'FINISHED_WITH_RETURN' || execution === 'SUCCESS') return 'Finalized · execution succeeded';
    if (execution === 'FINISHED_WITH_ERROR' || execution === 'ERROR') return 'Finalized · execution failed';
    return 'Finalized · execution result unavailable';
  }
  if (['CANCELED', 'CANCELLED', 'UNDETERMINED'].includes(status)) return status;
  return `Pending finalization · ${status.replaceAll('_', ' ')}`;
}
