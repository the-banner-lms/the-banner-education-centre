import Image from 'next/image'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[99990] flex flex-col items-center justify-center bg-[#f5f7fa]/60 backdrop-blur-sm w-screen h-[100dvh] font-sans transition-all duration-500">
      <div 
        className="relative flex items-center justify-center p-[3px] rounded-[44px] shadow-[0_20px_60px_rgba(15,102,48,0.2)]"
        style={{
          animation: 'floatLoader 3s ease-in-out infinite'
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes floatLoader {
            0%, 100% { transform: translateY(0) }
            50% { transform: translateY(-10px) }
          }
        `}} />
        
        {/* Border Mask to hide the center of the spinning gradient */}
        <div 
          className="absolute inset-0 rounded-[44px] overflow-hidden pointer-events-none"
          style={{
            padding: '3px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude'
          }}
        >
          {/* Neon Sign Orbiting Tail (Conic Gradient) */}
          <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 animate-[spin_1.5s_linear_infinite] bg-[conic-gradient(transparent_40%,#0f6630_80%,#8cd2ab_100%)]"></div>
        </div>

        {/* Windows 7 Aero Glass Card / Inner Container */}
        <div className="relative z-10 flex flex-col items-center text-center w-[280px] md:w-[340px] px-[25px] py-[30px] md:p-[40px] rounded-[42px] bg-white/40 backdrop-blur-xl border border-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
          
          <div className="flex justify-center mb-[30px]">
            <Image 
              src="/logo.png" 
              alt="Loading" 
              width={80} 
              height={80}
              className="object-contain rounded-3xl shadow-[0_10px_30px_rgba(15,102,48,0.2)] drop-shadow-md"
              priority
            />
          </div>
          
          <h2 className="text-[#0f6630] text-[22px] md:text-[28px] font-extrabold tracking-tight mb-[8px] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
            The Banner
          </h2>
          <p className="text-[#0f6630] uppercase tracking-[2px] text-[12px] font-bold mb-[20px] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
            Loading
          </p>
          <p className="text-gray-700 text-[12px] font-medium mt-[5px] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
            Please wait a moment...
          </p>
          
        </div>
      </div>
    </div>
  )
}

