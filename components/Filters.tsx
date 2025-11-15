'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Area } from '@/lib/directus';

interface FiltersProps {
  areas: Area[];
}

export default function Filters({ areas }: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchName, setSearchName] = useState(searchParams.get('search') || '');
  const [selectedPlace, setSelectedPlace] = useState(searchParams.get('place') || '');
  const [selectedArea, setSelectedArea] = useState(searchParams.get('area') || '');
  const [selectedLevel, setSelectedLevel] = useState(searchParams.get('level') || '');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Нивои власти
  const levels = [
    { value: '', label: 'Сви нивои' },
    { value: 'local', label: 'Локална' },
    { value: 'province', label: 'Покрајинска' },
    { value: 'state', label: 'Државна' },
  ];

  // Места - за сада хардкодирано, касније може из Directus-а
  const places = [
    { value: '', label: 'Сва места' },
    { value: 'beograd', label: 'Београд' },
    { value: 'novi-sad', label: 'Нови Сад' },
    { value: 'nis', label: 'Ниш' },
    { value: 'kragujevac', label: 'Крагујевац' },
  ];

  const updateURL = (search: string, place: string, area: string, level: string) => {
    const params = new URLSearchParams();
    
    if (search) params.set('search', search);
    if (place) params.set('place', place);
    if (area) params.set('area', area);
    if (level) params.set('level', level);
    
    // Ресетуј страну на 1 када се мењају филтери
    params.set('page', '1');
    
    router.push(`/?${params.toString()}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchName(value);
    
    // Очисти претходни тајмер
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Дебаунс за претрагу по имену
    searchTimeoutRef.current = setTimeout(() => {
      updateURL(value, selectedPlace, selectedArea, selectedLevel);
    }, 500);
  };

  const handlePlaceChange = (value: string) => {
    setSelectedPlace(value);
    updateURL(searchName, value, selectedArea, selectedLevel);
  };

  const handleAreaChange = (value: string) => {
    setSelectedArea(value);
    updateURL(searchName, selectedPlace, value, selectedLevel);
  };

  const handleLevelChange = (value: string) => {
    setSelectedLevel(value);
    updateURL(searchName, selectedPlace, selectedArea, value);
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-gray-50 rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Филтрирај резултате</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Претрага по имену */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchName}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Претрага по имену..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {/* Dropdown за места */}
        <select
          value={selectedPlace}
          onChange={(e) => handlePlaceChange(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
        >
          {places.map((place) => (
            <option key={place.value} value={place.value}>
              {place.label}
            </option>
          ))}
        </select>

        {/* Dropdown за области */}
        <select
          value={selectedArea}
          onChange={(e) => handleAreaChange(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
        >
          <option value="">Све области</option>
          {areas.map((area) => (
            <option key={area.id} value={area.slug}>
              {area.name}
            </option>
          ))}
        </select>

        {/* Dropdown за нивое */}
        <select
          value={selectedLevel}
          onChange={(e) => handleLevelChange(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
        >
          {levels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
