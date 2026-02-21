export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Auth guard will be added here once Clerk is set up
    return <>{children}</>;
}
