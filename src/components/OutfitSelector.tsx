
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { dressService, DressOption } from '../services/dressService';
import { toast } from 'sonner';

interface OutfitSelectorProps {
  onSelect: (dressUrl: string) => void;
  selectedDress: string | null;
}

export const OutfitSelector = ({ onSelect, selectedDress }: OutfitSelectorProps) => {
  const [dressOptions, setDressOptions] = useState<DressOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDressOptions = async () => {
      try {
        setIsLoading(true);
        const options = await dressService.getDressOptions();
        console.log('Loaded dress options from database:', options);
        setDressOptions(options);
      } catch (error) {
        console.error('Failed to load dress options:', error);
        toast.error('Failed to load dress options');
      } finally {
        setIsLoading(false);
      }
    };

    loadDressOptions();
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[...Array(9)].map((_, index) => (
          <div
            key={index}
            className="aspect-[3/4] bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Show message if no dress options available
  if (dressOptions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No dress options available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {dressOptions.map((dress) => (
        <div
          key={dress.id}
          onClick={() => onSelect(dress.image_url)}
          className={cn(
            'relative cursor-pointer rounded-lg overflow-hidden group transition-all duration-200',
            selectedDress === dress.image_url
              ? 'ring-2 ring-[#E799AA] ring-offset-2'
              : 'hover:ring-2 hover:ring-[#E799AA]/50 hover:ring-offset-1'
          )}
        >
          <div className="aspect-[3/4] overflow-hidden">
            <img
              src={dress.image_url}
              alt={dress.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                console.error('Failed to load dress image from Supabase:', dress.image_url);
                // Fallback to a placeholder or hide the image
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-white text-xs font-medium truncate">
                {dress.name}
              </p>
            </div>
          </div>
          
          {/* Selected indicator */}
          {selectedDress === dress.image_url && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-[#E799AA] rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
