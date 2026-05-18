import { Box, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

export function HoldoverHelpDiagram() {
  const { t } = useTranslation();
  const theme = useTheme();
  const labels = theme.palette.text.primary;
  const muted = theme.palette.text.secondary;
  const background = theme.palette.background.paper;
  const sightLine =
    theme.palette.mode === 'dark' ? theme.palette.info.light : theme.palette.info.main;
  const projectile = theme.palette.error.main;
  const heightMarker =
    theme.palette.mode === 'dark' ? theme.palette.warning.light : theme.palette.warning.dark;
  const zeroMarker =
    theme.palette.mode === 'dark' ? theme.palette.success.light : theme.palette.success.dark;
  const impactMarker =
    theme.palette.mode === 'dark' ? theme.palette.secondary.light : theme.palette.secondary.dark;

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Box
        sx={{
          width: '100%',
          maxWidth: 760,
          flex: '0 1 760px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <svg
          viewBox="0 0 760 280"
          role="img"
          aria-labelledby="holdover-diagram-title holdover-diagram-desc"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        >
          <title id="holdover-diagram-title">Holdover and sight height diagram</title>
          <desc id="holdover-diagram-desc">
            Diagram showing an optic above a muzzle with a sight line, a projectile path rising
            toward the point of aim, a zeroed distance marker, and a close-range point of impact.
          </desc>
          <rect
            x="12"
            y="12"
            width="736"
            height="256"
            rx="8"
            fill={background}
            stroke={muted}
            strokeWidth="1"
            opacity="0.96"
          />

          <rect
            x="64"
            y="88"
            width="122"
            height="48"
            rx="4"
            fill={background}
            stroke={labels}
            strokeWidth="2.5"
          />
          <text x="112" y="119" textAnchor="middle" fill={labels} fontSize="24" fontWeight="600">
            Optic
          </text>

          <rect
            x="82"
            y="154"
            width="122"
            height="42"
            rx="4"
            fill={background}
            stroke={labels}
            strokeWidth="2.5"
          />
          <text x="143" y="182" textAnchor="middle" fill={labels} fontSize="24" fontWeight="600">
            Muzzle
          </text>

          <line x1="186" y1="112" x2="650" y2="112" stroke={sightLine} strokeWidth="3.4" />

          <path
            d="M204 175 C346 174 492 142 650 112"
            fill="none"
            stroke={projectile}
            strokeWidth="3.8"
            strokeLinecap="round"
          />

          <line
            x1="220"
            y1="112"
            x2="220"
            y2="175"
            stroke={heightMarker}
            strokeWidth="3.5"
            strokeDasharray="7 6"
          />
          <line x1="204" y1="250" x2="650" y2="250" stroke={zeroMarker} strokeWidth="3.5" />
          <g aria-hidden="true">
            <circle cx="404" cy="154" r="14" fill="none" stroke={impactMarker} strokeWidth="3" />
            <line x1="396" y1="146" x2="412" y2="162" stroke={impactMarker} strokeWidth="3" />
            <line x1="412" y1="146" x2="396" y2="162" stroke={impactMarker} strokeWidth="3" />
          </g>

          <circle cx="650" cy="112" r="32" fill="none" stroke={labels} strokeWidth="6" />
          <circle cx="650" cy="112" r="5" fill={labels} />
          <text x="650" y="55" textAnchor="middle" fill={labels} fontSize="24">
            {t('holdoverCalculator.diagramPointOfAim')}
          </text>
        </svg>
        <Box
          aria-label="Diagram legend"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            columnGap: 3,
            rowGap: 1,
            mt: 1,
            px: 1,
          }}
        >
          <LegendLine color={sightLine} label={t('holdoverCalculator.diagramSightLine')} />
          <LegendLine color={projectile} label={t('holdoverCalculator.diagramProjectilePath')} />
          <LegendLine color={heightMarker} label={t('holdoverCalculator.heightOverBore')} dotted />
          <LegendLine color={zeroMarker} label={t('holdoverCalculator.zeroDistance')} />
          <LegendImpact color={impactMarker} label={t('holdoverCalculator.diagramPointOfImpact')} />
        </Box>
      </Box>
    </Box>
  );
}

function LegendLine({
  color,
  label,
  dotted = false,
}: {
  color: string;
  label: string;
  dotted?: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <Box
        aria-hidden="true"
        sx={{
          width: 38,
          borderTop: `3px ${dotted ? 'dotted' : 'solid'} ${color}`,
          flex: '0 0 auto',
        }}
      />
      <Typography variant="body2" noWrap>
        {label}
      </Typography>
    </Box>
  );
}

function LegendImpact({ color, label }: { color: string; label: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <Box
        aria-hidden="true"
        sx={{
          position: 'relative',
          width: 18,
          height: 18,
          border: `2px solid ${color}`,
          borderRadius: '50%',
          flex: '0 0 auto',
          '&::before, &::after': {
            content: '""',
            position: 'absolute',
            left: 3,
            right: 3,
            top: '50%',
            borderTop: `2px solid ${color}`,
          },
          '&::before': {
            transform: 'rotate(45deg)',
          },
          '&::after': {
            transform: 'rotate(-45deg)',
          },
        }}
      />
      <Typography variant="body2" noWrap>
        {label}
      </Typography>
    </Box>
  );
}

export default HoldoverHelpDiagram;
