import React from 'react';
import { Button, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, Tooltip } from '@fluentui/react-components';
import {
  ArrowDownload24Regular,
  ChatAdd24Regular,
  History24Regular,
  Keyboard24Regular,
  MoreHorizontal24Regular,
  Settings24Regular,
} from '@fluentui/react-icons';
import raktaLogo from '../../assets/rakta-logo.png';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
  agentName?: string;
  hasMessages?: boolean;
  disabled?: boolean;
  onToggleSidebar?: () => void;
  onNewChat?: () => void;
  onExportConversation?: () => void;
  onShowShortcuts?: () => void;
  onOpenSettings?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  agentName,
  hasMessages = false,
  disabled = false,
  onToggleSidebar,
  onNewChat,
  onExportConversation,
  onShowShortcuts,
  onOpenSettings,
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.identity}>
        <span className={styles.logoPlate}>
          <img src={raktaLogo} alt="RAK Transport Authority" className={styles.logo} />
        </span>
        {agentName && <h1 className={styles.agentName}>{agentName}</h1>}
      </div>

      <nav className={styles.actions} aria-label="Chat actions">
        {onToggleSidebar && (
          <Tooltip content="Conversation history" relationship="label">
            <Button
              appearance="subtle"
              className={styles.iconButton}
              icon={<History24Regular />}
              onClick={onToggleSidebar}
              disabled={disabled}
            />
          </Tooltip>
        )}
        {onNewChat && (
          <Tooltip content="New chat" relationship="label">
            <Button
              appearance="subtle"
              className={styles.iconButton}
              icon={<ChatAdd24Regular />}
              onClick={onNewChat}
              disabled={disabled || !hasMessages}
            />
          </Tooltip>
        )}
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Tooltip content="More options" relationship="label">
              <Button appearance="subtle" className={styles.iconButton} icon={<MoreHorizontal24Regular />} />
            </Tooltip>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              {onExportConversation && (
                <MenuItem icon={<ArrowDownload24Regular />} onClick={onExportConversation} disabled={disabled || !hasMessages}>
                  Export as Markdown
                </MenuItem>
              )}
              {onShowShortcuts && (
                <MenuItem icon={<Keyboard24Regular />} onClick={onShowShortcuts}>
                  Keyboard shortcuts
                </MenuItem>
              )}
              {onOpenSettings && (
                <MenuItem icon={<Settings24Regular />} onClick={onOpenSettings} disabled={disabled}>
                  Settings
                </MenuItem>
              )}
            </MenuList>
          </MenuPopover>
        </Menu>
      </nav>
    </header>
  );
};
