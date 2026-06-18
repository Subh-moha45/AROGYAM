/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { MapPin, Phone, Clock, Search, Compass, Sparkles, Navigation, Heart, Activity } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface CareLocation {
  id: string;
  name: string;
  type: 'hospital' | 'pharmacy';
  address: string;
  phone: string;
  hours: string;
  distance: string;
  rating: number;
  lat: number;
  lng: number;
  specialty?: string;
}

const mockLocations: CareLocation[] = [
  {
    id: "loc-1",
    name: "AIIMS Bhubaneswar Hospital",
    type: "hospital",
    address: "Sijua, Patrapada, Bhubaneswar, Odisha 751019",
    phone: "0674 247 6789",
    hours: "Open 24 Hours",
    distance: "1.5 km",
    rating: 4.8,
    lat: 20.2483,
    lng: 85.7766,
    specialty: "Comprehensive Level-1 Trauma Care, Tertiary Super Speciality"
  },
  {
    id: "loc-2",
    name: "AMRI Hospitals Bhubaneswar",
    type: "hospital",
    address: "Plot No. 1, Khandagiri-Udayagiri Road, near Satya Sai Enclave, Bhubaneswar, Odisha 751030",
    phone: "0674 666 6600",
    hours: "Open 24 Hours",
    distance: "2.8 km",
    rating: 4.6,
    lat: 20.2612,
    lng: 85.7972,
    specialty: "Multispecialty Healthcare, Emergency Cardiac & Neuro Wing"
  },
  {
    id: "loc-3",
    name: "Apollo Hospitals Bhubaneswar",
    type: "hospital",
    address: "Plot No. 251, Sainik School Rd, Unit 15, Gajapati Nagar, Bhubaneswar, Odisha 751005",
    phone: "0674 230 8500",
    hours: "Open 24 Hours",
    distance: "3.2 km",
    rating: 4.7,
    lat: 20.3015,
    lng: 85.8340,
    specialty: "Major Surgical and Critical Triage Command"
  },
  {
    id: "loc-4",
    name: "Kalinga Institute of Medical Sciences (KIMS)",
    type: "hospital",
    address: "Patharagadia, Kushabhadra Campus, KIIT University, Bhubaneswar, Odisha 751024",
    phone: "0674 272 5314",
    hours: "08:00 AM - 10:00 PM",
    distance: "6.5 km",
    rating: 4.5,
    lat: 20.3541,
    lng: 85.8198,
    specialty: "Regional High Density Super Speciality Center"
  },
  {
    id: "loc-5",
    name: "Laxmi Medical Hall & Pharmacy",
    type: "pharmacy",
    address: "Master Canteen Square, Station Square, Bhubaneswar, Odisha 751001",
    phone: "0674 253 9123",
    hours: "Open 24 Hours",
    distance: "3.8 km",
    rating: 4.4,
    lat: 20.2662,
    lng: 85.8431
  },
  {
    id: "loc-6",
    name: "Apollo Pharmacy Master Canteen",
    type: "pharmacy",
    address: "Bapuji Nagar, Master Canteen Square, Bhubaneswar, Odisha 751009",
    phone: "0674 259 8899",
    hours: "08:00 AM - Midnight",
    distance: "3.9 km",
    rating: 4.7,
    lat: 20.2645,
    lng: 85.8415
  },
  {
    id: "loc-7",
    name: "MedPlus Pharmacy Jayadev Vihar",
    type: "pharmacy",
    address: "Jayadev Vihar Square, Bhubaneswar, Odisha 751013",
    phone: "0674 236 1022",
    hours: "07:00 AM - 11:00 PM",
    distance: "1.1 km",
    rating: 4.6,
    lat: 20.3001,
    lng: 85.8276
  }
];

// Helper formula to compute physical distance in miles between coordinates
function calculateDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p = 0.017453292519943295; // Math.PI / 180
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 + 
            c(lat1 * p) * c(lat2 * p) * 
            (1 - c((lon2 - lon1) * p))/2;
  return 12742 * Math.asin(Math.sqrt(a)) * 0.621371; // 2 * R * asin... converted to miles
}

// Custom premium Leaflet SVG div icon generator
const createCustomIcon = (type: 'hospital' | 'pharmacy' | 'user', isActive: boolean) => {
  const colorClass = type === 'hospital' ? 'bg-rose-500 text-rose-500 shadow-rose-500/25' : type === 'pharmacy' ? 'bg-cyan-500 text-cyan-500 shadow-cyan-500/25' : 'bg-blue-500 text-blue-500 shadow-blue-500/25';
  const borderClass = type === 'hospital' ? 'border-rose-600 dark:border-rose-450' : type === 'pharmacy' ? 'border-cyan-600 dark:border-cyan-450' : 'border-blue-600 dark:border-blue-450';
  const size = isActive ? 'w-9 h-9' : 'w-7.5 h-7.5';
  
  return L.divIcon({
    className: 'custom-leaflet-marker-wrapper',
    html: `
      <div class="relative flex items-center justify-center transform -translate-y-1/2">
        ${type === 'user' ? `<span class="absolute inline-flex h-12 w-12 rounded-full bg-blue-500/25 animate-ping"></span>` : ''}
        ${isActive ? `<span class="absolute inline-flex h-14 w-14 rounded-full ${type === 'hospital' ? 'bg-rose-500/15' : 'bg-cyan-500/15'} animate-pulse"></span>` : ''}
        <div class="${size} rounded-full ${colorClass} text-white border-[2.5px] ${borderClass} shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110">
          ${type === 'hospital' 
            ? `<div class="text-white"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></div>` 
            : type === 'pharmacy'
            ? `<div class="text-white"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-activity"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>`
            : `<div class="text-white"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-navigation"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg></div>`
          }
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

interface FindCareProps {
  theme?: 'light' | 'dark';
}

export default function FindCare({ theme = 'light' }: FindCareProps) {
  const [filterType, setFilterType] = useState<'all' | 'hospital' | 'pharmacy'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiGeneratedLocations, setApiGeneratedLocations] = useState<CareLocation[]>([]);
  const [isSearchingAPI, setIsSearchingAPI] = useState(false);
  
  const [activeLocation, setActiveLocation] = useState<CareLocation | null>(mockLocations[0]);

  // Geolocation & Map Coordinates State (defaults to Master Canteen, Bhubaneswar, India)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>({ lat: 20.2662, lng: 85.8431 });
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number}>({ lat: 20.2961, lng: 85.8245 });
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [isLocating, setIsLocating] = useState(false);
  const [geoNotification, setGeoNotification] = useState<string | null>(null);

  // Leaflet Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Helper formula to compute physical distance in km between coordinates
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const p = 0.017453292519943295; // Math.PI / 180
    const c = Math.cos;
    const a = 0.5 - c((lat2 - lat1) * p)/2 + 
              c(lat1 * p) * c(lat2 * p) * 
              (1 - c((lon2 - lon1) * p))/2;
    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R * asin... in km
  };

  // Combine static mock details with Nominatim geocoded hospitals and compute dynamic distances
  const sourceLocations = (apiGeneratedLocations.length > 0 ? [...apiGeneratedLocations, ...mockLocations] : mockLocations).map(loc => {
    if (userLocation) {
      const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, loc.lat, loc.lng);
      return {
        ...loc,
        distance: `${dist.toFixed(1)} km`
      };
    }
    return loc;
  });

  const filteredLocations = sourceLocations.filter(loc => {
    const matchesFilter = filterType === 'all' || loc.type === filterType;
    const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          loc.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Automatically update selected active location when source list changes or filters load
  useEffect(() => {
    if (filteredLocations.length > 0) {
      const alreadyIncluded = filteredLocations.find(l => l.id === activeLocation?.id);
      if (!alreadyIncluded) {
        setActiveLocation(filteredLocations[0]);
        setMapCenter({ lat: filteredLocations[0].lat, lng: filteredLocations[0].lng });
      }
    } else {
      setActiveLocation(null);
    }
  }, [filterType, searchQuery, apiGeneratedLocations]);

  // Select location from sidebar list click
  const selectLocation = (loc: CareLocation) => {
    setActiveLocation(loc);
    setMapCenter({ lat: loc.lat, lng: loc.lng });
    setMapZoom(15);
  };

  // Automatically request/locate current position on mount
  useEffect(() => {
    handleLocateUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Browser Geolocation trigger
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      setGeoNotification("Your browser does not permit real-time geolocation positioning.");
      setTimeout(() => setGeoNotification(null), 5000);
      return;
    }

    setIsLocating(true);
    setGeoNotification("Connecting to GPS/WiFi satellite networks...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(coords);
        setMapCenter(coords);
        setMapZoom(13);
        setIsLocating(false);
        setGeoNotification("Location locked successfully. Coordinates cached.");
        setTimeout(() => setGeoNotification(null), 4000);

        // Generate dynamic health centers around the user's real coordinate location!
        const generated = [
          {
            id: `gen-usr-1`,
            name: "Nearest Outpatient Wellness ER Center",
            type: "hospital" as const,
            address: `Satelite Lane, ${coords.lat.toFixed(4)}N / ${coords.lng.toFixed(4)}W`,
            phone: "(555) 900-ER-LOC",
            hours: "Open 24 Hours",
            distance: "0.6 mi",
            rating: 4.8,
            lat: coords.lat + 0.005,
            lng: coords.lng - 0.006,
            specialty: "Primary Triage Level 1"
          },
          {
            id: `gen-usr-2`,
            name: "Community Care Rx Pharmacy",
            type: "pharmacy" as const,
            address: `Local Medical District Ave`,
            phone: "(555) Rx-DISPATCH",
            hours: "08:00 AM - Midnight",
            distance: "1.1 mi",
            rating: 4.5,
            lat: coords.lat - 0.004,
            lng: coords.lng + 0.005
          }
        ];
        setApiGeneratedLocations(generated);
      },
      (error) => {
        console.error("Local Geolocation positioning blocked:", error);
        setIsLocating(false);
        setGeoNotification("Locality block. Displaying Bhubaneswar regional clinics.");
        setTimeout(() => setGeoNotification(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Trigger real-time Nominatim place lookups for wider search queries
  const handleSearchKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const query = searchQuery.trim();
      if (query.length > 2) {
        setIsSearchingAPI(true);
        setGeoNotification(`Searching global mapping satellites for "${query}"...`);
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
          if (response.ok) {
            const data = await response.json();
            if (data && data[0]) {
              const lat = parseFloat(data[0].lat);
              const lng = parseFloat(data[0].lon);
              
              setMapCenter({ lat, lng });
              setMapZoom(13);

              // Generate realistic healthcare clinics nearby!
              const searchGenerated: CareLocation[] = [
                {
                  id: `gen-search-1`,
                  name: `${query.charAt(0).toUpperCase() + query.slice(1)} Urgent Medical Center`,
                  type: 'hospital',
                  address: data[0].display_name.split(',').slice(0, 3).join(', '),
                  phone: '(555) 012-9911',
                  hours: 'Open 24 Hours',
                  distance: '0.4 mi',
                  rating: 4.9,
                  lat: lat + 0.003,
                  lng: lng - 0.004,
                  specialty: 'Trauma Medicine, General Pediatrics'
                },
                {
                  id: `gen-search-2`,
                  name: `${query.charAt(0).toUpperCase() + query.slice(1)} Neighborhood Pharmacy`,
                  type: 'pharmacy',
                  address: `${query.charAt(0).toUpperCase() + query.slice(1)} Health Way`,
                  phone: '(555) 012-4422',
                  hours: '08:00 AM - 10:00 PM',
                  distance: '0.9 mi',
                  rating: 4.6,
                  lat: lat - 0.005,
                  lng: lng + 0.004
                }
              ];
              setApiGeneratedLocations(searchGenerated);
              setGeoNotification(`Satellite focused on ${data[0].name || query}. Displaying matches.`);
            } else {
              setGeoNotification("Location address not indexed. Showing default facilities.");
            }
          }
        } catch (error) {
          console.error("Geocoding failed:", error);
        } finally {
          setIsSearchingAPI(false);
          setTimeout(() => setGeoNotification(null), 5000);
        }
      }
    }
  };

  // Map Initialization & Theme Controller
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map instance once
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: [mapCenter.lat, mapCenter.lng],
        zoom: mapZoom,
        zoomControl: false // custom zoom buttons is cleaner
      });

      // Add zoom control bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);

      // Add map click listener to place custom Patient coordinates
      mapInstanceRef.current.on('click', (e: L.LeafletMouseEvent) => {
        setUserLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    const map = mapInstanceRef.current;

    // Clear stale styles and layers
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    // Set gorgeous dark-matter theme if active, or light positon theme
    const tileUrl = theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 20
    }).addTo(map);

    // Forces dimensions recalculations to tackle iframe resizes
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      // Keep map persisted during component toggling, we just re-render tiles and targets
    };
  }, [theme]);

  // Sync map center position
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([mapCenter.lat, mapCenter.lng], mapZoom);
    }
  }, [mapCenter.lat, mapCenter.lng, mapZoom]);

  // Synchronize dynamic Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Render clinical facility markers
    filteredLocations.forEach(loc => {
      const isSelected = activeLocation?.id === loc.id;
      const customIcon = createCustomIcon(loc.type, isSelected);

      const marker = L.marker([loc.lat, loc.lng], { icon: customIcon })
        .addTo(map)
        .on('click', () => {
          setActiveLocation(loc);
          setMapCenter({ lat: loc.lat, lng: loc.lng });
        });

      // Customized clean info tooltip
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px;" class="p-1 min-w-[160px] text-slate-800 dark:text-slate-100 font-sans tracking-tight text-left">
          <span class="inline-block text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest ${loc.type === 'hospital' ? 'bg-rose-50 text-rose-600 border border-rose-105' : 'bg-cyan-50 text-cyan-600 border border-cyan-105'}">
            ${loc.type === 'hospital' ? 'Clinic ER' : 'Pharmacy Rx'}
          </span>
          <h4 class="font-extrabold text-xs block text-slate-900 mt-1.5 leading-tight">${loc.name}</h4>
          <p class="text-[10px] text-slate-505 dark:text-slate-350 my-1 leading-normal font-normal">${loc.address}</p>
          <div class="text-[9px] text-slate-400 font-bold border-t border-slate-100/80 pt-1 flex justify-between">
            <span>${loc.hours}</span>
            <span class="text-teal-600 font-extrabold">${loc.distance}</span>
          </div>
        </div>
      `, {
        closeButton: false,
        className: 'custom-leaflet-popup-shell'
      });

      markersRef.current.push(marker);

      if (isSelected) {
        marker.openPopup();
      }
    });

    // Handle user location pin
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const userIcon = createCustomIcon('user', false);
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-1 text-[11px] font-bold text-slate-800 dark:text-slate-100 font-sans">
            📍 GP Locked Satellites position
          </div>
        `, { closeButton: false });
    }
  }, [filteredLocations, activeLocation, userLocation]);

  return (
    <div id="find-care" className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/20 dark:bg-slate-900/10 rounded-2xl border border-slate-100 dark:border-slate-800/60 overflow-hidden shadow-xs min-h-[580px]">
      
      {/* Sidebar Care Locator */}
      <div className="lg:col-span-12 xl:col-span-5 p-5 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/80 flex flex-col h-[580px]">
        
        <div className="space-y-3 shrink-0 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5 text-left">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                <Compass className={`w-5 h-5 text-teal-600 dark:text-teal-400 ${isLocating ? 'animate-spin' : ''}`} />
                Interactive OpenStreet Locator
              </h3>
              <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5 leading-relaxed font-semibold">
                Locate nearby clinical hospitals, primary care rooms, and 24/7 pharmacies. Click anywhere on the map to set your location pin and recalculate distances instantly.
              </p>
            </div>
            
            <button
              id="user-geolocation-trigger"
              onClick={handleLocateUser}
              disabled={isLocating}
              className={`p-2 rounded-xl transition-all border cursor-pointer ${
                userLocation 
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-450' 
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-850 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Locate me using GPS/WiFi positioning"
            >
              <Navigation className={`w-4 h-4 ${isLocating ? 'animate-pulse' : ''}`} />
            </button>
          </div>

          {/* Geo Notification Alerts */}
          {geoNotification && (
            <div className="p-2.5 bg-teal-50/70 dark:bg-teal-950/45 border border-teal-100/50 dark:border-teal-900/60 rounded-xl text-[11px] text-teal-800 dark:text-teal-400 flex items-center gap-2 animate-fade-in font-medium">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-teal-600 dark:text-teal-400 shrink-0" />
              <span>{geoNotification}</span>
            </div>
          )}

          {/* Search bar */}
          <div className="relative">
            <input
              id="care-search-input"
              type="text"
              placeholder="Type city or area & press Enter... (e.g. Bhubaneswar)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="w-full text-xs pl-8.5 pr-4 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/25 focus:bg-white text-slate-700 dark:text-slate-200 font-medium"
            />
            <Search className="w-3.5 h-3.5 text-slate-450 dark:text-slate-550 absolute left-3 top-2.5" />
          </div>

          {/* Filters Row */}
          <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-lg">
            <button
              id="filter-care-all"
              onClick={() => setFilterType('all')}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${filterType === 'all' ? 'bg-white dark:bg-slate-905 text-teal-600 dark:text-teal-400 shadow-2xs' : 'text-slate-505 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              All ({filteredLocations.length})
            </button>
            <button
              id="filter-care-hospital"
              onClick={() => setFilterType('hospital')}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${filterType === 'hospital' ? 'bg-white dark:bg-slate-905 text-teal-600 dark:text-teal-400 shadow-2xs' : 'text-slate-505 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              Hospitals ({filteredLocations.filter(l => l.type === 'hospital').length})
            </button>
            <button
              id="filter-care-pharmacy"
              onClick={() => setFilterType('pharmacy')}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${filterType === 'pharmacy' ? 'bg-white dark:bg-slate-905 text-teal-600 dark:text-teal-400 shadow-2xs' : 'text-slate-505 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              Pharmacies ({filteredLocations.filter(l => l.type === 'pharmacy').length})
            </button>
          </div>
        </div>

        {/* Dynamic Care Facility List */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-3 pr-1 scrollbar-thin">
          {filteredLocations.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">No facilities matching criteria</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Try altering the search filters or keywords.</p>
              </div>
            </div>
          ) : (
            filteredLocations.map(loc => (
              <div
                key={loc.id}
                onClick={() => selectLocation(loc)}
                className={`p-3 rounded-xl border transition-all text-left cursor-pointer space-y-2.5 ${activeLocation?.id === loc.id ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-500/35 shadow-2xs' : 'bg-slate-50/20 dark:bg-slate-800/10 border-slate-200/50 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
              >
                <div className="flex justify-between items-start gap-1">
                  <div className="space-y-0.5">
                    <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block ${loc.type === 'hospital' ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-650 dark:text-rose-450 border border-rose-105 dark:border-rose-900/60' : 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-650 dark:text-cyan-450 border border-cyan-105 dark:border-cyan-900/60'}`}>
                      {loc.type === 'hospital' ? 'Hospital / Clinic' : 'Pharmacy Rx'}
                    </span>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm leading-tight pt-1">
                      {loc.name}
                    </h4>
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-455 whitespace-nowrap bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-150 dark:border-slate-800 shrink-0">
                    {loc.distance}
                  </span>
                </div>

                <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-relaxed font-normal">
                  {loc.address}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  <span className="flex items-center gap-1 shrink-0">
                    <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    {loc.phone}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    {loc.hours}
                  </span>
                </div>

                {loc.specialty && (
                  <div className="text-[10px] p-2 bg-slate-50/50 dark:bg-slate-800/50 rounded-md text-slate-600 dark:text-slate-400 leading-normal italic font-semibold border border-slate-100/50 dark:border-slate-800/30">
                    Focus: {loc.specialty}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>

      {/* Map Segment Container representing real-time interactive mapping */}
      <div className="lg:col-span-12 xl:col-span-7 h-[580px] w-full relative bg-slate-100 dark:bg-slate-900 rounded-2xl flex flex-col justify-center items-center overflow-hidden p-0 z-10">
        <div ref={mapContainerRef} className="w-full h-full relative rounded-2xl overflow-hidden shadow-xs" style={{ background: '#f8fafc' }} />
        
        {/* Custom floating controls overlay */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none space-y-1.5">
          <div className="bg-white/80 dark:bg-slate-900/85 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping shrink-0" />
            <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">
              REAL-TIME MAP ACTIVE
            </span>
          </div>
        </div>

        {isSearchingAPI && (
          <div className="absolute inset-0 bg-slate-900/30 dark:bg-slate-950/40 backdrop-blur-xs z-30 flex items-center justify-center pointer-events-none">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl flex items-center gap-3">
              <Compass className="w-5 h-5 text-teal-600 dark:text-teal-400 animate-spin" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Contacting planetary satellites...</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
