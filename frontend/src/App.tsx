import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsalAuthentication } from "@azure/msal-react";
import { Spinner } from '@fluentui/react-components';
import { useAppState } from './hooks/useAppState';
import { InteractionType } from "@azure/msal-browser";
import { ErrorBoundary } from "./components/core/ErrorBoundary";
import { AgentChat } from "./components/AgentChat";
import { loginRequest } from "./config/authConfig";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./hooks/useAuth";
import type { IAgentMetadata } from "./types/chat";
import raktaLogo from "./assets/rakta-logo.png";
import "./App.css";

const FALLBACK_AGENT_NAME = 'RAKTA Assistant';

function App() {
  // This hook handles authentication automatically - redirects if not authenticated
  useMsalAuthentication(InteractionType.Redirect, loginRequest);
  const { auth } = useAppState();
  const { getAccessToken } = useAuth();
  const [agentMetadata, setAgentMetadata] = useState<IAgentMetadata | null>(null);
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);

  // Wrap fetchAgentMetadata in useCallback to make it stable for the effect
  const fetchAgentMetadata = useCallback(async () => {
    if (auth.status !== 'authenticated') return;

    try {
      const token = await getAccessToken();
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/agent`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: IAgentMetadata = await response.json();
      setAgentMetadata(data);

      const shownName = data.displayName || data.name;
      document.title = shownName ? `${shownName} | RAKTA` : FALLBACK_AGENT_NAME;
    } catch (error) {
      console.error('Error fetching agent metadata:', error);
      // Fallback data keeps UI functional on error
      setAgentMetadata({
        id: 'fallback-agent',
        object: 'agent',
        createdAt: Date.now() / 1000,
        name: FALLBACK_AGENT_NAME,
        description: null,
        model: 'gpt-4o-mini',
        metadata: null
      });
      document.title = FALLBACK_AGENT_NAME;
    } finally {
      setIsLoadingAgent(false);
    }
  }, [auth.status, getAccessToken]);

  useEffect(() => {
    fetchAgentMetadata();
  }, [fetchAgentMetadata]);

  return (
    <ErrorBoundary>
      {auth.status === 'initializing' || isLoadingAgent ? (
        <div className="app-container app-loading">
          <img src={raktaLogo} alt="RAK Transport Authority" className="app-loading-logo" />
          <Spinner
            size="small"
            label={auth.status === 'initializing' ? 'Preparing your session…' : 'Loading assistant…'}
          />
        </div>
      ) : (
        <>
          <AuthenticatedTemplate>
            {agentMetadata && (
              <div className="app-container">
                <AgentChat 
                  agentId={agentMetadata.id}
                  agentName={agentMetadata.displayName || agentMetadata.name}
                  agentDescription={agentMetadata.description || undefined}
                  agentLogo={agentMetadata.metadata?.logo}
                  starterPrompts={agentMetadata.starterPrompts || undefined}
                />
              </div>
            )}
          </AuthenticatedTemplate>
          <UnauthenticatedTemplate>
            <div className="app-container app-loading">
              <img src={raktaLogo} alt="RAK Transport Authority" className="app-loading-logo" />
              <Spinner size="small" label="Signing in…" />
            </div>
          </UnauthenticatedTemplate>
        </>
      )}
    </ErrorBoundary>
  );
}

export default App;
