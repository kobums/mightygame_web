<template>
  <div class="game-container">
    <div class="game-header">
      <h1>마이티 게임</h1>
      <div class="room-info">방 ID: {{ roomId }}</div>
    </div>

    <div class="game-content">
      <!-- Other players -->
      <div class="players-area">
        <div
          v-for="player in otherPlayers"
          :key="player.id"
          class="other-player"
          :class="{ 'active-turn': isPlayerTurn(player.id) }"
        >
          <div class="player-name">{{ player.name }}</div>
          <div class="card-back-count">10장</div>
        </div>
      </div>

      <!-- Center area: Bidding or Playing -->
      <div class="center-area">
        <div v-if="gameState?.phase === 'bidding'" class="bidding-area">
          <h2>비딩 단계</h2>

          <!-- Bid history -->
          <div class="bid-history">
            <div v-for="(bid, index) in gameState?.bids" :key="index" class="bid-item">
              <span class="bid-player">{{ bid.playerName }}:</span>
              <span class="bid-value">
                {{ bid.bidType === 'pass' ? '패스' : `${bid.bidType}장 (${getSuitName(bid.trumpSuit)})` }}
              </span>
            </div>
          </div>

          <!-- Current highest bid -->
          <div v-if="gameState?.highestBid" class="highest-bid">
            <strong>현재 최고 공약:</strong> {{ gameState.highestBid.playerName }} -
            {{ gameState.highestBid.bidType }}장 ({{ getSuitName(gameState.highestBid.trumpSuit) }})
          </div>

          <!-- Bidding controls (only show if it's your turn) -->
          <div v-if="isMyTurn" class="bidding-controls">
            <h3>당신의 차례입니다!</h3>

            <div class="bid-options">
              <button class="btn-pass" @click="placeBid('pass')">패스</button>

              <div class="bid-numbers">
                <button
                  v-for="num in availableBids"
                  :key="num"
                  class="btn-bid-number"
                  @click="selectBidNumber(num)"
                  :class="{ selected: selectedBidNumber === num }"
                >
                  {{ num }}장
                </button>
              </div>
            </div>

            <div v-if="selectedBidNumber" class="suit-selection">
              <h4>기루다를 선택하세요:</h4>
              <div class="suit-buttons">
                <button class="btn-suit spade" @click="placeBid(selectedBidNumber, 'spade')">♠ 스페이드</button>
                <button class="btn-suit diamond" @click="placeBid(selectedBidNumber, 'diamond')">♦ 다이아</button>
                <button class="btn-suit heart" @click="placeBid(selectedBidNumber, 'heart')">♥ 하트</button>
                <button class="btn-suit club" @click="placeBid(selectedBidNumber, 'club')">♣ 클로버</button>
              </div>
            </div>
          </div>
          <div v-else class="waiting-turn">
            <p>{{ getCurrentPlayerName() }}의 차례를 기다리는 중...</p>
          </div>
        </div>

        <div v-else-if="gameState?.phase === 'kitty_exchange'" class="kitty-area">
          <h2>비딩 종료!</h2>
          <p>{{ gameState.highestBid?.playerName }}님이 {{ gameState.highestBid?.bidType }}장으로 낙찰되었습니다.</p>
          <p>기루다: {{ getSuitName(gameState.trumpSuit) }}</p>
        </div>
      </div>

      <!-- My hand -->
      <div class="my-hand-area">
        <div class="my-info">
          <strong>{{ myPlayerName }} (ID: {{ myPlayerId }})</strong>
          <span v-if="isMyTurn" class="turn-indicator">당신의 차례!</span>
        </div>

        <div class="cards">
          <div
            v-for="(card, index) in myHand"
            :key="index"
            class="card"
            :class="[card.suit]"
          >
            <div class="card-content">
              <div class="card-number">{{ card.number }}</div>
              <div class="card-suit">{{ getSuitSymbol(card.suit) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>로딩 중...</p>
    </div>
  </div>
</template>

<script>
import api from "@/services/api";

export default {
  name: "Game",
  data() {
    return {
      roomId: null,
      gameState: null,
      myHand: [],
      myPlayerId: null,
      myPlayerName: "",
      loading: true,
      refreshInterval: null,
      selectedBidNumber: null,
    };
  },
  computed: {
    otherPlayers() {
      if (!this.gameState?.players) return [];
      return this.gameState.players.filter(p => p.id !== this.myPlayerId);
    },
    isMyTurn() {
      return this.gameState?.currentBidder === this.myPlayerId;
    },
    availableBids() {
      const minBid = this.gameState?.highestBid
        ? parseInt(this.gameState.highestBid.bidType) + 1
        : 13;
      const bids = [];
      for (let i = minBid; i <= 20; i++) {
        bids.push(i);
      }
      return bids;
    },
  },
  async mounted() {
    this.roomId = parseInt(this.$route.params.id);
    this.myPlayerId = parseInt(localStorage.getItem("myPlayerId"));

    await this.fetchGameState();

    // Auto-refresh game state every 2 seconds
    this.refreshInterval = setInterval(() => {
      this.fetchGameState(true);
    }, 2000);
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  methods: {
    async fetchGameState(silent = false) {
      if (!silent) this.loading = true;

      try {
        const response = await api.getGameState(this.roomId, this.myPlayerId);

        if (response.code === "success") {
          this.gameState = response.game;
          this.myHand = response.game.myHand || [];

          // Find my player name
          const myPlayer = this.gameState.players.find(p => p.id === this.myPlayerId);
          if (myPlayer) {
            this.myPlayerName = myPlayer.name;
          }

          console.log("Game State:", this.gameState);
        } else {
          console.error("Failed to fetch game state:", response.message);
          alert(response.message);
          this.$router.push("/lobby");
        }
      } catch (error) {
        console.error("Failed to fetch game state:", error);
        alert("게임 상태를 불러오는데 실패했습니다");
        this.$router.push("/lobby");
      } finally {
        if (!silent) this.loading = false;
      }
    },
    async placeBid(bidType, trumpSuit = "") {
      try {
        const response = await api.placeBid(this.roomId, this.myPlayerId, bidType, trumpSuit);

        if (response.code === "success") {
          this.selectedBidNumber = null;
          await this.fetchGameState(true);
        } else {
          alert(response.message);
        }
      } catch (error) {
        console.error("Failed to place bid:", error);
        alert("비딩 중 오류가 발생했습니다");
      }
    },
    selectBidNumber(num) {
      this.selectedBidNumber = num;
    },
    getSuitName(suit) {
      const names = {
        spade: "스페이드",
        diamond: "다이아",
        heart: "하트",
        club: "클로버",
      };
      return names[suit] || suit;
    },
    getSuitSymbol(suit) {
      const symbols = {
        spade: "♠",
        diamond: "♦",
        heart: "♥",
        club: "♣",
        joker: "🃏",
      };
      return symbols[suit] || suit;
    },
    isPlayerTurn(playerId) {
      return this.gameState?.currentBidder === playerId;
    },
    getCurrentPlayerName() {
      if (!this.gameState) return "";
      const currentPlayer = this.gameState.players.find(
        p => p.id === this.gameState.currentBidder
      );
      return currentPlayer ? currentPlayer.name : "";
    },
  },
};
</script>

<style scoped>
.game-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  padding: 20px;
}

.game-header {
  max-width: 1400px;
  margin: 0 auto 20px;
  text-align: center;
  color: white;
}

.game-header h1 {
  margin: 0 0 10px 0;
  font-size: 32px;
}

.room-info {
  font-size: 14px;
  opacity: 0.8;
}

.game-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Other players */
.players-area {
  display: flex;
  justify-content: space-around;
  gap: 10px;
}

.other-player {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  color: white;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.other-player.active-turn {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.2);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.player-name {
  font-weight: bold;
  margin-bottom: 8px;
}

.card-back-count {
  font-size: 14px;
  opacity: 0.8;
}

/* Center area */
.center-area {
  background: white;
  border-radius: 12px;
  padding: 30px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.bidding-area, .kitty-area {
  width: 100%;
}

.bidding-area h2, .kitty-area h2 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

.bid-history {
  max-height: 150px;
  overflow-y: auto;
  margin-bottom: 20px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
}

.bid-item {
  padding: 5px 0;
  border-bottom: 1px solid #ddd;
}

.bid-item:last-child {
  border-bottom: none;
}

.bid-player {
  font-weight: bold;
  margin-right: 10px;
}

.highest-bid {
  text-align: center;
  padding: 15px;
  background: #e8f5e9;
  border-radius: 8px;
  margin-bottom: 20px;
  color: #2e7d32;
}

.bidding-controls {
  text-align: center;
}

.bidding-controls h3 {
  color: #d32f2f;
  margin-bottom: 20px;
}

.bid-options {
  margin-bottom: 20px;
}

.btn-pass {
  padding: 12px 30px;
  background: #757575;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-right: 20px;
}

.btn-pass:hover {
  background: #616161;
}

.bid-numbers {
  display: inline-flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-bid-number {
  padding: 10px 20px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-bid-number:hover {
  background: #1976d2;
  transform: translateY(-2px);
}

.btn-bid-number.selected {
  background: #4caf50;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.suit-selection {
  margin-top: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.suit-selection h4 {
  margin-bottom: 15px;
  color: #333;
}

.suit-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-suit {
  padding: 15px 30px;
  font-size: 18px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-suit.spade {
  background: #1a1a1a;
  color: white;
}

.btn-suit.diamond {
  background: #e53935;
  color: white;
}

.btn-suit.heart {
  background: #d32f2f;
  color: white;
}

.btn-suit.club {
  background: #2e7d32;
  color: white;
}

.btn-suit:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.waiting-turn {
  text-align: center;
  padding: 30px;
  color: #666;
  font-size: 18px;
}

/* My hand */
.my-hand-area {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 20px;
}

.my-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  color: #333;
}

.turn-indicator {
  background: #ffd700;
  color: #333;
  padding: 5px 15px;
  border-radius: 20px;
  font-weight: bold;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.cards {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.card {
  width: 80px;
  height: 120px;
  background: white;
  border: 2px solid #333;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.card:hover {
  transform: translateY(-10px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.card.spade, .card.club {
  color: #000;
}

.card.diamond, .card.heart {
  color: #e53935;
}

.card.joker {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-content {
  text-align: center;
}

.card-number {
  font-size: 24px;
  font-weight: bold;
}

.card-suit {
  font-size: 32px;
}

/* Loading */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-overlay p {
  color: white;
  margin-top: 20px;
  font-size: 18px;
}
</style>
