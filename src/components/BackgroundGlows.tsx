export default function BackgroundGlows() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* 1. Subtle, expensive architectural dotted pattern tinted in brand royal violet */}
      <div 
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(rgba(107, 70, 193, 0.07) 1.2px, transparent 1.2px)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* 2. Brand Ambient Blooms: Rich Royal Violet, Vivid Purple & Glow Accents */}
      {/* Rich royal violet bloom top right */}
      <div 
        className="absolute -top-36 right-[-80px] w-[560px] h-[560px] bg-gradient-to-bl from-[#6B46C1]/[0.08] via-[#7C3AED]/[0.04] to-transparent rounded-full blur-[110px]" 
      />

      {/* Radiant violet bloom top left */}
      <div 
        className="absolute top-1/4 left-[-120px] w-[600px] h-[600px] bg-gradient-to-tr from-[#7C3AED]/[0.06] via-[#9F7AEA]/[0.03] to-transparent rounded-full blur-[130px]" 
      />

      {/* Soft royal deep radiance bottom center */}
      <div 
        className="absolute -bottom-36 right-1/4 w-[640px] h-[480px] bg-gradient-to-t from-[#5521B5]/[0.06] via-[#6B46C1]/[0.03] to-transparent rounded-full blur-[120px]" 
      />
    </div>
  );
}
