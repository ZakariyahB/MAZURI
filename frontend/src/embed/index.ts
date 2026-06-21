/**
 * Embeddable widget wrapper — PLACEHOLDER (stub only).
 *
 * OPEN DECISION (see README): the frontend may ultimately ship as
 *   (A) an embeddable widget dropped into a community's existing site, or
 *   (B) our own standalone website.
 * We build standalone-first; this file marks where the embed shell will live.
 *
 * Intended shape (NOT implemented yet): a tiny script that finds its host
 * element, optionally injects an iframe / Shadow DOM for style isolation, reads
 * config from data-* attributes on the host, then mounts the SAME core app the
 * standalone entry uses:
 *
 *   import { createRoot } from 'react-dom/client';
 *   import { CoreApp } from '../core';
 *   createRoot(hostContainer).render(
 *     <CoreApp config={{ apiBaseUrl, authToken }} />,
 *   );
 *
 * The embed is an added wrapper around CoreApp, never a rewrite of it.
 */

export {};
