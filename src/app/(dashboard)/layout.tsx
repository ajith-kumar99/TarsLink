export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // TODO: Add auth guard, sidebar layout
    return <div className="flex h-screen">{children}</div>;
}
