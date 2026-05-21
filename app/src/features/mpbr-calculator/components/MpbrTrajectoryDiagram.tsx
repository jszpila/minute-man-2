import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import type { MpbrCalculationResult } from '../../../shared/utils/calculations';

interface MpbrTrajectoryDiagramProps {
  result: MpbrCalculationResult;
  distanceUnit: string;
}

const format = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 0 });

const MpbrTrajectoryDiagram: React.FC<MpbrTrajectoryDiagramProps> = ({ result, distanceUnit }) => {
  const theme = useTheme();
  const lineColor = theme.palette.text.primary;
  const mutedColor = theme.palette.text.secondary;
  const accentColor = theme.palette.primary.main;
  const width = 640;
  const height = 260;
  const left = 42;
  const right = 598;
  const sightY = 118;
  const upperY = 74;
  const lowerY = 178;
  const range = Math.max(result.mpbrYards, 1);
  const xForDistance = (distance: number) => left + (distance / range) * (right - left);
  const path = [
    `M ${left} ${lowerY}`,
    `C ${xForDistance(result.nearZeroYards * 0.45)} ${sightY + 18}, ${xForDistance(result.nearZeroYards)} ${sightY}, ${xForDistance(result.nearZeroYards)} ${sightY}`,
    `S ${xForDistance(result.maximumRiseYards * 0.9)} ${upperY}, ${xForDistance(result.maximumRiseYards)} ${upperY}`,
    `S ${xForDistance(result.farZeroYards)} ${sightY}, ${xForDistance(result.farZeroYards)} ${sightY}`,
    `S ${right - 24} ${lowerY}, ${right} ${lowerY}`,
  ].join(' ');

  const markers = [
    { label: 'Near Zero', value: result.nearZeroYards, y: sightY, anchor: 'middle' },
    { label: 'Max Rise', value: result.maximumRiseYards, y: upperY, anchor: 'middle' },
    { label: 'Far Zero', value: result.farZeroYards, y: sightY, anchor: 'middle' },
    { label: 'MPBR', value: result.mpbrYards, y: lowerY, anchor: 'end' },
  ] as const;

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <svg
        role="img"
        aria-labelledby="mpbr-diagram-title mpbr-diagram-desc"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="auto"
        style={{
          width: '100%',
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
          aspectRatio: `${width} / ${height}`,
        }}
      >
        <title id="mpbr-diagram-title">Practical MPBR trajectory diagram</title>
        <desc id="mpbr-diagram-desc">
          Simplified schematic showing sight line, projectile path, near zero, far zero, maximum
          rise, and MPBR endpoint.
        </desc>

        <line
          x1={left}
          y1={sightY}
          x2={right}
          y2={sightY}
          stroke={mutedColor}
          strokeWidth="2"
          strokeDasharray="8 7"
        />
        <line
          x1={left}
          y1={upperY}
          x2={right}
          y2={upperY}
          stroke={mutedColor}
          strokeWidth="1"
          strokeDasharray="3 7"
          opacity="0.55"
        />
        <line
          x1={left}
          y1={lowerY}
          x2={right}
          y2={lowerY}
          stroke={mutedColor}
          strokeWidth="1"
          strokeDasharray="3 7"
          opacity="0.55"
        />
        <path d={path} fill="none" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />

        <text x={left} y={sightY - 10} fill={mutedColor} fontSize="15">
          Sight Line
        </text>
        <text x={left} y={lowerY + 31} fill={mutedColor} fontSize="15">
          Lower vital-zone edge
        </text>

        {markers.map((marker) => {
          const x = xForDistance(marker.value);
          return (
            <g key={marker.label}>
              <line
                x1={x}
                y1={52}
                x2={x}
                y2={199}
                stroke={lineColor}
                strokeWidth="1.5"
                opacity="0.45"
              />
              <circle cx={x} cy={marker.y} r="5.5" fill={accentColor} />
              <text
                x={x}
                y={marker.y < sightY ? marker.y - 16 : marker.y + 23}
                fill={lineColor}
                fontSize="15"
                textAnchor={marker.anchor}
              >
                {marker.label}
              </text>
              <text
                x={x}
                y={marker.y < sightY ? marker.y - 35 : marker.y + 42}
                fill={mutedColor}
                fontSize="13"
                textAnchor={marker.anchor}
              >
                {format(marker.value)} {distanceUnit}
              </text>
            </g>
          );
        })}
      </svg>
      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
        Simplified field schematic. Shape and spacing are not to scale.
      </Typography>
    </Box>
  );
};

export default MpbrTrajectoryDiagram;
