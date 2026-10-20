// API Service for Mighty Game

const API_BASE_URL = process.env.VUE_APP_API_URL || "http://localhost:9004";

// 방 생성/입장 시 서버가 발급하는 플레이어 토큰. 서버는 클라이언트가 보낸 플레이어 ID 를 믿지 않고
// 이 토큰(X-Player-Token 헤더)으로 플레이어를 식별한다. 탭 단위로 유지되도록 sessionStorage 에 둔다.
const PLAYER_TOKEN_KEY = "playerToken";
const PLAYER_TOKEN_HEADER = "X-Player-Token";

function getPlayerToken() {
  try {
    return sessionStorage.getItem(PLAYER_TOKEN_KEY) || "";
  } catch (e) {
    return "";
  }
}

function setPlayerToken(token) {
  try {
    if (token) {
      sessionStorage.setItem(PLAYER_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(PLAYER_TOKEN_KEY);
    }
  } catch (e) {
    // sessionStorage 를 쓸 수 없는 환경이면 무시
  }
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getPlayerToken() {
    return getPlayerToken();
  }

  clearPlayerToken() {
    setPlayerToken("");
  }

  // 게임 진행 API 요청: 플레이어 토큰을 헤더로 보낸다.
  playerRequest(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      headers: {
        [PLAYER_TOKEN_HEADER]: getPlayerToken(),
        ...options.headers,
      },
    });
  }

  async saveTokenFrom(promise) {
    const data = await promise;
    if (data && data.playerToken) {
      setPlayerToken(data.playerToken);
    }
    return data;
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

  async getGameState(roomId) {
    return this.playerRequest(`/api/game/state/${roomId}`, {
      method: "GET",
    });
  }

  // Bidding APIs
  async placeBid(roomId, bidType, trumpSuit = "") {
    return this.playerRequest("/api/game/bid", {
      method: "POST",
      body: JSON.stringify({
        roomId,
        bidType,
        trumpSuit,
      }),
    });
  }

  async passBid(gameId) {
    return this.playerRequest("/api/game/pass", {
      method: "POST",
      body: JSON.stringify({
        gameId,
      }),
    });
  }

  // Master actions
  async setTableCards(gameId, cards, trumpType, bid) {
    return this.playerRequest("/api/game/tablecards", {
      method: "POST",
      body: JSON.stringify({
        gameId,
        cards,
        trumpType,
        bid,
      }),
    });
  }

  async selectFriend(gameId, friendType, friendCard) {
    return this.playerRequest("/api/game/friend", {
      method: "POST",
      body: JSON.stringify({
        gameId,
        friendType,
        friendCard,
      }),
    });
  }

  // Playing APIs
  async playCard(gameId, card, jokerCall = false) {
    return this.playerRequest("/api/game/draw", {
      method: "POST",
      body: JSON.stringify({
        gameId,
        card,
        jokerCall,
      }),
    });
  }

  // Check for deal miss
  async checkDealMiss(gameId) {
    return this.playerRequest("/api/game/dealmiss", {
      method: "POST",
      body: JSON.stringify({
        gameId,
      }),
    });
  }

  // Room APIs
  async createRoom(roomName, playerName) {
    return this.saveTokenFrom(
      this.request("/api/room/create", {
        method: "POST",
        body: JSON.stringify({
          roomName,
          playerName,
        }),
      })
    );
  }

  async getRoomList() {
    return this.request("/api/room/list");
  }

  async joinRoom(roomId, playerName) {
    return this.saveTokenFrom(
      this.request("/api/room/join", {
        method: "POST",
        body: JSON.stringify({
          roomId,
          playerName,
        }),
      })
    );
  }

  async leaveRoom(roomId) {
    try {
      return await this.playerRequest("/api/room/leave", {
        method: "POST",
        body: JSON.stringify({
          roomId,
        }),
      });
    } finally {
      setPlayerToken("");
    }
  }

  // 페이지 종료 시 방 나가기. sendBeacon 은 헤더를 실을 수 없어 토큰을 본문에 넣는다.
  leaveRoomBeacon(roomId) {
    const playerToken = getPlayerToken();
    if (!playerToken || !navigator.sendBeacon) return false;
    const data = JSON.stringify({ roomId, playerToken });
    return navigator.sendBeacon(`${this.baseURL}/api/room/leave`, data);
  }

  async getRoomDetail(roomId) {
    return this.request(`/api/room/${roomId}`);
  }

  async startGame(roomId) {
    return this.playerRequest("/api/room/start", {
      method: "POST",
      body: JSON.stringify({
        roomId,
      }),
    });
  }
}

export default new ApiService();
