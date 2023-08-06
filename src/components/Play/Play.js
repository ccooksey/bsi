//-----------------------------------------------------------------------------
// Copyright 2023 Chris Cooksey
//-----------------------------------------------------------------------------

//import React, { useCallback, useState, useEffect } from 'react';
import React, { useState, useEffect } from 'react';
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
  const [response, setResponse] = useState(null);
  const [lastMove, setLastMove] = useState({x: -1, y: -1});
  const [fireworks, setFireworks] = useState(false);

  const username = auth.username;
  const usercolor = game?.players[0] === username ? game?.colors[0] : game?.colors[1];
  const usercolorlong = usercolor === 'W' ? 'White' : 'Black';
  const opponame = game?.players[0] === username ? game?.players[1] : game?.players[0];
  const oppocolor = usercolor === 'W' ? 'B' : 'W';
  const oppocolorlong = oppocolor === 'W' ? 'White' : 'Black';

  // Fetch the game
  useEffect(() => {
    if (id != null) {
      bsi.getGame(id)
      .then((res) => {
        console.log("Setting game to: ", res.data);
        setGame(res.data);
      })
      .catch((err) => {
        console.log('Could not retrieve requested game: ', err);
      });
    }
  }, [id, bsi]);

  // Redraw the game if change was indicated on websocket
  useEffect(() => {
    if (id != null) {
      bsi.getGame(id)
      .then((res) => {
        gameUpdated(res.data, username, opponame); // Omit mover to make self-testing work better
      })
      .catch((err) => {
        gameUpdateError(err);
      });
    }
  }, [id, bsi, username, opponame, bsi.gameUpdated]);

  // Called any time the game state is successfully loaded OR updated
  // due to either player entering a legal move.
  const gameUpdated = (game, username, opponame, mover) => {
    setGame(game);
    setResponse('');
    if (mover !== username) {
      setResponse('othelloOpponentMoved');
    }
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
      console.log('Could not execute move: ', err);
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
    .then((res) => {
      setLastMove({x, y});
      gameUpdated(res.data, username, opponame, username);
    })
    .catch((err) => {
      gameUpdateError(err);
    });
  }

  const goodMove = () => {
    if ((lastMove.x === 0 && lastMove.y === 0) ||
        (lastMove.x === 0 && lastMove.y === 7) ||
        (lastMove.x === 7 && lastMove.y === 0) ||
        (lastMove.x === 7 && lastMove.y === 7)) {
      return "Oh yea!!!";
    }
    switch (Math.floor(Math.random() * 10)) {
      case 0: return "Cunning!";
      case 1: return "Nice one!";
      case 2: return "Well done."
      case 3: return "More like that!"
      case 4: return "Nice move."
      case 5: return "You've got them on the run now."
      default: return null;
    }
  }

  const translateResponse = () => {

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

      // Special case
      case 'othelloOpponentMoved':
        return "It is your turn.";

      // Othello game result domain
      case 'othelloWinner':
        return "You have won!";
      case 'othelloLoser':
        return "You lost. Try again!";
      case 'othelloTie':
        return "It's a draw!";

      default:
        // Move was accepted and applied -encourage the player
        if (response === '')
          return goodMove();
        // Unparsed response -display it so it can be reported
        return response;
    }
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

  const welcomeText = () => {
    return <p className="welcome">Welcome {username}. You are playing:&nbsp;&nbsp;<span className="token adorn">{renderToken(usercolor)}</span></p>
  }

  const playReward = (winner, username, opponame, duration) => {
    if (winner === username) {
      setFireworks(true);
      setTimeout(() => setFireworks(false), duration * 1000);
    } else if (winner === opponame) {
    } else if (winner === 'tie') {
    }
  }

  const resultText = (winner) => {
    if (winner == null) {
      return null;
    }
    if (winner === '') {
      return <p>{translateResponse()}</p>
    }
    let style = "result";
    if (winner === username) {
      style = "result win";
    } else if (winner === opponame) {
      style = "result lose";
    } else if (winner === 'tie') {
      style = "result draw";
    }
    return <p className={style} onClick={() => playReward(game?.winner, username, opponame, 10)}>{translateResponse()}</p>
  }

  const renderToken = (token) => {
    if (token==='E')
      return "";
    return (
      <svg width="100%" height="100%">
        <circle cx="50%" cy="50%" r="47%" stroke="grey" strokeWidth="1"
         fill={token==='W' ? "white" : "black"} />
      </svg>
    )
  }

  return (
    <div>
      <h2>Play</h2>
      <p><strong>{game?.players[0]}</strong> vs <strong>{game?.players[1]}</strong></p>
      {welcomeText()}
      <FireWorks enabled={fireworks ? "true" : "false"}></FireWorks>
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
