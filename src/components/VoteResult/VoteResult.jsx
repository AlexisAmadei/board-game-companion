import jaCard from '../../assets/voting_ja.webp';
import neinCard from '../../assets/voting_nein.webp';
import PropTypes from 'prop-types';
import './VoteResult.css';

function VoteResult({ displayResults }) {
    if (!displayResults || displayResults.show === false) {
        return null;
    }

    const { results } = displayResults;
    if (!results || typeof results.winner === 'undefined') {
        return <p>Les résultats ne sont pas disponibles.</p>;
    }

    return (
        <div className='resultContainer'>
            {results.winner === 'ja' ? (
                <div className='winnerCard'>
                    <img src={jaCard} height={'200px'} alt='carte de vote ja' />
                    <p style={{ fontSize: '32px' }}>
                        Chancelier élu avec {results.ja} voix
                    </p>
                </div>
            ) : results.winner === 'nein' ? (
                <div className='winnerCard'>
                    <img src={neinCard} height={'200px'} alt='carte de vote nein' />
                    <p style={{ fontSize: '32px' }}>
                        Chancelier refusé avec {results.nein} voix
                    </p>
                </div>
            ) : results.winner === 'tie' ? (
                <div className='winnerCard'>
                    <p style={{ fontSize: '32px' }}>
                        Égalité avec {results.ja} voix pour Ja et {results.nein} voix pour Nein
                    </p>
                </div>
            ) : null}
        </div>
    );
}

VoteResult.propTypes = {
    displayResults: PropTypes.shape({
        show: PropTypes.bool.isRequired,
        results: PropTypes.shape({
            winner: PropTypes.string,
            ja: PropTypes.number,
            nein: PropTypes.number,
        }),
    }).isRequired,
};

export default VoteResult;