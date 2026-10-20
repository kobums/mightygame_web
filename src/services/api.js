// API Service for Mighty Game

const API_BASE_URL = process.env.VUE_APP_API_URL || "http://localhost:9004";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      // 백엔드는 세션 쿠키로 로그인 상태를 유지하므로 교차 origin 요청에도 쿠키를 함께 보낸다.
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
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

  // Auth APIs (세션 쿠키). 비밀번호는 쿼리스트링이 아닌 POST 바디로 보낸다.
  async login(loginid, passwd) {
    return this.request("/api/login/login", {
      method: "POST",
      body: JSON.stringify({ loginid, passwd }),
    });
  }

  async logout() {
    return this.request("/api/login/logout", { method: "POST" });
  }

  async me() {
    return this.request("/api/login/me");
  }

  async register(loginid, passwd, name) {
    return this.request("/api/user", {
      method: "POST",
      body: JSON.stringify({ loginid, passwd, name }),
    });
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
