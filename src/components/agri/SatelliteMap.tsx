import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, Circle, Polygon, Polyline, useMap, useMapEvents } from "react-leaflet";
import type { LatLon, Outbreak } from "@/lib/geo";
import { polygonAcres } from "@/lib/geo";
import type { Lang } from "@/lib/treatments";

const TILES = {
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics",
  },
  topo: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors, SRTM | &copy; OpenTopoMap",
  },
} as const;

function Recenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], map.getZoom(), { animate: true });
  }, [lat, lon, map]);
  return null;
}

function ClickCapture({ onPick }: { onPick?: ((p: LatLon) => void) | undefined }) {
  useMapEvents({
    click(e) {
      onPick?.({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

const vertexIcon = L.divIcon({
  className: "",
  html: `<div style="width:12px;height:12px;border-radius:9999px;background:#ffffff;border:3px solid #10B981;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const farmIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="display:grid;place-items:center;width:38px;height:38px;border-radius:9999px;background:#10B981;box-shadow:0 0 0 6px rgba(16,185,129,.28),0 6px 14px rgba(0,0,0,.35);border:2px solid #ffffff;font-size:18px;">🌿</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });

const outbreakIcon = (high: boolean) =>
  L.divIcon({
    className: "",
    html: `<div style="display:grid;place-items:center;width:32px;height:32px;border-radius:9999px;background:${
      high ? "#DC2626" : "#F59E0B"
    };box-shadow:0 0 0 5px ${high ? "rgba(220,38,38,.25)" : "rgba(245,158,11,.25)"},0 4px 10px rgba(0,0,0,.35);border:2px solid #ffffff;font-size:15px;">🔥</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

export default function SatelliteMap({
  lat,
  lon,
  view,
  outbreaks,
  lang,
  healthScore,
  radiusKm = 10,
  farm = [],
  drawing = false,
  onPick,
  onMoveVertex,
}: {
  lat: number;
  lon: number;
  view: "satellite" | "topo";
  outbreaks: Outbreak[];
  lang: Lang;
  healthScore: number | null;
  radiusKm?: number;
  farm?: LatLon[];
  drawing?: boolean;
  onPick?: ((p: LatLon) => void) | undefined;
  onMoveVertex?: ((index: number, p: LatLon) => void) | undefined;
}) {
  const tiles = TILES[view];
  const icons = useMemo(() => ({ farm: farmIcon(), high: outbreakIcon(true), med: outbreakIcon(false) }), []);
  const acres = useMemo(() => polygonAcres(farm), [farm]);

  return (
    <MapContainer
      center={[lat, lon]}
      zoom={12}
      scrollWheelZoom
      touchZoom
      className="h-full w-full"
      style={{ background: "var(--secondary)" }}
    >
      <TileLayer key={view} url={tiles.url} attribution={tiles.attribution} maxZoom={18} />
      <Recenter lat={lat} lon={lon} />
      <ClickCapture onPick={drawing ? onPick : undefined} />
      <Circle
        center={[lat, lon]}
        radius={radiusKm * 1000}
        pathOptions={{ color: "#10B981", weight: 1.5, fillOpacity: 0.06 }}
      />
      <Circle
        center={[lat, lon]}
        radius={(radiusKm * 1000) / 2}
        pathOptions={{ color: "#10B981", weight: 1, dashArray: "5 6", fillOpacity: 0 }}
      />

      {farm.length >= 3 ? (
        <Polygon
          positions={farm.map((p) => [p.lat, p.lon] as [number, number])}
          pathOptions={{ color: "#FACC15", weight: 3, fillColor: "#FACC15", fillOpacity: 0.22 }}
        >
          <Popup>
            <strong>My Farm Block</strong>
            <br />
            {acres.toFixed(2)} acres · {farm.length} boundary points
          </Popup>
        </Polygon>
      ) : farm.length === 2 ? (
        <Polyline
          positions={farm.map((p) => [p.lat, p.lon] as [number, number])}
          pathOptions={{ color: "#FACC15", weight: 3, dashArray: "6 6" }}
        />
      ) : null}

      {farm.map((p, i) => (
        <Marker
          key={`v${i}`}
          position={[p.lat, p.lon]}
          icon={vertexIcon}
          draggable={!!onMoveVertex}
          eventHandlers={{
            dragend: (e) => {
              const ll = (e.target as L.Marker).getLatLng();
              onMoveVertex?.(i, { lat: ll.lat, lon: ll.lng });
            },
          }}
        />
      ))}

      <Marker position={[lat, lon]} icon={icons.farm}>
        <Popup>
          <strong>My Farm (Current Scan)</strong>
          <br />
          Your Field — Health Score: {healthScore ?? "—"}/100
          <br />
          {healthScore == null
            ? "Run a scan to score this field"
            : healthScore >= 80
              ? "(Low Risk)"
              : healthScore >= 50
                ? "(Moderate Risk)"
                : "(High Risk)"}
        </Popup>
      </Marker>

      {outbreaks.map((o) => (
        <Marker
          key={o.id}
          position={[o.lat, o.lon]}
          icon={o.severity === "high" ? icons.high : icons.med}
        >
          <Popup>
            <strong>Reported: {o.disease[lang]}</strong>
            <br />
            Distance: {o.distanceKm} km away
            <br />
            Reported: {o.hoursAgo} hours ago
            <br />
            Outbreak Severity: {o.severity === "high" ? "High" : "Moderate"}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
