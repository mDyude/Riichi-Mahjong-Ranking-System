import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import BackButton from "../components/BackButton";
import CircularProgress from "@mui/material/CircularProgress";
import { createTheme, ThemeProvider } from "@mui/material";

const ShowPlayerGameHistory = () => {
  // useState({}) initialize the state to an empty object
  const [player, setPlayer] = useState({});
  // useState([]) initialize the state to an empty array
  const [PlayerGamesHistory, setGamesHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  // useParams reads the current URL parameters and returns an object of key/value pairs
  const { name } = useParams();
  const [playerIdNameMap, setPlayerIdNameMap] = useState({});

  const fetchPlayerDetails = async (playerId) => {
    try {
      const response = await axios.get(
        `http://localhost:5555/players/${playerId}`
      );
      return response.data; // this will be the player details
    } catch (error) {
      console.error("Error fetching player details:", error);
      return null;
    }
  };

  const mapDirection = (direction) => {
    if (direction === 0) {
      return "东";
    }
    if (direction === 1) {
      return "南";
    }
    if (direction === 2) {
      return "西";
    }
    if (direction === 3) {
      return "北";
    }
  }

  // useEffect is a hook that lets you perform side effects in function components
  // here we use it to fetch data from the server
  // then we update the state with the response data
  useEffect(() => {
    const loadGameData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:5555/players/${name}`
        );
        setPlayer(response.data.data);
        setGamesHistory(response.data.gamesHistory);

        // Extract unique player IDs
        const playerIds = new Set();
        response.data.gamesHistory.forEach((game) => {
          game.scores.forEach((score) => {
            playerIds.add(score.playerId);
          });
        });
        // console.log("Player IDs:", playerIds);
        // Fetch details for each player
        const playerDetailsPromises =
          Array.from(playerIds).map(fetchPlayerDetails);
        // console.log("Player Details Promises:", playerDetailsPromises);
        
        const playerDetails = await Promise.all(playerDetailsPromises);
        // console.log("Player Details:", playerDetails);

        // Build a mapping of player IDs to names
        const playerIdNameMap = {};
        playerDetails.forEach((player) => {
          if (player) {
            playerIdNameMap[player.data._id] = player.data.name;
          }
        });
        // console.log("Player ID-Name Map:", playerIdNameMap);

        setPlayerIdNameMap(playerIdNameMap);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    loadGameData();
  }, [name]);

  const theme = createTheme({
    typography: {
      fontFamily: ["Nunito Sans", "sans-serif"].join(","),
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <div className="p-4 font-sans-serif Nunito Sans">
        <BackButton />
        <h1 className="text-3xl my-4 flex justify-center items-center">
          {player.name}'s Info
        </h1>
        {loading ? (
          <CircularProgress />
        ) : (
          <div className="flex justify-center items-center flex-col border-2  rounded-xl p-4">
            <div className="my-4">
              <span className="text-xl mr-4 text-gray-500">Name</span>
              <span>{player.name}</span>
            </div>
            <div className="my-4">
              <span className="text-xl mr-4 text-gray-500">Games Played</span>
              <span>{player.gamesPlayed}</span>
            </div>
            <div className="my-4">
              <span className="text-xl mr-4 text-gray-500">Score</span>
              <span>{player.totalScore}</span>
            </div>
            <div className="my-4">
              <span className="text-xl mr-4 text-gray-500">Average Rank</span>
              <span>{player.avgRank}</span>
            </div>
            <div className="my-4">
              <span className="text-xl mr-4 text-gray-500">Create Time</span>
              <span>{new Date(player.createdAt).toString()}</span>
            </div>
            <div className="my-4">
              <span className="text-xl mr-4 text-gray-500">
                Last Update Time
              </span>
              <span>{new Date(player.updatedAt).toString()}</span>
            </div>

            <div className="my-4">
              <span className="text-xl mr-4 text-gray-500">Games Played</span>
              {/* if there is a game */}
              {PlayerGamesHistory.length > 0 ? (
                PlayerGamesHistory.map((game, gameIndex) => (
                  <div key={gameIndex}>
                    {/* ... game details ... */}
                    {game.scores.map((score, scoreIndex) => (
                      <div key={scoreIndex} className='p-4'>
                        <p>Player Name: {playerIdNameMap[score.playerId]}</p>
                        <p>Score: {score.score}</p>
                        <p>Direction: {mapDirection(score.direction)}</p>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <p>No games history available.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
};

export default ShowPlayerGameHistory;