import React from 'react'

const Logo = ({ className = '', showText = true, textColor = 'black' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Location Pin Icon */}
      <div className="relative flex-shrink-0">
        {/* Main pin body */}
        <svg
          width="32"
          height="40"
          viewBox="0 0 32 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          {/* Pin body */}
          <path
            d="M16 0C10.477 0 6 4.477 6 10C6 17 16 32 16 32C16 32 26 17 26 10C26 4.477 21.523 0 16 0Z"
            fill="#F97316"
          />
          {/* White highlight circle */}
          <circle cx="16" cy="12" r="4" fill="white" fillOpacity="0.9" />
          {/* Black dot at bottom */}
          <circle cx="16" cy="30" r="2" fill="#000000" />
          {/* Outer ring 1 */}
          <circle
            cx="16"
            cy="30"
            r="4"
            fill="none"
            stroke="#F97316"
            strokeWidth="1.5"
            opacity="0.6"
          />
          {/* Outer ring 2 */}
          <circle
            cx="16"
            cy="30"
            r="6"
            fill="none"
            stroke="#F97316"
            strokeWidth="1.5"
            opacity="0.4"
          />
          {/* Outer ring 3 */}
          <circle
            cx="16"
            cy="30"
            r="8"
            fill="none"
            stroke="#F97316"
            strokeWidth="1.5"
            opacity="0.2"
          />
        </svg>
      </div>
      
      {/* Text */}
      {showText && (
        <span className={`${textColor === 'white' ? 'text-white' : 'text-black'} font-bold text-xl italic tracking-tight whitespace-nowrap`}>
          offerGo
        </span>
      )}
    </div>
  )
}

export default Logo


