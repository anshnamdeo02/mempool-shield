export default function HomePage() {
  return (
    <section className="card">
      <h2>Commit-Reveal Shield Against Front-Running</h2>
      <p>
        Mempool-Shield protects users from transaction sniping by hiding sensitive action details
        during the commit phase. The action and salt are revealed only after a delay.
      </p>
      <ol>
        <li>Commit phase: submit only a hash generated from wallet address, action, and salt.</li>
        <li>Delay phase: wait at least 5 blocks before reveal.</li>
        <li>Reveal phase: submit action + salt and let contract verify correctness.</li>
      </ol>
      <p>
        Why this prevents front-running: copied commitments do not help attackers because the hash is
        bound to the original sender address.
      </p>
    </section>
  );
}
