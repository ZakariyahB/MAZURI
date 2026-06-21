import { mountStandalone } from './standalone/StandaloneApp';

/**
 * App bootstrap.
 *
 * For now we boot the STANDALONE entry (our own hosted page). Later, an
 * embeddable widget shell (src/embed) can mount the same core app without
 * touching this file — the embed is an added wrapper, not a rewrite.
 */
const container = document.getElementById('community-bridge-root');
if (!container) {
  throw new Error('Mount target #community-bridge-root not found');
}

mountStandalone(container);
