'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

// Fix for default marker icons not appearing in Next.js/Webpack
const DefaultIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const locations = [
    {
        id: 1,
        name: "Bank Sampah PPSU Kelurahan Ciracas",
        coords: [-6.323631, 106.877521] as [number, number],
        address: "Jl. Raya Ciracas RT 07 RW 03"
    },
    {
        id: 2,
        name: "Bank Sampah Maju Mandiri",
        coords: [-6.326042, 106.882142] as [number, number],
        address: "Jl. Raya Ciracas RT 02 RW 04"
    },
    {
        id: 3,
        name: "Bank Sampah Pelangi 76",
        coords: [-6.328100, 106.883300] as [number, number],
        address: "Jl. Penganten Ali II RT 07 RW 06"
    },
    {
        id: 4,
        name: "Bank Sampah KWMT",
        coords: [-6.316127, 106.875194] as [number, number],
        address: "Jl. Komplek Kebersihan RT 01 RW 09"
    }
];

export default function OSKUMap() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-xl">
                <div className="text-center">
                    <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                    <p className="text-gray-500">Memuat Peta...</p>
                </div>
            </div>
        );
    }

    return (
        <MapContainer
            center={[-6.3235, 106.8797]}
            zoom={15}
            scrollWheelZoom={false}
            className="h-full w-full rounded-xl z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map((loc) => (
                <Marker key={loc.id} position={loc.coords}>
                    <Popup>
                        <div className="font-sans">
                            <p className="font-bold text-primary m-0">{loc.name}</p>
                            <p className="text-xs text-gray-500 m-0">{loc.address}</p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
