import './VoteResult.css';
import jaCard from '../../assets/voting_ja.webp';
import neinCard from '../../assets/voting_nein.webp';
import PropTypes from 'prop-types';

function VoteResult({ displayResults }) {
    if (displayResults.show === false) {
        return null;
    }
    return (
        <div className='resultContainer'>
            {displayResults.results.winner === 'ja' ? (
                <div className='winnerCard'>
                    <img src={jaCard} height={'200px'} alt='carte de vote ja' />
                    <p style={{ fontSize: '32px' }}>
                        Chancelier élu avec {displayResults.results.ja} voix
                    </p>
                </div>
            ) : displayResults.results.winner === 'nein' ? (
                <div className='winnerCard'>
                    <img src={neinCard} height={'200px'} alt='carte de vote nein' />
                    <p style={{ fontSize: '32px' }}>
                        Chancelier refusé avec {displayResults.results.nein} voix
                    </p>
                </div>
            ) : displayResults.results.winner === 'tie' ? (
                <div className='winnerCard'>
                    <p style={{ fontSize: '32px' }}>
                        Égalité avec {displayResults.results.ja} voix pour Ja et {displayResults.results.nein} voix pour Nein
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
            winner: PropTypes.string.isRequired,
            ja: PropTypes.number.isRequired,
            nein: PropTypes.number.isRequired,
        }).isRequired,
    }).isRequired,
};

export default VoteResult;