
import { useGame } from '../contexts/GameContext.jsx';

interface BaseDefenseTestProps {
  onClose: () => void;
}

export default function BaseDefenseTest({ onClose }: BaseDefenseTestProps) {
  const { state, executeBaseRaid, checkForBaseRaids } = useGame();
  
  const handleTestRaid = (baseId: string) => {
    console.log('Testing base raid for base:', baseId);
    const result = executeBaseRaid(baseId);
    console.log('Raid result:', result);
  };

  const handleCheckAllRaids = () => {
    console.log('Checking all bases for raids...');
    checkForBaseRaids();
  };

  // Get all player bases
  const getAllBases = () => {
    const bases: any[] = [];
    Object.keys(state.bases || {}).forEach(city => {
      const cityBases = state.bases[city];
      if (Array.isArray(cityBases)) {
        cityBases.forEach(base => {
          if (base && base.operational) {
            bases.push({ ...base, city });
          }
        });
      }
    });
    return bases;
  };

  const bases = getAllBases();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#222',
        color: '#fff',
        borderRadius: '10px',
        padding: '24px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 4px 32px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2>Base Defense Test</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '1.5em',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handleCheckAllRaids}
            style={{
              background: '#ff6666',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Check All Bases for Raids
          </button>
        </div>

        <div>
          <h3>Player Bases ({bases.length})</h3>
          {bases.length === 0 ? (
            <p>No operational bases found.</p>
          ) : (
            <div>
              {bases.map((base) => (
                <div key={base.id} style={{
                  border: '1px solid #444',
                  padding: '10px',
                  margin: '10px 0',
                  borderRadius: '5px'
                }}>
                  <h4>{base.city} - Level {base.level} Base</h4>
                  <p>Gang Members: {base.assignedGang || 0}</p>
                  <p>Guns: {base.guns || 0}</p>
                  <p>Cash Stored: ${(base.cashStored || 0).toLocaleString()}</p>
                  <div>
                    <strong>Drugs:</strong>
                    {Object.keys(base.inventory || {}).map(drug => {
                      const amount = base.inventory[drug] || 0;
                      return amount > 0 ? (
                        <span key={drug} style={{ marginRight: '10px' }}>
                          {drug}: {amount}
                        </span>
                      ) : null;
                    })}
                  </div>
                  <button
                    onClick={() => handleTestRaid(base.id)}
                    style={{
                      background: '#ff4444',
                      color: '#fff',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      marginTop: '10px'
                    }}
                  >
                    Test Raid This Base
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}