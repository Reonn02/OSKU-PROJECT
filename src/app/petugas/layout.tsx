import DesktopOnlyGuard from '@/components/shared/DesktopOnlyGuard';

export default function PetugasLayout({
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
