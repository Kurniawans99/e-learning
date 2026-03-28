"use client";

import Navbar from "@/components/Navbar";

// Expose the client Navbar in a tiny wrapper so DashboardPage can remain a Server Component
export default function DashboardInteractive({ user }: { user: any }) {
  return (
    <Navbar variant="dashboard" />
  );
}
