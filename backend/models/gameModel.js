import mongoose from "mongoose";
import { Player } from "./playerModel.js";

const gameSchema = new mongoose.Schema(
    {
        gameNo: {
            type: Number,
        },
        scores: [{
            playerId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Player',
                required: true,
            },
            // the player rank in the current game. from 1 to 4
            rankOfAGame: {
                type: Number,
            },
            score: {
                type: Number,
                required: true,
            },
            direction: {
                type: Number,
                required: true,
            },
            pointsDiff: {
                type: Number,
            }
        }],
        winner: {
            type: String,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
)

// Pre-save hook to 
gameSchema.pre('save', async function (next) {
    const playerIds = this.scores.map(score => score.playerId.toString());
    const uniquePlayerIds = new Set(playerIds);
    // check duplicate players in a game
    if (uniquePlayerIds.size !== playerIds.length) {
        // If there are duplicates, pass an error to the next() function
        const err = new Error('Duplicate players detected. Each player must be unique.');
        next(err);
    }

    // check if the total score is 100000
    // reduce mathod to sum up all the scores
    // 0 is the initial value for the accumulator acc
    const totalScore = this.scores.reduce((acc, curr) => acc + curr.score, 0);
    if (totalScore !== 100000) {
        const err = new Error('Total score must be 100000');
        next(err);
    }

    else {
        // auto-increment gameNo
        if (this.isNew) {
            const lastGame = await this.constructor.findOne().sort({ gameNo: -1 });
            this.gameNo = lastGame ? lastGame.gameNo + 1 : 1;
        }
        next();
    }

});

// post hook to update player pointsDiff and totalScore
gameSchema.post('save', async function (next) {
    // update player pointsDiff and totalScore
    const promises = this.scores.map(async (score) => {
        const player = await Player.findById(score.playerId);
        player.rankSum += score.rankOfAGame;
        player.totalScore += score.pointsDiff;
        player.sumGameScore += score.score;
        player.gamesPlayed += 1;
        player.avgRank = (player.rankSum + score.rankOfAGame) / (player.gamesPlayed + 1);
        player.avgPts = (player.totalScore + score.pointsDiff) / (player.gamesPlayed + 1);
        player.avgScore = (player.sumGameScore + score.score) / (player.gamesPlayed + 1);
        await player.save();
    });
    await Promise.all(promises);
});

gameSchema.pre('findOneAndDelete', async function (next) {
    const docToDelete = await this.model.findOne(this.getFilter());
    
    if (docToDelete && docToDelete.scores) {
        const updatePromises = docToDelete.scores.map(async (score) => {
            const player = await Player.findById(score.playerId);
            if (player) {
                player.rankSum -= score.rankOfAGame;
                player.totalScore -= score.pointsDiff;
                player.sumGameScore -= score.score;
                player.gamesPlayed = Math.max(player.gamesPlayed - 1, 0);

                // Ensure gamesPlayed is not zero to avoid division by zero
                if (player.gamesPlayed > 0) {
                    player.avgRank = player.rankSum / player.gamesPlayed;
                    player.avgPts = player.totalScore / player.gamesPlayed;
                    player.avgScore = player.sumGameScore / player.gamesPlayed;
                } else {
                    player.avgRank = 0;
                    player.avgPts = 0;
                    player.avgScore = 0;
                }

                await player.save();
            }
        });
        await Promise.all(updatePromises);
    }

    next();
});

// gameSchema.pre('findOneAndDelete', async function (next) {
//     const docToDelete = await this.model.findOne(this.getFilter());
//     // update player pointsDiff and totalScore
//     if (docToDelete && docToDelete.scores) {
//         const updatePromises = docToDelete.scores.map(async (score) => {
//             const player = await Player.findById(score.playerId);
//             player.rankSum -= score.rankOfAGame;
//             player.totalScore -= score.pointsDiff;
//             player.sumGameScore -= score.score;
//             player.gamesPlayed -= 1;
//             player.avgRank = (player.rankSum - score.rankOfAGame) / (player.gamesPlayed - 1);
//             player.avgPts = (player.totalScore - score.pointsDiff) / (player.gamesPlayed - 1);
//             player.avgScore = (player.sumGameScore - score.score) / (player.gamesPlayed - 1);
//             await player.save();
//         });
//         await Promise.all(updatePromises);
//     }
// });

export const Game = mongoose.model('game', gameSchema);