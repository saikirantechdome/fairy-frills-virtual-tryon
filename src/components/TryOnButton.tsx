
import { Button } from './ui/button';
import { Sparkles } from 'lucide-react';

interface TryOnButtonProps {
  onClick: () => void;
  disabled: boolean;
  isProcessing: boolean;
}

export const TryOnButton = ({ onClick, disabled, isProcessing }: TryOnButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isProcessing}
      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 shadow-lg hover:shadow-xl transition-all duration-200"
    >
      {isProcessing ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          Processing...
        </>
      ) : (
        <>
          <Sparkles className="w-5 h-5 mr-2" />
          Try On
        </>
      )}
    </Button>
  );
};
