import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Container } from './components/common/Container';
import { useMutualFunds, MutualFundsProvider } from './hooks/useMutualFunds';
import { useNavData } from './hooks/useNavData';
import { Block } from 'baseui/block';
import { useAssetNavData } from './hooks/useAssetNavData';
import { LumpsumSimulatorTab } from './pages/LumpsumSimulatorTab';
import { SipSimulatorTab } from './pages/SipSimulatorTab';
import { SwpSimulatorTab } from './pages/SwpSimulatorTab';
import { HybridSimulatorTab } from './pages/HybridSimulatorTab';
import { GoalCalculatorTab } from './pages/GoalCalculatorTab';
import { WhatIfTab } from './pages/WhatIfTab';
import { HistoricalValuesTab } from './pages/HistoricalValuesTab';
import { BottomBar } from './components/layout/BottomBar';
import { HelpProvider, HelpDrawer, useHelp } from './components/help';
import { trackPageView } from './utils/analytics';
import { ToasterContainer } from 'baseui/toast';
import { setGlobalOpenHelp } from './services/yahooFinanceService';

// ============================================================================
// NAV TABS CONFIG
// ============================================================================

const NAV_TABS = [
  { label: 'Lumpsum', path: '/lumpsum' },
  { label: 'SIP', path: '/sip' },
  { label: 'SWP', path: '/swp' },
  { label: 'Hybrid', path: '/hybrid' },
  { label: 'Goal Planner', path: '/goal' },
  { label: 'What-If', path: '/what-if' },
  { label: 'Historical', path: '/historical' },
];

// ============================================================================
// CUSTOM NAV BAR
// ============================================================================

const NavBar: React.FC<{
  currentPath: string;
  onNavigate: (path: string) => void;
  onHelp: () => void;
}> = ({ currentPath, onNavigate, onHelp }) => {
  return (
    <Block
      as="header"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      overrides={{
        Block: {
          style: {
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e4e4e7',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            height: '56px',
            position: 'sticky' as const,
            top: '0',
            zIndex: 100,
          }
        }
      }}
    >
      {/* Logo / Title */}
      <Block
        display="flex"
        alignItems="center"
        overrides={{
          Block: {
            style: {
              fontWeight: 600,
              fontSize: '1rem',
              color: '#09090b',
              letterSpacing: '-0.01em',
              cursor: 'pointer',
              userSelect: 'none' as const,
              flexShrink: 0,
              marginRight: '2rem',
            }
          }
        }}
        onClick={() => onNavigate('/lumpsum')}
      >
        Portfolio Simulator
      </Block>

      {/* Tab Navigation */}
      <Block
        as="nav"
        display="flex"
        alignItems="center"
        flex="1"
        overrides={{
          Block: {
            style: {
              gap: '0.25rem',
              overflowX: 'auto' as const,
              scrollbarWidth: 'none' as const,
              msOverflowStyle: 'none' as const,
              '::-webkit-scrollbar': { display: 'none' },
            }
          }
        }}
      >
        {NAV_TABS.map(tab => {
          const isActive = currentPath === tab.path;
          return (
            <Block
              key={tab.path}
              as="button"
              onClick={() => onNavigate(tab.path)}
              overrides={{
                Block: {
                  style: {
                    background: isActive ? '#f4f4f5' : 'transparent',
                    color: isActive ? '#09090b' : '#71717a',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.8125rem',
                    fontFamily: 'inherit',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap' as const,
                    transition: '120ms cubic-bezier(0.4, 0, 0.2, 1)',
                    lineHeight: '1.4',
                    ':hover': {
                      background: '#f4f4f5',
                      color: '#09090b',
                    },
                  }
                }
              }}
            >
              {tab.label}
            </Block>
          );
        })}
      </Block>

      {/* Help button */}
      <Block
        as="button"
        onClick={onHelp}
        overrides={{
          Block: {
            style: {
              background: 'transparent',
              color: '#71717a',
              fontWeight: 500,
              fontSize: '0.8125rem',
              fontFamily: 'inherit',
              padding: '0.375rem 0.625rem',
              borderRadius: '6px',
              border: '1px solid #e4e4e7',
              cursor: 'pointer',
              whiteSpace: 'nowrap' as const,
              marginLeft: '1rem',
              flexShrink: 0,
              transition: '120ms cubic-bezier(0.4, 0, 0.2, 1)',
              ':hover': {
                background: '#fafafa',
                borderColor: '#d4d4d8',
                color: '#09090b',
              },
            }
          }
        }}
      >
        Help
      </Block>
    </Block>
  );
};

// ============================================================================
// APP
// ============================================================================

const AppContent: React.FC = () => {
  const mutualFundsState = useMutualFunds();
  const { loadNavData } = useNavData();
  const { loadNavData: loadAssetNavData } = useAssetNavData();
  const navigate = useNavigate();
  const location = useLocation();
  const { openHelp } = useHelp();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    setGlobalOpenHelp(openHelp);
  }, [openHelp]);

  const currentPath = location.pathname;

  return (
    <MutualFundsProvider value={mutualFundsState}>
      <Container>
        <ToasterContainer autoHideDuration={5000} />

        <NavBar
          currentPath={currentPath}
          onNavigate={navigate}
          onHelp={() => openHelp('getting-started')}
        />

        <Block
          position="relative"
          backgroundColor="#fafafa"
          flex="1"
          display="flex"
          flexDirection="column"
          overrides={{
            Block: {
              style: {
                paddingTop: '1.25rem',
                paddingBottom: '1.25rem',
                paddingLeft: '1.5rem',
                paddingRight: '1.5rem',
              }
            }
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/lumpsum" replace />} />
            <Route path="/lumpsum" element={null} />
            <Route path="/sip" element={null} />
            <Route path="/swp" element={null} />
            <Route path="/hybrid" element={null} />
            <Route path="/goal" element={null} />
            <Route path="/what-if" element={null} />
            <Route path="/historical" element={null} />
            <Route path="/portfolio" element={<Navigate to="/sip" replace />} />
          </Routes>

          <Block display={currentPath === '/lumpsum' ? 'block' : 'none'} flex="1">
            <LumpsumSimulatorTab loadNavData={loadNavData} />
          </Block>
          <Block display={currentPath === '/sip' ? 'block' : 'none'} flex="1">
            <SipSimulatorTab loadNavData={loadNavData} />
          </Block>
          <Block display={currentPath === '/swp' ? 'block' : 'none'} flex="1">
            <SwpSimulatorTab loadNavData={loadNavData} />
          </Block>
          <Block display={currentPath === '/hybrid' ? 'block' : 'none'} flex="1">
            <HybridSimulatorTab loadNavData={loadNavData} />
          </Block>
          <Block display={currentPath === '/goal' ? 'block' : 'none'} flex="1">
            <GoalCalculatorTab />
          </Block>
          <Block display={currentPath === '/what-if' ? 'block' : 'none'} flex="1">
            <WhatIfTab />
          </Block>
          <Block display={currentPath === '/historical' ? 'block' : 'none'} flex="1">
            <HistoricalValuesTab loadNavData={loadAssetNavData} />
          </Block>
        </Block>

        <BottomBar />
        <HelpDrawer />
      </Container>
    </MutualFundsProvider>
  );
};

const App: React.FC = () => {
  return (
    <HelpProvider>
      <AppContent />
    </HelpProvider>
  );
};

export default App;
