//-----------------------------------------------------------------------------
// Copyright 2023 Chris Cooksey
//-----------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthConsumer } from '../Authentication/useAuth';
import { BSIConsumer } from '../App/useBSI';
import '../App/AppCookieKeys';
import '../App/App.css';

export default function Dashboard() {

  const auth = AuthConsumer();
  const bsi = BSIConsumer();
  const navigate = useNavigate();
  const username = auth.username;

  const [games, setGames] = useState(null);
  const [roster, setRoster] = useState(null);
  const [previousGames, setPreviousGames] = useState(null);

  // Load current games user is playing (game server will add the player name)
  // We also keep an eye on the newGame state which is changed when an
  // opponent creates a new game against the current user.
  useEffect(() => {
    if (auth?.token != null && !auth?.signingOut.current) {
      bsi.getGames()
      .then(res => setGames(res.data))
      .catch(err => console.log('Could not retrieve current games ', err));
    }
  }, [auth?.token, auth?.signingOut, bsi, bsi.gameCreated, bsi.activeGames]);

  // Load opponent roster
  useEffect(() => {
    if (auth?.token != null && !auth?.signingOut.current) {
      bsi.getRoster()
      .then(res=> setRoster(res.data))
      .catch(err => console.log('Could not retrieve roster ', err));
    }
  }, [auth?.token, auth?.signingOut, bsi]);

  // Load previous games user has played (game server will add the player name)
  useEffect(() => {
    if (auth?.token != null && !auth?.signingOut.current) {
      bsi.getPreviousGames()
      .then(res => setPreviousGames(res.data))
      .catch(err => console.log('Could not retrieve previous games ', err));
    }
  }, [auth?.token, auth?.signingOut, bsi]);

  // Handle "Resume" click
  const handleResume = (e, _id) => {
    e.preventDefault();
    navigate('/play', {state: {id: _id}});
  }

  // Handle "New Game" click
  const handleNewGame = (e, opponame) => {
    e.preventDefault();
    navigate('/newgame', {state: {opponent: opponame}});
  }

//   // Handle "Replay" click
//   const handleReplay = (e, opponame) => {
//     e.preventDefault();
// //    navigate('/newgame', {state: {opponent: opponame}});
//   }

  const renderCallout = (color) => {
    return (
      <svg width="10px" height="10px">
        <circle cx="50%" cy="50%" r="47%" stroke="grey" strokeWidth="1" fill={color} />
      </svg>
    )
  }

  function playerText(username) {
    let s = "";
    if (bsi.onlinePlayers.filter(player => player === username).length >= 1) {
      s = renderCallout("green");
    }
    return (
      <span>
        {s}&nbsp;{username}
      </span>
    );
  }

  const renderActive = () => {
    return (
      <span className="dashboardNoteText">
        Active <br/>
      </span>
    )
  }

  function opponentText(item, username) {

    if (item == null || username == null) {
      return null;
    }

    const opponame = item.players[0] !== username ? item.players[0] : item.players[1];

    const activeGame =
      bsi.activeGames?.get(opponame) != null &&
      bsi.activeGames?.get(opponame) === item?._id;
    const activeMarker = activeGame ? renderActive() : null;

    const myTurn =
      bsi.onlinePlayers.filter(player => player === username && player === item.next).length >= 1;
    const myTurnMarker = myTurn ? renderCallout("grey") : null;

    return (
      <span>
        {/* {myTurnMarker}&nbsp;<span style={{color: activeGameColor}}>{opponame}</span> */}
        {activeMarker}{myTurnMarker}&nbsp;{opponame}
      </span>
    );
  }

  return (
    <div>
      <h2>Dashboard for {username}</h2>
      <h3>Current Games</h3>
      {games == null ? <span>Loading games...</span> :
        <table className="dashboard highlight roundedbg">
          <thead>
            <tr>
              <th>Opponent</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {games.map((item) => {
              return (
                <tr key={item._id}>
                  <td>{opponentText(item, username)}</td>
                  <td>{new Date(item.created).toLocaleString(undefined, {dateStyle: 'short', timeStyle: 'short'})}</td>
                  <td><button onClick={(e) => handleResume(e, item._id)}>Resume</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      }
      <h3>Roster</h3>
      {roster == null ? <span>Loading roster...</span> :
        <table className="dashboard highlight roundedbg">
          <thead>
            <tr>
              <th>Player</th>
              <th>Join Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {roster.map((item) => {
              return (
                <tr key={item._id}>
                  <td>{playerText(item.username)}</td>
                  <td>{new Date(item.joindate).toLocaleString(undefined, {dateStyle: 'short', timeStyle: 'short'})}</td>
                  <td><button onClick={(e) => handleNewGame(e, item.username)}>New Game</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      }
      <h3>Previous Games</h3>
      {previousGames == null ? <span>Loading previous games...</span> :
        <table className="dashboard highlight roundedbg">
          <thead>
            <tr>
              <th>Opponent</th>
              <th>Game Date</th>
              <th>Winner</th>
            </tr>
          </thead>
          <tbody>
            {previousGames.map((item) => {
              return (
                <tr key={item._id}>
                  <td>{item.players[0] !== username ? item.players[0] : item.players[1]}</td>
                  <td>{new Date(item.created).toLocaleString(undefined, {dateStyle: 'short', timeStyle: 'short'})}</td>
                  <td>{item.winner}</td>
                  {/* <td><button onClick={(e) => handleReplay(e, item.username)}>Replay</button></td> */}
                </tr>
              );
            })}
          </tbody>
        </table>
      }
    </div>
  );
}
