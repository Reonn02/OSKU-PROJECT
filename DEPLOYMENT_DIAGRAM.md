# Deployment Diagram (UML Standard)

Berikut adalah diagram dengan **High Contrast Mode** (hitam di atas putih) untuk memastikan keterbacaan maksimal.

```mermaid
graph TD
    %% Define Styles
    classDef highContrast fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000;

    %% Client Execution Env
    subgraph ClientNode ["<<device>> Client Workstation"]
        direction TB
        Browser["<<artifact>> Web Browser"]:::highContrast
    end

    %% Web Server Execution Env
    subgraph ServerNode ["<<execution environment>> Vercel Cloud"]
        direction TB
        NextApp["<<artifact>> Next.js Application"]:::highContrast
    end

    %% Database Device
    subgraph DatabaseNode ["<<device>> Database Server (Supabase)"]
        direction TB
        Postgres["<<component>> PostgreSQL Database"]:::highContrast
    end

    %% Storage Device
    subgraph StorageNode ["<<device>> Storage Server (Supabase)"]
        direction TB
        MinIO["<<component>> Object Storage Bucket"]:::highContrast
    end

    %% Apply Style to Subgraphs (if supported by renderer)
    style ClientNode fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style ServerNode fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style DatabaseNode fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style StorageNode fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000

    %% Relationships
    Browser -- "HTTP/S (JSON)" --> NextApp
    NextApp -- "TCP/IP (SQL)" --> Postgres
    NextApp -- "HTTP/S (API)" --> MinIO
```

## Keterangan
*   Diagram ini menggunakan latar `fill:#ffffff` (Putih) dan teks `#000000` (Hitam) secara eksplisit.
*   Garis tepi dibuat tebal (`stroke-width:2px`) agar batas kotak terlihat tegas.
