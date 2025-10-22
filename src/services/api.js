// API Service for Mighty Game

const API_BASE_URL = process.env.VUE_APP_API_URL || "http://localhost:9004";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "API request failed");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Game APIs
  async createGame(playerName) {
    return this.request("/api/game/create", {
      method: "POST",
      body: JSON.stringify({ playerName }),
    });
  }

  async joinGame(gameId, playerName) {
    return this.request("/api/game/join", {
      method: "POST",
      body: JSON.stringify({ gameId, playerName }),
    });
  }

  async getGameState(roomId, playerId) {
    return this.request(`/api/game/state/${roomId}?playerId=${playerId}`, {
      method: "GET",
    });
  }

  // Bidding APIs
  async placeBid(roomId, playerId, bidType, trumpSuit = "") {
    return this.request("/api/game/bid", {
      method: "POST",
      body: JSON.stringify({
        roomId,
        playerId,
        bidType,
        trumpSuit,
      }),
    });
  }

  async passBid(gameId, playerId) {
    return this.request("/api/game/pass", {
      method: "POST",
      body: JSON.stringify({
        gameId,
        playerId,
      }),
    });
  }

  // Master actions
  async setTableCards(gameId, playerId, cards, trumpType, bid) {
    return this.request("/api/game/tablecards", {
      method: "POST",
      body: JSON.stringify({
        gameId,
        playerId,
        cards,
        trumpType,
        bid,
      }),
    });
  }

  async selectFriend(gameId, playerId, friendType, friendCard) {
    return this.request("/api/game/friend", {
      method: "POST",
      body: JSON.stringify({
        gameId,
        playerId,
        friendType,
        friendCard,
      }),
    });
  }

  // Playing APIs
  async playCard(gameId, playerId, card, jokerCall = false) {
    return this.request("/api/game/draw", {
      method: "POST",
      body: JSON.stringify({
        gameId,
        playerId,
        card,
        jokerCall,
      }),
    });
  }

  // Check for deal miss
  async checkDealMiss(gameId, playerId) {
    return this.request("/api/game/dealmiss", {
      method: "POST",
      body: JSON.stringify({
        gameId,
        playerId,
      }),
    });
  }

  // Room APIs
  async createRoom(roomName, playerName) {
    return this.request("/api/room/create", {
      method: "POST",
      body: JSON.stringify({
        roomName,
        playerName,
      }),
    });
  }

  async getRoomList() {
    return this.request("/api/room/list");
  }

  async joinRoom(roomId, playerName) {
    return this.request("/api/room/join", {
      method: "POST",
      body: JSON.stringify({
        roomId,
        playerName,
      }),
    });
  }

  async leaveRoom(roomId, playerId) {
    return this.request("/api/room/leave", {
      method: "POST",
      body: JSON.stringify({
        roomId,
        playerId,
      }),
    });
  }

  async getRoomDetail(roomId) {
    return this.request(`/api/room/${roomId}`);
  }

  async startGame(roomId, playerId) {
    return this.request("/api/room/start", {
      method: "POST",
      body: JSON.stringify({
        roomId,
        playerId,
      }),
    });
  }
}

export default new ApiService();
