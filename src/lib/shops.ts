import type { ProductCategory } from "./market";

export type Shop = {
  name: string;
  categories: ProductCategory[];
  distanceKm: number;
  phone: string;
  address: string;
  stock: string[];
  rating: number;
};

export const NEARBY_SHOPS: Shop[] = [
  {
    name: "Shree Krishna Agro Agency",
    categories: ["fungicide", "bio"],
    distanceKm: 1.8,
    phone: "+919822011234",
    address: "Market Yard Road, Baramati, Pune",
    stock: ["Mancozeb 75% WP", "Neem oil", "Sprayers"],
    rating: 4.7,
  },
  {
    name: "Kisan Seva Kendra",
    categories: ["bio", "nutrition"],
    distanceKm: 3.4,
    phone: "+919730055678",
    address: "Near Bus Stand, Indapur Road",
    stock: ["Bordeaux mixture", "Trichoderma", "Micronutrients"],
    rating: 4.5,
  },
  {
    name: "Green Field Fertilizers",
    categories: ["fungicide", "nutrition"],
    distanceKm: 6.1,
    phone: "+919011223344",
    address: "MIDC Gate No. 2, Phaltan",
    stock: ["Captan 50% WP", "Drip spares", "Bio-fertilizer"],
    rating: 4.2,
  },
  {
    name: "Annadata Krushi Bhandar",
    categories: ["fungicide"],
    distanceKm: 8.9,
    phone: "+919960778899",
    address: "Station Road, Malegaon Khurd",
    stock: ["Metalaxyl+Mancozeb", "Sulphur 80% WG", "PPE kits"],
    rating: 4.4,
  },
];
