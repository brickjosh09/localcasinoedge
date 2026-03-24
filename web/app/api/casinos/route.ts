import { NextResponse } from 'next/server';

const CASINOS = [
  {
    id: "treasure_bay",
    name: "Treasure Bay Biloxi",
    url: "https://bettreasurebay.com",
    status: "active",
    platform: "IGT PlayDigital",
    location: "Biloxi, MS",
  },
  {
    id: "palace_casino",
    name: "Palace Casino Resort",
    url: "https://sportsbook.palacecasinoresort.com",
    status: "active",
    platform: "IGT PlayDigital",
    location: "Biloxi, MS",
  },
  {
    id: "boomtown_biloxi",
    name: "Boomtown Biloxi",
    url: null,
    status: "unavailable",
    platform: "In-person only",
    location: "Biloxi, MS",
  },
  {
    id: "golden_nugget_biloxi",
    name: "Golden Nugget Biloxi",
    url: null,
    status: "coming_soon",
    platform: null,
    location: "Biloxi, MS",
  },
  {
    id: "hard_rock_biloxi",
    name: "Hard Rock Hotel & Casino Biloxi",
    url: null,
    status: "coming_soon",
    platform: null,
    location: "Biloxi, MS",
  },
  {
    id: "ip_casino_biloxi",
    name: "IP Casino Resort Spa",
    url: null,
    status: "coming_soon",
    platform: null,
    location: "Biloxi, MS",
  },
  {
    id: "island_view",
    name: "Island View Casino",
    url: null,
    status: "coming_soon",
    platform: null,
    location: "Gulfport, MS",
  },
  {
    id: "scarlet_pearl",
    name: "Scarlet Pearl Casino Resort",
    url: null,
    status: "coming_soon",
    platform: null,
    location: "D'Iberville, MS",
  },
  {
    id: "silver_slipper",
    name: "Silver Slipper Casino",
    url: null,
    status: "coming_soon",
    platform: null,
    location: "Bay St. Louis, MS",
  },
  {
    id: "beau_rivage",
    name: "Beau Rivage Resort & Casino",
    url: null,
    status: "coming_soon",
    platform: null,
    location: "Biloxi, MS",
  },
];

export const revalidate = 3600;

export async function GET() {
  return NextResponse.json(CASINOS);
}
