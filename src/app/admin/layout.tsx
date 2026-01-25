import DesktopOnlyGuard from '@/components/shared/DesktopOnlyGuard';

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
