
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { dressService, DressOption } from '../services/dressService';
import { toast } from 'sonner';
import { ScrollArea } from './ui/scroll-area';

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
        console.log('Loaded dress options:', options);
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
      <ScrollArea className="h-80">
        <div className="grid grid-cols-4 lg:grid-cols-5 gap-2 p-1">
          {[...Array(12)].map((_, index) => (
            <div
              key={index}
              className="aspect-[3/4] bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </ScrollArea>
    );
  }

  // Show message if no dress options available
  if (dressOptions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No dress options available. Please upload dress images first.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-80">
      <div className="grid grid-cols-4 lg:grid-cols-5 gap-2 p-1">
        {dressOptions.map((dress) => (
          <div
            key={dress.id}
            onClick={() => onSelect(dress.image_url)}
            className={cn(
              'relative cursor-pointer rounded-lg overflow-hidden group transition-all duration-200',
              selectedDress === dress.image_url
                ? 'ring-2 ring-[#E799AA] ring-offset-1'
                : 'hover:ring-2 hover:ring-[#E799AA]/50 hover:ring-offset-1'
            )}
          >
            <div className="aspect-[3/4] overflow-hidden">
              <img
                src={dress.image_url}
                alt={dress.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  console.error('Failed to load dress image:', dress.image_url);
                  // Show placeholder or fallback image
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI2NyIgdmlld0JveD0iMCAwIDIwMCAyNjciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjY3IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTMzLjVMMTAwIDEzMy41WiIgc3Ryb2tlPSIjOUI5QkEwIiBzdHJva2Utd2lkdGg9IjIiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4OCIgeT0iMTIxLjUiPgo8cGF0aCBkPSJNMTggMTNWMTlBMiAyIDAgMCAxIDE2IDIxSDVBMiAyIDAgMCAxIDMgMTlWOEEyIDIgMCAwIDEgNSA2SDEwTTE0IDNIMTdMOSAxMUwxMSAxM0wxOSA1VjgiIHN0cm9rZT0iIzlCOUJBMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cjwvc3ZnPgo=';
                }}
                onLoad={() => {
                  console.log('Successfully loaded dress image:', dress.image_url);
                }}
              />
            </div>
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="absolute bottom-1 left-1 right-1">
                <p className="text-white text-xs font-medium truncate">
                  {dress.name}
                </p>
              </div>
            </div>
            
            {/* Selected indicator */}
            {selectedDress === dress.image_url && (
              <div className="absolute top-1 right-1 w-4 h-4 bg-[#E799AA] rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
