import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import FetchPlayerDetails from "./functions/FetchPlayerDetails";
import MapDirection from "./functions/MapDirection";
import { DataGrid } from "@mui/x-data-grid";
import { set } from "mongoose";
import { DateTime } from "luxon";

const columns = [
  { field: "rank", headerName: "Rank", width: 90, flex: 1 },
  {
    flex: 1,
    field: "direction",
    headerName: "Wind",
    width: 90,
    sortable: false,
  },
  {
    flex: 1,
    field: "playerName",
    headerName: "Name",
    width: 150,
    sortable: false,
  },
  {
    flex: 1,
    field: "score",
    headerName: "Score",
    type: "number",
    width: 110,
  },
  {
    flex: 1,
    field: "pointsDiff",
    headerName: "Points Diff",
    type: "number",
    width: 150,
  },
];
const GameCard = (props) => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchScores = async () => {
      const scorePromises = props.game.scores.map(async (game, index) => {
        const playerDetails = await FetchPlayerDetails(game.playerId);
        return {
          id: game.playerId, // Assuming each score has a unique playerId
          rank: index + 1,
          direction: MapDirection(game.direction),
          playerName: playerDetails.data.name, // playerName received from FetchPlayerDetails
          score: game.score,
          pointsDiff: game.pointsDiff, // Assuming you have this data
        };
      });

      const scores = await Promise.all(scorePromises);
      setRows(scores);
    };

    fetchScores();
  }, [props.game.scores]);

  return (
    <div>
      <h1>Game {props.game.gameNo}</h1>
      <h2>
        Date: {DateTime.fromISO(props.game.date).toFormat("yyyy/LL/dd HH:mm")}
      </h2>

      <Box sx={{  }}>
        <DataGrid
          autoHeight
          getRowId={(row) => row.rank}
          rows={rows}
          columns={columns}
          pageSizeOptions={[5]}
        />
      </Box>
    </div>

  );
};

export default GameCard;
