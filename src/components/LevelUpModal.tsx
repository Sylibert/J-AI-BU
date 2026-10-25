import React, { useEffect, useState } from 'react';
import { Trophy, Award, Gem, Medal } from 'lucide-react';
import { TrophyTier } from './TrophiesView';

interface LevelUpModalProps {
  tier: TrophyTier | null;
  onClose: () => void;
}

export function LevelUpModal({ tier, onClose }: LevelUpModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (tier) {
      const raf = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => window.cancelAnimationFrame(raf);
    } else {
      setIsVisible(false);
    }
  }, [tier]);

  if (!tier) return null;

  const handleClose = () => {
    setIsVisible(false);
    window.setTimeout(() => {
      onClose();
    }, 220);
  };

  const renderModalIcon = (id: TrophyTier['id']) => {
    const iconClass =
      id === 'gold' || id === 'silver'
        ? 'w-11 h-11 text-[#111111] stroke-[2.2]'
        : 'w-11 h-11 text-white stroke-[2.2]';
    switch (id) {
      case 'bronze':
        return <Medal className={iconClass} />;
      case 'silver':
        return <Award className={iconClass} />;
      case 'gold':
        return <Trophy className={iconClass} />;
      case 'diamond':
        return <Gem className={iconClass} />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="levelup-modal-title"
      onClick={handleClose}
      style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/65 transition-opacity duration-250 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: isVisible ? 'scale(1)' : 'scale(0.8)',
          transition:
            'transform 0.36s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease-out',
        }}
        className="w-full max-w-[350px] rounded-[28px] bg-[#141417] text-[#F5F5F7] border border-white/12 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.65)] flex flex-col items-center text-center"
      >
        {/* Badge / icône du trophée qui pulse légèrement au centre avec une lueur dorée diffuse */}
        <div className="relative flex items-center justify-center mb-5 mt-1">
          <div
            className="absolute w-28 h-28 rounded-full blur-2xl animate-pulse pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(255,214,10,0.55) 0%, rgba(255,214,10,0) 72%)',
            }}
          />
          <div
            className={`relative w-20 h-20 rounded-[24px] flex items-center justify-center shadow-[0_0_32px_rgba(255,214,10,0.4)] ring-2 ring-[#FFD60A]/50 animate-pulse ${tier.badgeBg}`}
          >
            {renderModalIcon(tier.id)}
            <span className="absolute -bottom-2 -right-2 text-[22px] drop-shadow">
              {tier.emoji}
            </span>
          </div>
        </div>

        {/* Titre percutant en police Plus Jakarta Sans 800 */}
        <span
          id="levelup-modal-title"
          className="text-[12px] font-extrabold uppercase tracking-[1.8px] text-white/80 mb-1.5"
        >
          NOUVEAU NIVEAU DÉBLOQUÉ !
        </span>

        {/* Nom du rang obtenu en gros et en jaune */}
        <h2 className="text-[22px] font-extrabold text-[#FFD60A] leading-tight mb-2">
          {tier.fullTitle}
        </h2>

        {/* Sous-titre valorisant */}
        <p className="text-[13.5px] font-semibold text-white/75 leading-relaxed mb-6 px-2">
          {tier.targetDays} jours consignés ce mois-ci. Continue comme ça !
        </p>

        {/* Bouton d'action jaune vif */}
        <button
          type="button"
          onClick={handleClose}
          className="w-full h-[48px] rounded-[16px] bg-[#FFD60A] hover:bg-[#FFE033] active:scale-[0.97] text-[#111111] text-[15px] font-extrabold tracking-wide shadow-[0_8px_24px_rgba(255,214,10,0.35)] transition-all cursor-pointer"
        >
          C&apos;est parti
        </button>
      </div>
    </div>
  );
}
