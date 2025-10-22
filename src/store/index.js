import { createStore } from "vuex";

// Card types
const CardType = {
  SPADE: 1,
  HEART: 2,
  DIAMOND: 3,
  CLOVER: 4,
  JOKER: 5,
  MIGHTY: 6,
  JOKER_CALL: 7,
  NO_TRUMP: 8,
  NO_TYPE: 9,
};

// Game phases
const GamePhase = {
  WAITING: "waiting",
  BIDDING: "bidding",
  TABLE_CARDS: "tableCards",
  FRIEND_SELECT: "friendSelect",
  PLAYING: "playing",
  RESULT: "result",
};

// Friend types
const FriendType = {
  CARD: 0,
  FIRST: 1,
  NO_FRIEND: 2,
};

export default createStore({
  state: {
    // Game info
    gameId: null,
    phase: GamePhase.WAITING,
    round: 0,

    // Players
    players: [],
    myPlayerId: null,

    // Bidding
    currentBidder: 0,
    highestBid: 0,
    biddingType: CardType.NO_TRUMP,
    master: -1,

    // Friend
    friend: {
      id: -1,
      type: FriendType.CARD,
      card: null,
    },

    // Trump
    trump: CardType.NO_TRUMP,

    // Cards
    myCards: [],
    tableCards: [],
    playedCards: [],

    // Turn
    currentTurn: 0,
    winner: 0,

    // Game state
    jokerCall: false,
    drawCount: 0,
  },

  getters: {
    isMyTurn: (state) => {
      if (state.phase === GamePhase.BIDDING) {
        return state.currentBidder === state.myPlayerId;
      } else if (state.phase === GamePhase.PLAYING) {
        return state.currentTurn === state.myPlayerId;
      }
      return false;
    },

    myPlayer: (state) => {
      return state.players.find((p) => p.id === state.myPlayerId);
    },

    otherPlayers: (state) => {
      return state.players.filter((p) => p.id !== state.myPlayerId);
    },

    isMaster: (state) => {
      return state.master === state.myPlayerId;
    },

    canPlayCard: (state) => () => {
      if (state.phase !== GamePhase.PLAYING) return false;
      if (!state.isMyTurn) return false;
      // TODO: Add card validation logic
      return true;
    },
  },

  mutations: {
    SET_GAME_ID(state, gameId) {
      state.gameId = gameId;
    },

    SET_PHASE(state, phase) {
      state.phase = phase;
    },

    SET_PLAYERS(state, players) {
      state.players = players;
    },

    SET_MY_PLAYER_ID(state, playerId) {
      state.myPlayerId = playerId;
    },

    SET_MY_CARDS(state, cards) {
      state.myCards = cards;
    },

    ADD_MY_CARD(state, card) {
      state.myCards.push(card);
    },

    REMOVE_MY_CARD(state, cardIndex) {
      state.myCards.splice(cardIndex, 1);
    },

    SET_BIDDING_INFO(state, { bidder, bid, type }) {
      state.currentBidder = bidder;
      if (bid !== undefined) state.highestBid = bid;
      if (type !== undefined) state.biddingType = type;
    },

    SET_MASTER(state, masterId) {
      state.master = masterId;
      state.phase = GamePhase.TABLE_CARDS;
    },

    SET_TABLE_CARDS(state, cards) {
      state.tableCards = cards;
    },

    SET_TRUMP(state, trump) {
      state.trump = trump;
    },

    SET_FRIEND(state, friend) {
      state.friend = friend;
    },

    SET_CURRENT_TURN(state, turn) {
      state.currentTurn = turn;
    },

    ADD_PLAYED_CARD(state, { playerId, card }) {
      state.playedCards.push({ playerId, card });
      state.drawCount++;
    },

    CLEAR_PLAYED_CARDS(state) {
      state.playedCards = [];
      state.drawCount = 0;
    },

    SET_ROUND(state, round) {
      state.round = round;
    },

    SET_WINNER(state, winnerId) {
      state.winner = winnerId;
    },

    SET_JOKER_CALL(state, value) {
      state.jokerCall = value;
    },

    UPDATE_PLAYER_CHIPS(state, { playerId, chips }) {
      const player = state.players.find((p) => p.id === playerId);
      if (player) {
        player.chips = chips;
      }
    },

    RESET_GAME(state) {
      state.phase = GamePhase.WAITING;
      state.round = 0;
      state.highestBid = 0;
      state.biddingType = CardType.NO_TRUMP;
      state.master = -1;
      state.trump = CardType.NO_TRUMP;
      state.myCards = [];
      state.tableCards = [];
      state.playedCards = [];
      state.jokerCall = false;
      state.drawCount = 0;
    },
  },

  actions: {
    // Initialize game
    initGame({ commit }, { gameId, players, myPlayerId }) {
      commit("SET_GAME_ID", gameId);
      commit("SET_PLAYERS", players);
      commit("SET_MY_PLAYER_ID", myPlayerId);
      commit("SET_PHASE", GamePhase.BIDDING);
    },

    // Bidding
    async placeBid({ commit, state }, { bid, type }) {
      // TODO: Call API
      commit("SET_BIDDING_INFO", {
        bidder: (state.currentBidder + 1) % 5,
        bid,
        type,
      });
    },

    async passBid({ commit, state }) {
      // TODO: Call API
      commit("SET_BIDDING_INFO", {
        bidder: (state.currentBidder + 1) % 5,
      });
    },

    // Master selected
    masterSelected({ commit }, masterId) {
      commit("SET_MASTER", masterId);
    },

    // Table cards
    async setTableCards({ commit }, cards) {
      // TODO: Call API
      commit("SET_TABLE_CARDS", cards);
      commit("SET_PHASE", GamePhase.FRIEND_SELECT);
    },

    // Friend selection
    async selectFriend({ commit }, friend) {
      // TODO: Call API
      commit("SET_FRIEND", friend);
      commit("SET_PHASE", GamePhase.PLAYING);
      commit("SET_ROUND", 1);
    },

    // Play card
    async playCard({ commit, state }, { cardIndex, jokerCall = false }) {
      const card = state.myCards[cardIndex];
      // TODO: Call API
      commit("REMOVE_MY_CARD", cardIndex);
      commit("ADD_PLAYED_CARD", { playerId: state.myPlayerId, card });
      commit("SET_CURRENT_TURN", (state.currentTurn + 1) % 5);

      if (jokerCall) {
        commit("SET_JOKER_CALL", true);
      }

      // Check if round is complete
      if (state.drawCount === 5) {
        // TODO: Determine round winner
        setTimeout(() => {
          commit("CLEAR_PLAYED_CARDS");
          if (state.round === 10) {
            commit("SET_PHASE", GamePhase.RESULT);
          } else {
            commit("SET_ROUND", state.round + 1);
          }
        }, 2000);
      }
    },

    // Reset for new game
    resetGame({ commit }) {
      commit("RESET_GAME");
    },
  },

  modules: {},
});
