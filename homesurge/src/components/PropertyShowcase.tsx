import { motion } from 'framer-motion'

const properties = [
  { id: 1, color: 'cyan' },
  { id: 2, color: 'violet' },
]

export function PropertyShowcase() {
  const cycleTime = 5
  
  return (
    <div className="relative h-full w-full flex items-center justify-center">
      {properties.map((p, houseIdx) => {
        const start = houseIdx * (cycleTime / 3)
        
        return (
          <div 
            key={p.id} 
            className="absolute flex flex-col items-center"
            style={{ marginLeft: houseIdx === 0 ? '-80px' : houseIdx === 2 ? '80px' : '0px' }}
          >
            <motion.div
              className={`w-32 h-12 mb-1`}
              initial={{ y: -40, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.8] }}
              transition={{ 
                duration: cycleTime,
                delay: start,
                times: [0, 0.1, 0.9, 1],
                repeat: Infinity,
                ease: 'easeOut',
              }}
            >
              <div className={`w-full h-full ${p.color === 'cyan' ? 'bg-gradient-to-b from-cyan-300 to-cyan-600' : p.color === 'violet' ? 'bg-gradient-to-b from-violet-300 to-violet-600' : 'bg-gradient-to-b from-amber-300 to-amber-600'}`}
                style={{ clipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)' }}
              />
            </motion.div>
            
            <div className="flex flex-wrap w-32 gap-1">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex gap-1 w-full justify-center">
                  {[0, 1, 2].map((brick) => (
                    <motion.div
                      key={brick}
                      className={`w-8 h-4 rounded-sm ${p.color === 'cyan' ? 'bg-cyan-400' : p.color === 'violet' ? 'bg-violet-400' : 'bg-amber-400'}`}
                      initial={{ y: -60, opacity: 0 }}
                      animate={{ y: [null, 0, 0, -60], opacity: [0, 1, 1, 0] }}
                      transition={{ 
                        duration: cycleTime,
                        delay: start + 0.4 + row * 0.25 + brick * 0.08,
                        times: [0, 0.1, 0.9, 1],
                        repeat: Infinity,
                        ease: 'easeOut',
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
            
            <motion.div 
              className={`w-32 h-3 rounded-sm ${p.color === 'cyan' ? 'bg-cyan-800' : p.color === 'violet' ? 'bg-violet-800' : 'bg-amber-800'}`}
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: [null, 0, 0, -60], opacity: [0, 1, 1, 0] }}
              transition={{ 
                duration: cycleTime,
                delay: start + 1.4,
                times: [0, 0.1, 0.9, 1],
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
            
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center whitespace-nowrap opacity-60">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mb-1 ${p.color === 'cyan' ? 'text-cyan-300' : p.color === 'violet' ? 'text-violet-300' : 'text-amber-300'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
            </div>
          </div>
        )
      })}
    </div>
  )
}