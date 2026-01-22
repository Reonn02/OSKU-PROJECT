import DesktopOnlyGuard from '@/components/DesktopOnlyGuard';

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
