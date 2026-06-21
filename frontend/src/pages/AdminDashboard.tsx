import { Card } from '../components/Card';

/**
 * Admin dashboard (stub). Will host: the prioritised report queue + AI clusters,
 * the announcements composer, the event creator, and content flagging.
 */
export function AdminDashboard(): JSX.Element {
  return (
    <section className="cb-view">
      <h1>Admin dashboard</h1>
      <Card>
        <p>Report queue, announcements, events, and moderation will appear here.</p>
      </Card>
    </section>
  );
}
