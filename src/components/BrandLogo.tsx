import React, { useState, useEffect } from 'react';

interface BrandLogoProps {
  brand: string;
  className?: string;
  showFallbackText?: boolean;
}

export default function BrandLogo({ brand, className = "h-8 object-contain", showFallbackText = true }: BrandLogoProps) {
  // Normalize brand name
  const isAntam = brand.toLowerCase().includes('antam');
  const isUbs = brand.toLowerCase().includes('ubs');

  const getInitialSrc = () => {
    if (isAntam) {
      return 'https://www.logammulia.com/themes/default/images/logo-lm.png';
    }
    if (isUbs) {
      return 'https://ubsgold.com/assets/images/logo.png';
    }
    return '';
  };

  const [src, setSrc] = useState<string>(getInitialSrc);
  const [failed, setFailed] = useState<boolean>(false);

  useEffect(() => {
    setFailed(false);
    setSrc(getInitialSrc());
  }, [brand, isAntam, isUbs]);

  const handleImageError = () => {
    if (isAntam && src !== 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Logo_PT_Aneka_Tambang_Tbk.svg') {
      setSrc('https://upload.wikimedia.org/wikipedia/commons/e/e0/Logo_PT_Aneka_Tambang_Tbk.svg');
    } else if (isUbs && src !== 'https://centralparkjakarta.com/wp-content/uploads/2019/11/logo_ubs_gold.jpg') {
      setSrc('https://centralparkjakarta.com/wp-content/uploads/2019/11/logo_ubs_gold.jpg');
    } else {
      setFailed(true);
    }
  };

  if (failed || !src || (!isAntam && !isUbs)) {
    if (!showFallbackText) return null;
    return (
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#b68c5b] bg-[#b68c5b]/10 px-2 py-0.5 rounded">
        {brand}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={brand}
      referrerPolicy="no-referrer"
      onError={handleImageError}
      className={`${className} transition-all duration-300`}
    />
  );
}
