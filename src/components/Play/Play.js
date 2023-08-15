//-----------------------------------------------------------------------------
// Copyright 2023 Chris Cooksey
//-----------------------------------------------------------------------------

import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import FireWorks from './FireWorks';
import { AuthConsumer } from '../Authentication/useAuth';
import { BSIConsumer } from '../App/useBSI';
import '../App/AppCookieKeys';
import '../App/App.css';

export default function Play() {

  const auth = AuthConsumer();
  const bsi = BSIConsumer();

  const location = useLocation();
  const id = location?.state?.id;
  console.log('Play.js:Play:game id is ' + id);

  const [game, setGame] = useState(null);
  const [score, setScore] = useState(null);
  const [response, setResponse] = useState(null);
  const [lastMove, setLastMove] = useState({x: -1, y: -1});
  const [fireworks, setFireworks] = useState(false);

  const userCanPlay = useRef(false);

  const username = auth.username;
  const usercolor = game?.players[0] === username ? game?.colors[0] : game?.colors[1];
  const usercolorlong = usercolor === 'W' ? 'White' : 'Black';
  const opponame = game?.players[0] === username ? game?.players[1] : game?.players[0];
  const oppocolor = usercolor === 'W' ? 'B' : 'W';
  const oppocolorlong = oppocolor === 'W' ? 'White' : 'Black';

  // Fetch the current game either on load (id changes), or when either
  // player makes a move (bsi.gameUpdated).
  useEffect(() => {
    if (auth?.signingOut.current) {
      console.log('Play.js: useEffect (get game) aborting because we are signing out');
    }
    if (id == null) {
      console.log('Play.js: useEffect (get game) aborting because game id is null');
    }
    if (!auth?.signingOut.current && id != null) {
      console.log('Play.js: useEffect (getGame): fetching game id ' + id);
      bsi.getGame(id)
      .then(res => {
        console.log('Play.js: useEffect (getGame): game fetched');
        setGame(res.data)
       })
      .catch(err => gameUpdateError(err));
    }
  }, [id, auth?.signingOut, bsi, bsi.gameUpdated]);

  // Update the messaging and scores when the game changes and when we know who
  // is playing the game).
  useEffect(() => {
    if (game != null && username != null && opponame != null) {
      gameUpdated(game, username, opponame, lastMove);
    }
  }, [game, username, opponame, lastMove] );

  // Called any time the game state is successfully loaded OR updated
  // due to either player entering a legal move.
  const gameUpdated = (game, username, opponame, lastMove) => {

    // This logic is for determining what text to display as a result of
    // whatever caused the game to update. It sets the 'response' state to
    // something (including potentially nothing). Note that the response state
    // can be overwritten as the logic progresses. e.g. we can say that it is
    // your turn, but might subsequently discover that the game was already
    // won by someone and so we do something different. If in fact the game is
    // finished, we may request some additional animations.

    // Need to know at what point the user has been given an opportunity
    // to move. This affects messaging when first loading the game.
    if (!userCanPlay.current) {
      userCanPlay.current = game.next === username;
    }

    // Current player has not had a turn since loading the game. This is a
    // unique message they will see until such time as they can make their
    // first move.
    if (!userCanPlay.current) {
      setResponse('othelloStartNotYourTurn');
    }

    // Game updated by one of the players. We can only get here if the last
    // move by either player was a success. See gameUpdateError for illegal
    // move or general server failure responses.
    if (userCanPlay.current)  {
      if (game.next === opponame) {
        // Last move was made by the current player. Generate a pithy response.
        if ((lastMove.x === 0 && lastMove.y === 0) ||
            (lastMove.x === 0 && lastMove.y === 7) ||
            (lastMove.x === 7 && lastMove.y === 0) ||
            (lastMove.x === 7 && lastMove.y === 7)) {
          setResponse('othelloCorner');
        } else {
          const n = Math.floor(Math.random() * 10);
          setResponse('othelloPithy' + n.toString());
        }
      } else {
        // Last move was made by the opponent.
        setResponse('othelloYourTurn');
      }
    }

    // Update the score
    if(game?.gameState != null) {
      let blackCount = 0;
      let whiteCount = 0;
      let i;
      let j;
      for (i = 0; i < 8; i++) {
        for (j = 0; j < 8; j++) {
          if (game.gameState[j][i] === 'B') {
            blackCount += 1;
          } else if (game.gameState[j][i] === 'W') {
            whiteCount += 1;
          }
        }
      }
      setScore({blackCount, whiteCount});
    }

    // Game has already been won by someone. Tell the player who won. Treat
    // the winner to fireworks.
    if (game.winner !== '') {
      if (game.winner === username) {
        setResponse('othelloWinner');
        setFireworks(true);
        setTimeout(() => setFireworks(false), 7 * 1000);
      } else if (game.winner === opponame) {
        setResponse('othelloLoser');
      } else if (game.winner === 'tie') {
        setResponse('othelloTie');
      }
    }
  }

  // Called any time the game state failed to load OR the current
  // user attempted an invalid move.
  const gameUpdateError = (err) => {
    // We'll consolidate different error domains to simplify
      // user notification.
      console.log('Play.js: gameUpdateError: err = ', err);
      if (err?.response?.data?.othelloMoveError != null) {
        setResponse(err.response.data.othelloMoveError);
      } else if (err?.response?.data?.othelloDatabaseError != null) {
        setResponse(err.response.data.othelloDatabaseError);
      } else if (err?.name === 'AxiosError') {
        setResponse(err.message);
      } else {
        setResponse('An unknown error has occurred.');
      }
  }

  // User tried to make a move.
  const handleCellClick = (e, x, y) => {
    if (typeof e.cancelable !== "boolean" || e.cancelable) {
      e.preventDefault();
    }
    if (game.winner !== '')
      return;
    bsi.makeMove(id, {x, y})
    .then(res => {
      setLastMove({x, y});
      setGame(res.data);
    })
    .catch(err => gameUpdateError(err));
  }

  const welcomeText = () => {
    return <p className="welcome">Welcome <strong>{username}</strong>. You are playing:&nbsp;&nbsp;<span className="token adorn">{renderToken(usercolor)}</span></p>
  }

  const displayScore = () => {
    if (score == null)
      return null;
    return (
      <p className="score-wrapper">
        {renderScore("black", "WhiteSmoke", score.blackCount)}
        {renderScore("white", "DimGrey", score.whiteCount)}
      </p>
    )
  }

  const renderScore = (ccolor, tcolor, count) => {
    return (
      <svg width="50px" height="50px">
        <circle cx="50%" cy="50%" r="45%" stroke="grey" strokeWidth="1" fill={ccolor} />
        <text x="50%" y="50%" fontSize="150%" fill={tcolor} textAnchor="middle" dy=".3em">{count}</text>
      </svg>
    )
  }

  const renderToken = (color) => {
    if (color==='E')
      return "";
    return (
      <svg width="100%" height="100%">
        <circle cx="50%" cy="50%" r="47%" stroke="grey" strokeWidth="1"
         fill={color==='W' ? "white" : "black"} />
      </svg>
    )
  }

  const nextPlayerText = () => {
    if (game?.winner === '') {
      if (game?.next === username) {
        return <p><strong>Next move:</strong> you are next, playing {game?.next === username ? usercolorlong : oppocolorlong}.</p>
      } else if (game?.next === opponame) {
        return <p><strong>Next move:</strong> {game?.next} is next, playing {game?.next === username ? usercolorlong : oppocolorlong}.</p>
      } else {
        return <p><strong>Next move:</strong> Game progression error. It is unknown who is next.</p>
      }
    }
    return null;
  }

  const resultText = (winner) => {
    if (winner == null) {
      return null;
    }
    if (winner === '') {
      return <p>{responseText()}</p>
    }
    let style = "result";
    if (winner === username) {
      style = "result win";
    } else if (winner === opponame) {
      style = "result lose";
    } else if (winner === 'tie') {
      style = "result draw";
    }
    return <p className={style} onClick={() => playReward(game?.winner, username, opponame, 10)}>{responseText()}</p>
  }

  const responseText = () => {

    switch (response) {

      // Database domain
      case 'noGames':
        return "No Othello games found";
      case 'noSuchGame':
        return "Othello game not found";
      case 'gameUpdateError':
        return "Could not update the Othello game.";
      case 'unableToCreateGame':
        return "Could not create the Othello game.";

      // Othello game rules domain
      case 'othelloNotYourTurn':
        return "It is not your turn.";
      case 'othelloCellNotEmpty':
        return "You must select an empty cell.";
      case 'othelloOpponentCellNotAdjacent':
        return "You must play next to one of your opponent's pieces.";
      case 'othelloTerminatingCellNotPresent':
        return "That move would capture no pieces.";

      // Special cases
      case 'othelloYourTurn':
        return "It is your turn.";
      case 'othelloStartNotYourTurn':
        return `It is ${opponame}'s turn.`;

      // Othello game result domain
      case 'othelloWinner':
        return "You have won!";
      case 'othelloLoser':
        return "You lost. Try again!";
      case 'othelloTie':
        return "It's a draw!";

      // Othello move analysis domain
      case 'othelloCorner':
        return "Oh yea!!!";
      case 'othelloPithy0':
        return "Cunning!";
      case 'othelloPithy1':
        return "Nice one!";
      case 'othelloPithy2':
        return "Well done.";
      case 'othelloPithy3':
        return "More like that!"
      case 'othelloPithy4':
        return "Nice move.";
      case 'othelloPithy5':
        return "You've got them on the run now.";
      case 'othelloPithy6':
      case 'othelloPithy7':
      case 'othelloPithy8':
      case 'othelloPithy9':
        return "";

      default:
        if (response == null)
          return "";
        // Unknown response -display it so it can be reported
        return response;
    }
  }

  const playReward = (winner, username, opponame, duration) => {
    if (winner === username) {
      setFireworks(true);
      setTimeout(() => setFireworks(false), duration * 1000);
    } else if (winner === opponame) {
    } else if (winner === 'tie') {
    }
  }

  return (
    <div>
      <h2>Play</h2>
      <p><strong>{game?.players[0]}</strong> vs <strong>{game?.players[1]}</strong></p>
      {welcomeText()}
      {displayScore()}
      <FireWorks enabled={fireworks ? "true" : "false"} />
      <table className="othelloTable">
        <tbody>
          {game?.gameState.map((rows, y) => {
            return (
              <tr key={y}>
                {rows != null && rows.map((cells, x) => {
                  return (
                    <td key={x} className="token othello" onClick={(e) => handleCellClick(e, x, y)}>
                      {renderToken(cells)}
                    </td>
                  )})
                }
              </tr>
            )}
          )}
        </tbody>
      </table>
      {nextPlayerText()}
      {resultText(game?.winner)}
    </div>
  );
}
