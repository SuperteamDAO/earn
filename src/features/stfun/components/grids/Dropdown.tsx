'use client';

import { CaretDown } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

interface DropdownProps {
  countries: string[];
  selectedCountry: string;
  onSelectCountry: (country: string) => void;
}

export default function Dropdown({
  countries,
  selectedCountry,
  onSelectCountry,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div
      ref={dropdownRef}
      className="dropdown-container relative mx-auto mt-4 w-fit"
    >
      <button
        className="st-dropdown-button flex min-w-[200px] items-center justify-between gap-4 rounded-lg px-6 py-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-primary text-white">
          {selectedCountry || 'All Countries'}
        </span>
        <CaretDown
          size={16}
          color="white"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="st-dropdown-menu absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-lg">
          <button
            className="dropdown-item font-primary w-full px-6 py-3 text-left text-white hover:bg-white/10"
            onClick={() => {
              onSelectCountry('');
              setIsOpen(false);
            }}
          >
            All
          </button>
          {countries.map((country) => (
            <button
              key={country}
              className="dropdown-item font-primary w-full px-6 py-3 text-left text-white hover:bg-white/10"
              onClick={() => {
                onSelectCountry(country);
                setIsOpen(false);
              }}
            >
              {country}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
