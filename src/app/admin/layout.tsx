import DesktopOnlyGuard from '@/components/DesktopOnlyGuard';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DesktopOnlyGuard>
            {children}
        </DesktopOnlyGuard>
    );
}
