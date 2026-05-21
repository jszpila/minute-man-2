import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AppProvider, useAppContext } from './shared/context/AppContext';
import { ThemeProvider } from './shared/theme/ThemeProvider';
import RootLayout from './shared/components/RootLayout';
import NewVersionSnackbar from './shared/components/NewVersionSnackbar';
import { ZeroCalculator } from './features/zero-calculator';
import { HoldoverCalculator } from './features/holdover-calculator';
import { MpbrCalculator } from './features/mpbr-calculator';
import { MilDotCalculator } from './features/mildot-calculator';
import { RangeConditions } from './features/range-conditions';
import { ShotTimer } from './features/shot-timer';
import { Settings } from './features/settings';
import { About } from './features/about';

const AppRoutes: React.FC = () => {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <RootLayout navOpen={navOpen} onNavToggle={() => setNavOpen(!navOpen)}>
      <Routes>
        <Route path="/" element={<ZeroCalculator />} />
        <Route path="/zero" element={<ZeroCalculator />} />
        <Route path="/holdover" element={<HoldoverCalculator />} />
        <Route path="/mpbr" element={<MpbrCalculator />} />
        <Route path="/mildot" element={<MilDotCalculator />} />
        <Route path="/shot-timer" element={<ShotTimer />} />
        <Route path="/conditions" element={<RangeConditions />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </RootLayout>
  );
};

const AppContent: React.FC = () => {
  const { theme, fontSize } = useAppContext();

  return (
    <ThemeProvider mode={theme} fontSize={fontSize}>
      <Router>
        <AppRoutes />
      </Router>
      <NewVersionSnackbar />
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
