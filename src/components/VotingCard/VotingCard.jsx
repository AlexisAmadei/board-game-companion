import './VotingCard.css'

export default function VotingCard({ voteTitle, voteLabel }) {
  return (
    <div className={`voting-card`}>
        <span id='vote-title'>{voteTitle}</span>
        <span id='vote-label'>{voteLabel}</span>
    </div>
  )
}
