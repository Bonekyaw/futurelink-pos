export default function Home() {
  return (
    <main className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">POS Admin</h1>
      <p className="text-zinc-600 mb-4">
        Authentication uses a 4-digit PIN and JWT (8h). Web clients receive an
        HTTP-only cookie; mobile clients use the Bearer token from the login
        response.
      </p>
      <ul className="list-disc pl-6 space-y-2 text-sm text-zinc-700">
        <li>
          <code className="bg-zinc-100 px-1 rounded">POST /api/auth/login</code>{" "}
          — body:{" "}
          <code>{`{ "pin": "1234", "clientType": "web" | "mobile" }`}</code>
        </li>
        <li>
          <code className="bg-zinc-100 px-1 rounded">POST /api/auth/logout</code>{" "}
          — clears web cookie
        </li>
        <li>
          <code className="bg-zinc-100 px-1 rounded">GET /api/auth/me</code> —
          current user (cookie or Bearer)
        </li>
        <li>
          <code className="bg-zinc-100 px-1 rounded">/api/admin/waiters</code> —
          waiter CRUD (ADMIN only, JWT required)
        </li>
      </ul>
      <p className="mt-6 text-sm text-zinc-500">
        Create the first admin with{" "}
        <code className="bg-zinc-100 px-1 rounded">
          npx tsx scripts/bootstrap-admin.ts
        </code>{" "}
        (see script for env vars).
      </p>
    </main>
  );
}
