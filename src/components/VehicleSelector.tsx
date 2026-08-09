import React from 'react';
import { VehicleId, VehicleOption } from '../types';
import { Bike, Car, Truck, Check } from 'lucide-react';

interface VehicleSelectorProps {
  vehicles: VehicleOption[];
  selectedVehicle: VehicleId | null;
  onSelectVehicle: (id: VehicleId) => void;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  vehicles,
  selectedVehicle,
  onSelectVehicle,
}) => {
  return (
    <section className="mb-8" id="section-vehicles">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-800">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs">
          1
        </span>
        <h2 className="text-lg font-bold text-white tracking-wide">
          Escolha o Tipo do seu Veículo
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="vehicle-group">
        {vehicles.map((v) => {
          const isSelected = selectedVehicle === v.id;
          return (
            <button
              key={v.id}
              type="button"
              id={`vehicle-opt-${v.id}`}
              onClick={() => onSelectVehicle(v.id)}
              className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-start justify-between gap-3 ${
                isSelected
                  ? 'border-cyan-400 bg-gradient-to-r from-cyan-950/70 to-[#1a2f38] shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                  : 'border-gray-800 bg-[#1d1d22] hover:border-gray-700 hover:bg-[#23232a]'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl select-none" role="img" aria-label={v.name}>
                  {v.badgeText}
                </span>
                <div>
                  <div className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    {v.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 leading-snug">
                    {v.description}
                  </div>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-500 text-black'
                    : 'border-gray-700 bg-gray-800/50'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
