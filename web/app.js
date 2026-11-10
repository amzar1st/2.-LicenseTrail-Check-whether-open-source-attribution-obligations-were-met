import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import { pinnedUrl, receiptState, reviewId } from './lifecycle.mjs';
import config from './config.json';

const ui = id => document.getElementById(id);
const client = createClient({ chain: studionet });
const explorer = 'https://explorer-studio.genlayer.com';
const repository = 'https://github.com/' + config.manifest.split('/').slice(3, 5).join('/');
ui('repo').href = repository;
ui('source').href = `${repository}/blob/${config.sourceCommit}/contracts/license_trail.py`;
ui('studio').href = 'https://studio.genlayer.com/?import-contract=' + config.address;
ui('contract').href = `${explorer}/address/${config.address}`;
let reportRequest = 0;
let trackingRequest = 0;

function add(parent, tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  parent.append(node);
  return node;
}

function link(parent, label, url) {
  if (!pinnedUrl(url)) return;
  const anchor = add(parent, 'a', label);
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
}

const reasons = {
  REQUIRED_TEXT_PRESENT: 'Required text is present after whitespace normalization.',
  LICENSE_TEXT_OR_ATTRIBUTION_MISSING: 'The shipped notices do not contain the pinned license text and attribution.',
  DECLARATION_DIFFERS_FROM_LICENSE_FILE: 'The declared license differs from the license file.',
  EVIDENCE_UNAVAILABLE: 'Required evidence is missing, unreadable, unrecognized, or fails its commitment.',
  LICENSE_OUTSIDE_POLICY: 'The declared license is outside the supported policy.',
  REWORDED_NOTICE_REQUIRES_REVIEW: 'The upstream attribution appears reworded and requires manual review.',
  NOTICE_COMPARISON_UNCERTAIN: 'Validators could not establish the status of the reworded notice.',
  UPSTREAM_ATTRIBUTION_OMITTED: 'The notice comparison found omitted upstream attribution.',
};

function showReport(report) {
  const output = ui('report');
  const title = report.release ?? 'Manifest could not be verified';
  add(output, 'h3', title);
  add(output, 'span', report.status.replaceAll('_', ' '), 'badge');
  add(output, 'p', `Review ID · ${report.review_id}`, 'fingerprint');
  add(output, 'p', `Decision SHA-256 · ${report.decision_hash}`, 'fingerprint');
  const evidence = add(output, 'p', '');
  link(evidence, 'Pinned manifest ↗', report.manifest.url);
  if (report.notices) {
    evidence.append(' · ');
    link(evidence, 'Shipped notices ↗', report.notices.url);
  }
  for (const item of report.findings) {
    const row = add(output, 'article', '');
    add(row, 'h3', item.id);
    add(row, 'span', item.outcome.replaceAll('_', ' '), item.outcome === 'COMPLETE' ? 'badge' : 'badge issue');
    add(row, 'p', reasons[item.reason] ?? item.reason);
    add(row, 'p', `Declared: ${item.declared_license} · Observed: ${item.observed_license ?? 'Unknown'}`);
    add(row, 'p', `License fingerprint · ${item.license_fingerprint}`, 'fingerprint');
    link(row, 'Pinned license ↗', item.license.url);
    if (item.upstream_notice) {
      row.append(' · ');
      link(row, 'Upstream notice ↗', item.upstream_notice.url);
    }
  }
}

async function loadReport() {
  const current = ++reportRequest;
  ui('report').replaceChildren();
  ui('report-status').textContent = 'Reading finalized Studionet state…';
  try {
    const id = await reviewId(ui('manifest').value.trim(), ui('digest').value.trim().toLowerCase());
    const raw = await client.readContract({
      address: config.address,
      functionName: 'get_report',
      args: [id],
      transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
    });
    if (current !== reportRequest) return;
    if (!raw) {
      ui('report-status').textContent = 'No finalized report for these inputs. Submit the audit in Studio or wait for finalization.';
      return;
    }
    const report = JSON.parse(raw);
    if (report.review_id !== id) throw new Error('The returned report does not match these inputs.');
    showReport(report);
    ui('report-status').textContent = 'Finalized on Studionet';
  } catch (error) {
    if (current === reportRequest) ui('report-status').textContent = `Unable to read report. ${error.shortMessage ?? error.message}`;
  }
}

ui('form').addEventListener('submit', event => {
  event.preventDefault();
  loadReport();
});

ui('demo').addEventListener('click', () => {
  ui('manifest').value = config.manifest;
  ui('digest').value = config.sha256;
  if (config.demoTransaction) ui('hash').value = config.demoTransaction;
  loadReport();
});

ui('track').addEventListener('submit', async event => {
  event.preventDefault();
  const current = ++trackingRequest;
  const hash = ui('hash').value.trim();
  ui('tx-link').href = `${explorer}/tx/${hash}`;
  ui('tx-link').hidden = false;
  ui('tx-status').textContent = 'Looking up the transaction…';
  for (let attempt = 0; attempt < 36 && current === trackingRequest; attempt++) {
    try {
      const transaction = await client.getTransaction({hash});
      if (current !== trackingRequest) return;
      const recipient = transaction?.to_address ?? transaction?.recipient;
      if (recipient && recipient.toLowerCase() !== config.address.toLowerCase()) {
        ui('tx-status').textContent = 'This transaction targets a different contract.';
        return;
      }
      const state = receiptState(transaction);
      ui('tx-status').textContent = state;
      if (!state.startsWith('Pending') && !state.startsWith('Waiting')) {
        if (state === 'Finalized · execution succeeded' && ui('form').checkValidity()) loadReport();
        return;
      }
    } catch (error) {
      if (current !== trackingRequest) return;
      ui('tx-status').textContent = `Receipt unavailable. Retrying… ${error.shortMessage ?? error.message}`;
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  if (current === trackingRequest) ui('tx-status').textContent += ' Polling paused. Track again to resume.';
});
