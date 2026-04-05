import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as d3 from 'd3';
import { cn } from '../lib/utils';
import { Info, Fingerprint } from 'lucide-react';

interface Center {
  defined: boolean;
  description: string;
}

interface Gate {
  number: number;
  name: string;
  description: string;
}

interface Channel {
  name: string;
  description: string;
}

interface HumanDesignResult {
  type: string;
  authority: string;
  profile: string;
  centers: Record<string, Center>;
  channels: Channel[];
  gates: Gate[];
  summary: string;
}

const TOOLTIP_OFFSET = 10;

const Tooltip = ({ content, x, y, visible }: { content: React.ReactNode; x: number; y: number; visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 5 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="fixed z-[100] pointer-events-none"
        style={{ left: x + TOOLTIP_OFFSET, top: y + TOOLTIP_OFFSET }}
      >
        <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl max-w-[250px]">
          {content}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const BodyGraph = ({ data }: { data: HumanDesignResult }) => {
  const [hoveredItem, setHoveredItem] = useState<{ content: React.ReactNode; x: number; y: number } | null>(null);

  // Simplified BodyGraph positions for centers
  const centerPositions: Record<string, { x: number; y: number; shape: 'triangle' | 'square' | 'diamond' }> = {
    'Head': { x: 150, y: 30, shape: 'triangle' },
    'Ajna': { x: 150, y: 80, shape: 'triangle' },
    'Throat': { x: 150, y: 140, shape: 'square' },
    'G Center': { x: 150, y: 210, shape: 'diamond' },
    'Heart': { x: 200, y: 210, shape: 'triangle' },
    'Sacral': { x: 150, y: 290, shape: 'square' },
    'Root': { x: 150, y: 360, shape: 'square' },
    'Spleen': { x: 80, y: 290, shape: 'triangle' },
    'Solar Plexus': { x: 220, y: 290, shape: 'triangle' },
  };

  const renderShape = (name: string, pos: { x: number; y: number; shape: string }, defined: boolean) => {
    const size = 30;
    const color = defined ? '#6366f1' : 'rgba(255,255,255,0.05)';
    const stroke = defined ? '#818cf8' : 'rgba(255,255,255,0.1)';

    const handleHover = (e: React.MouseEvent) => {
      setHoveredItem({
        content: (
          <div className="space-y-1">
            <p className="font-bold text-white text-sm">{name}</p>
            <p className="text-xs text-indigo-400 font-medium">{defined ? 'Defined' : 'Undefined'}</p>
            <p className="text-[10px] text-slate-400 leading-tight">{data.centers[name]?.description}</p>
          </div>
        ),
        x: e.clientX,
        y: e.clientY
      });
    };

    const ShapeComponent = pos.shape === 'triangle' ? motion.path : (pos.shape === 'square' ? motion.rect : motion.path);
    const shapeProps = pos.shape === 'triangle' 
      ? { d: `M ${pos.x} ${pos.y - size} L ${pos.x - size} ${pos.y + size} L ${pos.x + size} ${pos.y + size} Z` }
      : (pos.shape === 'square' 
          ? { x: pos.x - size, y: pos.y - size, width: size * 2, height: size * 2 }
          : { d: `M ${pos.x} ${pos.y - size * 1.2} L ${pos.x - size * 1.2} ${pos.y} L ${pos.x} ${pos.y + size * 1.2} L ${pos.x + size * 1.2} ${pos.y} Z` }
        );

    return (
      <ShapeComponent
        {...shapeProps}
        fill={color}
        stroke={stroke}
        strokeWidth="2"
        onMouseEnter={handleHover}
        onMouseMove={handleHover}
        onMouseLeave={() => setHoveredItem(null)}
        className="transition-colors duration-300 cursor-help"
        animate={defined ? { fillOpacity: [0.8, 1, 0.8] } : {}}
        transition={defined ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : {}}
      />
    );
  };

  // Simplified Channel mapping (Gate A to Gate B)
  const channelConnections: Record<string, { from: string; to: string }> = {
    '1-8': { from: 'G Center', to: 'Throat' },
    '10-20': { from: 'G Center', to: 'Throat' },
    '10-34': { from: 'G Center', to: 'Sacral' },
    '10-57': { from: 'G Center', to: 'Spleen' },
    '20-34': { from: 'Throat', to: 'Sacral' },
    '20-57': { from: 'Throat', to: 'Spleen' },
    '34-57': { from: 'Sacral', to: 'Spleen' },
    '34-20': { from: 'Sacral', to: 'Throat' },
    '43-23': { from: 'Ajna', to: 'Throat' },
    '61-24': { from: 'Head', to: 'Ajna' },
    '63-4': { from: 'Head', to: 'Ajna' },
    '64-47': { from: 'Head', to: 'Ajna' },
    '17-62': { from: 'Ajna', to: 'Throat' },
    '11-56': { from: 'Ajna', to: 'Throat' },
    '16-48': { from: 'Throat', to: 'Spleen' },
    '20-10': { from: 'Throat', to: 'G Center' },
    '31-7': { from: 'Throat', to: 'G Center' },
    '12-22': { from: 'Throat', to: 'Solar Plexus' },
    '35-36': { from: 'Throat', to: 'Solar Plexus' },
    '45-21': { from: 'Throat', to: 'Heart' },
    '25-51': { from: 'G Center', to: 'Heart' },
    '2-14': { from: 'G Center', to: 'Sacral' },
    '46-29': { from: 'G Center', to: 'Sacral' },
    '13-33': { from: 'G Center', to: 'Throat' },
    '5-15': { from: 'Sacral', to: 'G Center' },
    '27-50': { from: 'Sacral', to: 'Spleen' },
    '59-6': { from: 'Sacral', to: 'Solar Plexus' },
    '42-53': { from: 'Sacral', to: 'Root' },
    '3-60': { from: 'Sacral', to: 'Root' },
    '9-52': { from: 'Sacral', to: 'Root' },
    '54-32': { from: 'Root', to: 'Spleen' },
    '28-38': { from: 'Spleen', to: 'Root' },
    '18-58': { from: 'Spleen', to: 'Root' },
    '19-49': { from: 'Root', to: 'Solar Plexus' },
    '39-55': { from: 'Root', to: 'Solar Plexus' },
    '41-30': { from: 'Root', to: 'Solar Plexus' },
    '37-40': { from: 'Solar Plexus', to: 'Heart' },
  };

  return (
    <div className="relative w-full aspect-[3/4] max-w-[400px] mx-auto">
      <svg viewBox="0 0 300 400" className="w-full h-full">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Connections (Background) */}
        <g stroke="rgba(255,255,255,0.03)" strokeWidth="2" fill="none">
          <line x1="150" y1="30" x2="150" y2="80" />
          <line x1="150" y1="80" x2="150" y2="140" />
          <line x1="150" y1="140" x2="150" y2="210" />
          <line x1="150" y1="210" x2="150" y2="290" />
          <line x1="150" y1="290" x2="150" y2="360" />
          <line x1="150" y1="210" x2="200" y2="210" />
          <line x1="150" y1="290" x2="80" y2="290" />
          <line x1="150" y1="290" x2="220" y2="290" />
        </g>

        {/* Channels (Active) */}
        <motion.g 
          stroke="#a5b4fc" 
          strokeWidth="8" 
          fill="none" 
          strokeLinecap="round" 
          filter="url(#glow)"
          animate={{ strokeOpacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {data.channels.map((channel, i) => {
            // Try to find connection by name (e.g. "Channel 1-8")
            const match = channel.name.match(/(\d+)-(\d+)/);
            if (!match) return null;
            const key = `${match[1]}-${match[2]}`;
            const connection = channelConnections[key] || channelConnections[`${match[2]}-${match[1]}`];
            
            if (connection) {
              const from = centerPositions[connection.from];
              const to = centerPositions[connection.to];
              return (
                <line
                  key={i}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  className="cursor-help transition-all hover:stroke-white"
                  onMouseEnter={(e) => {
                    setHoveredItem({
                      content: (
                        <div className="space-y-1">
                          <p className="font-bold text-white text-sm">{channel.name}</p>
                          <p className="text-[10px] text-slate-400 leading-tight">{channel.description}</p>
                        </div>
                      ),
                      x: e.clientX,
                      y: e.clientY
                    });
                  }}
                  onMouseMove={(e) => {
                    setHoveredItem(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                  }}
                  onMouseLeave={() => setHoveredItem(null)}
                />
              );
            }
            return null; 
          })}
        </motion.g>

        {/* Centers */}
        {Object.entries(centerPositions).map(([name, pos]) => (
          <g key={name}>
            {renderShape(name, pos, data.centers[name]?.defined || false)}
          </g>
        ))}

        {/* Gates (Simplified as dots on centers) */}
        {data.gates.map((gate, i) => {
          // Find a center for this gate (simplified)
          const centerNames = Object.keys(centerPositions);
          const centerName = centerNames[gate.number % centerNames.length];
          const pos = centerPositions[centerName];
          
          return (
            <motion.circle
              key={i}
              cx={pos.x + (Math.random() - 0.5) * 20}
              cy={pos.y + (Math.random() - 0.5) * 20}
              r="3"
              fill="#f472b6"
              className="cursor-help"
              animate={{ r: [3, 4, 3], fillOpacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
              onMouseEnter={(e) => {
                setHoveredItem({
                  content: (
                    <div className="space-y-1">
                      <p className="font-bold text-white text-sm">Gate {gate.number}: {gate.name}</p>
                      <p className="text-[10px] text-slate-400 leading-tight">{gate.description}</p>
                    </div>
                  ),
                  x: e.clientX,
                  y: e.clientY
                });
              }}
              onMouseMove={(e) => {
                setHoveredItem(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
              }}
              onMouseLeave={() => setHoveredItem(null)}
            />
          );
        })}
      </svg>

      <Tooltip 
        visible={!!hoveredItem} 
        content={hoveredItem?.content} 
        x={hoveredItem?.x || 0} 
        y={hoveredItem?.y || 0} 
      />
    </div>
  );
};

export const MandalaWheel = ({ data }: { data: HumanDesignResult }) => {
  const [hoveredGate, setHoveredGate] = useState<{ gate: Gate; x: number; y: number } | null>(null);
  
  const radius = 150;
  const innerRadius = 100;
  const center = { x: 200, y: 200 };

  const gates = useMemo(() => {
    return Array.from({ length: 64 }, (_, i) => i + 1);
  }, []);

  const activeGateNumbers = useMemo(() => {
    return new Set(data.gates.map(g => g.number));
  }, [data.gates]);

  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto">
      <svg viewBox="0 0 400 400" className="w-full h-full">
        {/* Outer Circle */}
        <circle cx={center.x} cy={center.y} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <circle cx={center.x} cy={center.y} r={innerRadius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

        {/* 64 Gates */}
        {gates.map((num, i) => {
          const angle = (i * 360) / 64 - 90;
          const rad = (angle * Math.PI) / 180;
          const x1 = center.x + innerRadius * Math.cos(rad);
          const y1 = center.y + innerRadius * Math.sin(rad);
          const x2 = center.x + radius * Math.cos(rad);
          const y2 = center.y + radius * Math.sin(rad);
          
          const isActive = activeGateNumbers.has(num);
          const gateData = data.gates.find(g => g.number === num);

          return (
            <g key={num} className="cursor-help">
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isActive ? '#6366f1' : 'rgba(255,255,255,0.1)'}
                strokeWidth={isActive ? '3' : '1'}
                onMouseEnter={(e) => {
                  if (gateData) {
                    setHoveredGate({ gate: gateData, x: e.clientX, y: e.clientY });
                  }
                }}
                onMouseMove={(e) => {
                  if (gateData) {
                    setHoveredGate(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                  }
                }}
                onMouseLeave={() => setHoveredGate(null)}
              />
              {isActive && (
                <circle
                  cx={x2}
                  cy={y2}
                  r="4"
                  fill="#818cf8"
                  className="animate-pulse"
                />
              )}
              {/* Gate Numbers (Every 4th for clarity) */}
              {i % 4 === 0 && (
                <text
                  x={center.x + (radius + 15) * Math.cos(rad)}
                  y={center.y + (radius + 15) * Math.sin(rad)}
                  fill="rgba(255,255,255,0.3)"
                  fontSize="8"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {num}
                </text>
              )}
            </g>
          );
        })}

        {/* Center Graphic */}
        <circle cx={center.x} cy={center.y} r="20" fill="rgba(99, 102, 241, 0.1)" stroke="#6366f1" strokeWidth="1" />
        <Fingerprint className="w-6 h-6 text-indigo-500" x={center.x - 12} y={center.y - 12} />
      </svg>

      <Tooltip 
        visible={!!hoveredGate} 
        content={
          hoveredGate && (
            <div className="space-y-1">
              <p className="font-bold text-white text-sm">Gate {hoveredGate.gate.number}: {hoveredGate.gate.name}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{hoveredGate.gate.description}</p>
            </div>
          )
        } 
        x={hoveredGate?.x || 0} 
        y={hoveredGate?.y || 0} 
      />
    </div>
  );
};
