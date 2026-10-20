import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import styles from './StarterMessages.module.css';

interface IStarterMessageProps {
  agentName?: string;
  agentDescription?: string;
  agentLogo?: string;
  /**
   * Starter prompts from agent metadata.
   * If not provided, falls back to default prompts.
   *
   * Configure in Microsoft Foundry portal under agent Configuration > Starter prompts.
   * Prompts are stored as newline-separated text in the "starterPrompts" metadata key.
   */
  starterPrompts?: string[];
  onPromptClick?: (prompt: string) => void;
}

// Default starter prompts when none are configured in Microsoft Foundry
const defaultStarterPrompts = [
  "How can you help me?",
  "What are your capabilities?",
  "Tell me about yourself",
];

function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export const StarterMessages = ({
  agentName,
  agentDescription,
  starterPrompts,
  onPromptClick,
}: IStarterMessageProps): ReactNode => {
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0];

  // Use agent-provided prompts or fall back to defaults
  const prompts = starterPrompts && starterPrompts.length > 0
    ? starterPrompts
    : defaultStarterPrompts;

  const greeting = getGreeting(new Date());

  return (
    <div className={styles.zeroprompt}>
      <div className={styles.content}>
        {agentName && <p className={styles.agentName}>{agentName}</p>}
        <h2 className={styles.welcome}>
          {firstName ? `${greeting}, ${firstName}` : greeting}
        </h2>
        <p className={styles.caption}>
          {agentDescription || 'Ask a question to get started.'}
        </p>
      </div>

      {onPromptClick && (
        <section className={styles.prompts} aria-label="Suggested questions">
          <h3 className={styles.promptsHeading}>Try asking</h3>
          <ul className={styles.promptList}>
            {prompts.map((prompt, index) => (
              <li key={`prompt-${index}`}>
                <button
                  className={styles.promptRow}
                  onClick={() => onPromptClick(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
