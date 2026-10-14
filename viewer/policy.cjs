'use strict';
const path = require('node:path');
const crypto = require('node:crypto');
const MAX_BOOK_BYTES = 25 * 1024 * 1024;
// No fetch/XHR, workers, frames, plugins, forms, remote fonts or remote images.
// Inline script is necessary for self-contained interactive books.
const CSP = "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src data:; font-src data:; media-src data:; connect-src 'none'; frame-src 'none'; child-src 'none'; worker-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'";
function bookId(file) {
  const normalized = process.platform === 'win32' ? file.toLowerCase() : file;
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 32);
}
function bookURL(id) { return `book://${id}/index.html`; }
function allowedBookURL(value, id) {
  try {
    const u = new URL(value);
    return u.protocol === 'book:' && u.hostname === id && !u.username && !u.password && !u.port && u.pathname === '/index.html' && !u.search;
  } catch { return false; }
}
function allowedResource(value, id) {
  // Only the opened document and inline data assets; no file-system protocol.
  return allowedBookURL(value, id) || value.startsWith('data:');
}
function validateFileName(file) {
  if (typeof file !== 'string' || !path.isAbsolute(file) || /^[/\\]{2}/.test(file) || file.includes('\0')) throw new Error('Choose a local disk file, not a network path.');
  if (!/\.html?$/i.test(file)) throw new Error('Choose a .html or .htm book.');
  if (process.platform === 'win32' && /:/.test(file.slice(2))) throw new Error('Alternate data streams are not books.');
}
function scrollValue(value) { return Number.isFinite(value) ? Math.max(0, Math.min(10000000, Math.round(value))) : 0; }
function zoomValue(value) { return Number.isFinite(value) ? Math.max(.5, Math.min(2.5, value)) : 1; }
module.exports = { MAX_BOOK_BYTES, CSP, bookId, bookURL, allowedBookURL, allowedResource, validateFileName, scrollValue, zoomValue };
