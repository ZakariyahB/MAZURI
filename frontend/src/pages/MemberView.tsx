import { Card } from '../components/Card';

/**
 * Member view (stub). Lives under core/ so it ships in both standalone and
 * embedded modes. Will host: the suggestion feed + upvotes, the report form,
 * and event voting.
 */
export function MemberView(): JSX.Element {
  return (
    <section className="cb-view">
      <h1>Member view</h1>
      <Card>
        <p>Suggestions, reports, and event voting will appear here.</p>
      </Card>
    </section>
  );
}
