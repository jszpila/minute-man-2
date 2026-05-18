import { Box, useTheme } from '@mui/material';

export function HoldoverHelpDiagram() {
  const theme = useTheme();
  const strokeColor = theme.palette.text.primary;
  const mutedStrokeColor = theme.palette.text.secondary;
  const backgroundColor = theme.palette.background.paper;
  const accentColor = theme.palette.primary.main;

  return (
    <Box sx={{ width: '100%', maxWidth: 480, mx: 'auto' }}>
      <svg
        viewBox="0 0 400 300"
        role="img"
        aria-labelledby="holdover-diagram-title holdover-diagram-desc"
        style={{ display: 'block', width: '100%', height: 'auto' }}
      >
        <title id="holdover-diagram-title">Holdover and sight height diagram</title>
        <desc id="holdover-diagram-desc">
          Diagram showing a sight line above a projectile path. At close range, the projectile path
          is below the sight line before intersecting it at the zero distance.
        </desc>
        <defs>
          <marker
            id="holdover-arrow"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L8,4 L0,8 z" fill={mutedStrokeColor} />
          </marker>
          <marker
            id="holdover-arrow-accent"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L8,4 L0,8 z" fill={accentColor} />
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

        <path
          d="M34 174 H118 L138 156 H168 L188 174 H210"
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <rect
          x="58"
          y="132"
          width="44"
          height="18"
          rx="3"
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
        />
        <line x1="80" y1="150" x2="80" y2="174" stroke={strokeColor} strokeWidth="3" />
        <circle cx="70" cy="155" r="4" fill={strokeColor} />
        <circle cx="70" cy="105" r="4" fill={accentColor} />

        <line x1="70" y1="105" x2="360" y2="105" stroke={accentColor} strokeWidth="2.5" />
        <text x="206" y="94" textAnchor="middle" fill={strokeColor} fontSize="14">
          Sight Line
        </text>

        <path
          d="M70 155 C125 150 205 125 330 105"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeDasharray="6 5"
        />
        <text x="214" y="142" textAnchor="middle" fill={strokeColor} fontSize="14">
          Projectile Path
        </text>

        <line
          x1="48"
          y1="109"
          x2="48"
          y2="151"
          stroke={mutedStrokeColor}
          strokeWidth="2"
          markerStart="url(#holdover-arrow)"
          markerEnd="url(#holdover-arrow)"
        />
        <line x1="58" y1="105" x2="76" y2="105" stroke={mutedStrokeColor} strokeWidth="1.5" />
        <line x1="58" y1="155" x2="76" y2="155" stroke={mutedStrokeColor} strokeWidth="1.5" />
        <text
          x="24"
          y="132"
          transform="rotate(-90 24 132)"
          textAnchor="middle"
          fill={strokeColor}
          fontSize="13"
        >
          Height Over Bore
        </text>

        <line x1="155" y1="82" x2="155" y2="190" stroke={mutedStrokeColor} strokeWidth="2" />
        <circle cx="155" cy="105" r="13" fill="none" stroke={accentColor} strokeWidth="2" />
        <line x1="145" y1="105" x2="165" y2="105" stroke={accentColor} strokeWidth="1.5" />
        <line x1="155" y1="95" x2="155" y2="115" stroke={accentColor} strokeWidth="1.5" />
        <circle cx="155" cy="143" r="4.5" fill={strokeColor} />
        <line
          x1="172"
          y1="112"
          x2="172"
          y2="139"
          stroke={mutedStrokeColor}
          strokeWidth="1.8"
          markerEnd="url(#holdover-arrow)"
        />
        <text x="155" y="207" textAnchor="middle" fill={strokeColor} fontSize="13">
          Close Range Impact
        </text>

        <line x1="330" y1="82" x2="330" y2="190" stroke={mutedStrokeColor} strokeWidth="2" />
        <circle cx="330" cy="105" r="13" fill="none" stroke={accentColor} strokeWidth="2" />
        <line x1="320" y1="105" x2="340" y2="105" stroke={accentColor} strokeWidth="1.5" />
        <line x1="330" y1="95" x2="330" y2="115" stroke={accentColor} strokeWidth="1.5" />
        <circle cx="330" cy="105" r="4.5" fill={strokeColor} />

        <line
          x1="78"
          y1="232"
          x2="322"
          y2="232"
          stroke={mutedStrokeColor}
          strokeWidth="2"
          markerStart="url(#holdover-arrow)"
          markerEnd="url(#holdover-arrow)"
        />
        <line x1="70" y1="220" x2="70" y2="242" stroke={mutedStrokeColor} strokeWidth="1.5" />
        <line x1="330" y1="220" x2="330" y2="242" stroke={mutedStrokeColor} strokeWidth="1.5" />
        <text x="200" y="256" textAnchor="middle" fill={strokeColor} fontSize="14">
          Zero Distance
        </text>

        <text x="200" y="278" textAnchor="middle" fill={mutedStrokeColor} fontSize="11">
          At close distances, impacts may occur below the point of aim due to sight height.
        </text>
      </svg>
    </Box>
  );
}

export default HoldoverHelpDiagram;
