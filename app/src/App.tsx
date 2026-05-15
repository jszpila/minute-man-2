import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AppProvider, useAppContext } from './shared/context/AppContext';
import { ThemeProvider } from './shared/theme/ThemeProvider';
import RootLayout from './shared/components/RootLayout';
import { ZeroCalculator } from './features/zero-calculator';
import { MilDotCalculator } from './features/mildot-calculator';
import { Settings } from './features/settings';

// Placeholder components for features (we'll build these next)
const ShotTimer = () => <div>Shot Timer</div>;
const RangeConditions = () => <div>Range Conditions</div>;
const About = () => <div>About</div>;

const AppRoutes: React.FC = () => {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <RootLayout navOpen={navOpen} onNavToggle={() => setNavOpen(!navOpen)}>
      <Routes>
        <Route path="/" element={<ZeroCalculator />} />
        <Route path="/zero" element={<ZeroCalculator />} />
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
  const { theme } = useAppContext();

  return (
    <ThemeProvider mode={theme}>
      <Router>
        <AppRoutes />
      </Router>
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
