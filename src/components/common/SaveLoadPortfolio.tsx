import React, { useState, useEffect } from 'react';
import { Block } from 'baseui/block';
import { Button, KIND, SIZE } from 'baseui/button';
import { Input } from 'baseui/input';
import { LabelMedium, ParagraphSmall } from 'baseui/typography';
import { portfolioStorage, SavedPortfolioConfig } from '../../services/portfolioStorage';

interface SaveLoadPortfolioProps {
  type: SavedPortfolioConfig['type'];
  currentPortfolios: any[];
  currentParams: SavedPortfolioConfig['params'];
  onLoad: (config: SavedPortfolioConfig) => void;
}

export const SaveLoadPortfolio: React.FC<SaveLoadPortfolioProps> = ({
  type,
  currentPortfolios,
  currentParams,
  onLoad,
}) => {
  const [savedConfigs, setSavedConfigs] = useState<SavedPortfolioConfig[]>([]);
  const [saveName, setSaveName] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setSavedConfigs(portfolioStorage.getByType(type));
  }, [type]);

  const handleSave = () => {
    if (!saveName.trim()) return;

    portfolioStorage.save({
      name: saveName.trim(),
      type,
      portfolios: currentPortfolios,
      params: currentParams,
    });

    setSavedConfigs(portfolioStorage.getByType(type));
    setSaveName('');
    setSaveMessage('Saved!');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleDelete = (id: string) => {
    portfolioStorage.delete(id);
    setSavedConfigs(portfolioStorage.getByType(type));
  };

  const handleLoad = (config: SavedPortfolioConfig) => {
    onLoad(config);
    setShowSaved(false);
  };

  const typeLabel = { sip: 'SIP', lumpsum: 'Lumpsum', swp: 'SWP', hybrid: 'Hybrid' }[type];

  return (
    <Block marginBottom="scale500">
      <Block display="flex" alignItems="center" gridGap="scale200" flexWrap="wrap">
        {/* Save */}
        <Input
          value={saveName}
          onChange={e => setSaveName((e.target as HTMLInputElement).value)}
          placeholder={`Name this ${typeLabel} config...`}
          size="compact"
          overrides={{ Root: { style: { width: '220px' } } }}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
        />
        <Button
          kind={KIND.secondary}
          size={SIZE.compact}
          onClick={handleSave}
          disabled={!saveName.trim()}
        >
          Save
        </Button>

        {saveMessage && (
          <LabelMedium overrides={{ Block: { style: { color: '#008032', fontWeight: '600' } } }}>
            {saveMessage}
          </LabelMedium>
        )}

        {/* Load toggle */}
        {savedConfigs.length > 0 && (
          <Button
            kind={KIND.tertiary}
            size={SIZE.compact}
            onClick={() => setShowSaved(!showSaved)}
          >
            {showSaved ? 'Hide' : `Load (${savedConfigs.length})`}
          </Button>
        )}
      </Block>

      {/* Saved configs list */}
      {showSaved && savedConfigs.length > 0 && (
        <Block marginTop="scale300" padding="scale400" backgroundColor="#fafafa"
          overrides={{ Block: { style: { borderRadius: '8px', maxHeight: '200px', overflowY: 'auto' } } }}>
          {savedConfigs.map(config => (
            <Block
              key={config.id}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              padding="scale200"
              overrides={{ Block: { style: { borderBottom: '1px solid #e4e4e7' } } }}
            >
              <Block>
                <LabelMedium marginTop="0" marginBottom="0">{config.name}</LabelMedium>
                <ParagraphSmall color="contentTertiary" marginTop="0" marginBottom="0">
                  {new Date(config.updatedAt).toLocaleDateString()} — {config.portfolios.length} portfolio(s)
                </ParagraphSmall>
              </Block>
              <Block display="flex" gridGap="scale100">
                <Button kind={KIND.secondary} size={SIZE.mini} onClick={() => handleLoad(config)}>Load</Button>
                <Button kind={KIND.tertiary} size={SIZE.mini} onClick={() => handleDelete(config.id)}>Delete</Button>
              </Block>
            </Block>
          ))}
        </Block>
      )}
    </Block>
  );
};
