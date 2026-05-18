import { Box, useTheme } from '@mui/material';

export function PoaPoiHelpDiagram() {
  const theme = useTheme();
  const strokeColor = theme.palette.text.primary;
  const mutedStrokeColor = theme.palette.text.secondary;
  const accentColor = theme.palette.primary.main;
  const backgroundColor = theme.palette.background.paper;

  return (
    <Box sx={{ width: '100%', maxWidth: 480, mx: 'auto' }}>
      <svg
        viewBox="0 0 400 300"
        role="img"
        aria-labelledby="poa-poi-diagram-title poa-poi-diagram-desc"
        style={{ display: 'block', width: '100%', height: 'auto' }}
      >
        <title id="poa-poi-diagram-title">Point of aim and point of impact diagram</title>
        <desc id="poa-poi-diagram-desc">
          Diagram showing a target center as the point of aim and a shot group offset from it as the
          point of impact, with horizontal and vertical offset arrows.
        </desc>
        <defs>
          <marker
            id="poa-poi-arrow"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L8,4 L0,8 z" fill={mutedStrokeColor} />
          </marker>
        </defs>

        <rect
          x="8"
          y="8"
          width="384"
          height="284"
          rx="8"
          fill={backgroundColor}
          stroke={mutedStrokeColor}
          strokeWidth="1"
          opacity="0.96"
        />

        <circle cx="170" cy="160" r="52" fill="none" stroke={mutedStrokeColor} strokeWidth="2" />
        <circle cx="170" cy="160" r="28" fill="none" stroke={mutedStrokeColor} strokeWidth="1.5" />
        <line x1="108" y1="160" x2="232" y2="160" stroke={mutedStrokeColor} strokeWidth="1.5" />
        <line x1="170" y1="98" x2="170" y2="222" stroke={mutedStrokeColor} strokeWidth="1.5" />
        <circle cx="170" cy="160" r="5" fill={accentColor} />
        <text x="118" y="88" fill={strokeColor} fontSize="14">
          Point of Aim
        </text>
        <line x1="160" y1="94" x2="169" y2="151" stroke={accentColor} strokeWidth="1.8" />

        <line
          x1="170"
          y1="160"
          x2="260"
          y2="95"
          stroke={mutedStrokeColor}
          strokeWidth="1.5"
          strokeDasharray="5 5"
        />

        <circle cx="254" cy="90" r="5" fill={strokeColor} />
        <circle cx="267" cy="96" r="5" fill={strokeColor} />
        <circle cx="258" cy="105" r="5" fill={strokeColor} />
        <circle cx="260" cy="97" r="18" fill="none" stroke={strokeColor} strokeWidth="1.5" />
        <text x="272" y="66" fill={strokeColor} fontSize="14">
          Point of Impact
        </text>
        <line x1="260" y1="70" x2="260" y2="82" stroke={strokeColor} strokeWidth="1.8" />

        <line x1="170" y1="160" x2="170" y2="210" stroke={mutedStrokeColor} strokeWidth="1.3" />
        <line x1="260" y1="95" x2="260" y2="210" stroke={mutedStrokeColor} strokeWidth="1.3" />
        <line
          x1="176"
          y1="210"
          x2="254"
          y2="210"
          stroke={mutedStrokeColor}
          strokeWidth="2"
          markerStart="url(#poa-poi-arrow)"
          markerEnd="url(#poa-poi-arrow)"
        />
        <text x="215" y="235" textAnchor="middle" fill={strokeColor} fontSize="14">
          Horizontal Offset
        </text>

        <line x1="260" y1="95" x2="300" y2="95" stroke={mutedStrokeColor} strokeWidth="1.3" />
        <line x1="170" y1="160" x2="300" y2="160" stroke={mutedStrokeColor} strokeWidth="1.3" />
        <line
          x1="300"
          y1="101"
          x2="300"
          y2="154"
          stroke={mutedStrokeColor}
          strokeWidth="2"
          markerStart="url(#poa-poi-arrow)"
          markerEnd="url(#poa-poi-arrow)"
        />
        <text
          x="326"
          y="128"
          transform="rotate(-90 326 128)"
          textAnchor="middle"
          fill={strokeColor}
          fontSize="14"
        >
          Vertical Offset
        </text>

        <text x="200" y="276" textAnchor="middle" fill={mutedStrokeColor} fontSize="11">
          Use the center of the shot group as the Point of Impact.
        </text>
      </svg>
    </Box>
  );
}

export default PoaPoiHelpDiagram;
