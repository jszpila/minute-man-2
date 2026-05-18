import { Box, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

export function PoaPoiHelpDiagram() {
  const { t } = useTranslation();
  const theme = useTheme();
  const mutedStrokeColor = theme.palette.text.secondary;
  const aimColor =
    theme.palette.mode === 'dark' ? theme.palette.info.light : theme.palette.info.main;
  const impactColor =
    theme.palette.mode === 'dark' ? theme.palette.secondary.light : theme.palette.secondary.dark;
  const horizontalColor =
    theme.palette.mode === 'dark' ? theme.palette.success.light : theme.palette.success.dark;
  const verticalColor =
    theme.palette.mode === 'dark' ? theme.palette.warning.light : theme.palette.warning.dark;
  const backgroundColor = theme.palette.background.paper;

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Box
        sx={{
          width: '100%',
          maxWidth: 480,
          flex: '0 1 480px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <svg
          viewBox="0 0 400 300"
          role="img"
          aria-labelledby="poa-poi-diagram-title poa-poi-diagram-desc"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        >
          <title id="poa-poi-diagram-title">Point of aim and point of impact diagram</title>
          <desc id="poa-poi-diagram-desc">
            Diagram showing a target center as the point of aim and a shot group offset from it as
            the point of impact, with horizontal and vertical offset lines.
          </desc>

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
          <circle
            cx="170"
            cy="160"
            r="28"
            fill="none"
            stroke={mutedStrokeColor}
            strokeWidth="1.5"
          />
          <line x1="108" y1="160" x2="232" y2="160" stroke={mutedStrokeColor} strokeWidth="1.5" />
          <line x1="170" y1="98" x2="170" y2="222" stroke={mutedStrokeColor} strokeWidth="1.5" />
          <circle cx="170" cy="160" r="6" fill={aimColor} />

          <line
            x1="170"
            y1="160"
            x2="260"
            y2="95"
            stroke={mutedStrokeColor}
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />

          <circle cx="254" cy="90" r="5" fill={impactColor} />
          <circle cx="267" cy="96" r="5" fill={impactColor} />
          <circle cx="258" cy="105" r="5" fill={impactColor} />
          <circle cx="260" cy="97" r="19" fill="none" stroke={impactColor} strokeWidth="2.2" />

          <line x1="170" y1="160" x2="170" y2="210" stroke={mutedStrokeColor} strokeWidth="1.3" />
          <line x1="260" y1="95" x2="260" y2="210" stroke={mutedStrokeColor} strokeWidth="1.3" />
          <line x1="176" y1="210" x2="254" y2="210" stroke={horizontalColor} strokeWidth="3" />

          <line x1="260" y1="95" x2="300" y2="95" stroke={mutedStrokeColor} strokeWidth="1.3" />
          <line x1="170" y1="160" x2="300" y2="160" stroke={mutedStrokeColor} strokeWidth="1.3" />
          <line x1="300" y1="101" x2="300" y2="154" stroke={verticalColor} strokeWidth="3" />
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
          <LegendDot color={aimColor} label={t('zeroCalculator.pointOfAim')} />
          <LegendImpact color={impactColor} label={t('zeroCalculator.pointOfImpact')} />
          <LegendLine color={horizontalColor} label={t('zeroCalculator.horizontalOffset')} />
          <LegendLine color={verticalColor} label={t('zeroCalculator.verticalOffset')} />
        </Box>
      </Box>
    </Box>
  );
}

function LegendLine({ color, label }: { color: string; label: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <Box
        aria-hidden="true"
        sx={{
          width: 38,
          borderTop: `3px solid ${color}`,
          flex: '0 0 auto',
        }}
      />
      <Typography variant="body2" noWrap>
        {label}
      </Typography>
    </Box>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <Box
        aria-hidden="true"
        sx={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          bgcolor: color,
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
          width: 16,
          height: 16,
          border: `2px solid ${color}`,
          borderRadius: '50%',
          bgcolor: color,
          flex: '0 0 auto',
        }}
      />
      <Typography variant="body2" noWrap>
        {label}
      </Typography>
    </Box>
  );
}

export default PoaPoiHelpDiagram;
