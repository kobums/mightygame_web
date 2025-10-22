<template>
  <div class="waiting-container">
    <div class="waiting-header">
      <button class="button btn_back" @click="leaveRoom">
        ← 로비로
      </button>
      <h1>{{ room?.name || "대기실" }}</h1>
      <div class="room-id">방 ID: {{ roomId }}</div>
    </div>

    <div class="waiting-content">
      <div class="players-area">
        <h2>플레이어 ({{ room?.currentPlayers || 0 }}/5)</h2>
        <div class="players-grid">
          <div
            v-for="index in 5"
            :key="index"
            class="player-card"
            :class="{
              filled: room?.players && room.players[index - 1],
              host: index === 1,
            }"
          >
            <div class="player-number">{{ index }}</div>
            <div v-if="room?.players && room.players[index - 1]" class="player-info">
              <div class="player-name">{{ room.players[index - 1].name }}</div>
              <div v-if="room.players[index - 1].id === room.hostId" class="host-badge">방장</div>
            </div>
            <div v-else class="empty-slot-text">대기 중...</div>
          </div>
        </div>
      </div>

      <div class="actions-area">
        <div class="game-status">
          <div v-if="room?.currentPlayers < 5" class="status-message">
            <p>게임 시작을 기다리는 중...</p>
            <p class="sub-text">
              {{ 5 - (room?.currentPlayers || 0) }}명 더 필요합니다
            </p>
          </div>
          <div v-else class="status-message ready">
            <p>✓ 모든 플레이어가 준비되었습니다!</p>
            <p class="sub-text" v-if="isHost">게임을 시작할 수 있습니다</p>
            <p class="sub-text" v-else>방장이 게임을 시작하길 기다리는 중...</p>
          </div>
        </div>

        <!-- Debug info -->
        <div class="debug-info" style="font-size: 12px; color: #666; padding: 10px; background: #f0f0f0; border-radius: 4px; margin: 10px 0;">
          <div>방장 여부: {{ isHost }} (타입: {{ typeof isHost }})</div>
          <div>현재 인원: {{ room?.currentPlayers }} (타입: {{ typeof room?.currentPlayers }})</div>
          <div>방장 ID: {{ room?.hostId }} (타입: {{ typeof room?.hostId }})</div>
          <div>내 ID: {{ myPlayerId }} (타입: {{ typeof myPlayerId }})</div>
          <div>인원 조건: {{ room?.currentPlayers >= 5 }}</div>
          <div>방장 조건: {{ isHost }}</div>
          <div>버튼 표시 조건: {{ isHost && room?.currentPlayers >= 5 }}</div>
        </div>

        <!-- Always show for debugging -->
        <button
          class="button btn_start"
          :disabled="room?.currentPlayers < 5"
          @click="startGame"
        >
          게임 시작 {{ room?.currentPlayers >= 5 ? '' : '(인원 부족)' }}
        </button>
        <div v-if="!isHost && room?.currentPlayers >= 5" style="font-size: 11px; color: #ff6b6b; text-align: center; margin-top: 5px;">
          ※ 테스트 모드: 방장이 아니어도 시작 가능
        </div>

        <button class="button btn_leave" @click="confirmLeave">
          방 나가기
        </button>
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
  name: "RoomWaiting",
  data() {
    return {
      roomId: null,
      room: null,
      loading: true,
      refreshInterval: null,
      isHost: false,
      myPlayerId: parseInt(sessionStorage.getItem("myPlayerId")),
    };
  },
  async mounted() {
    this.roomId = parseInt(this.$route.params.id);
    await this.fetchRoomDetail();

    // Auto-refresh room status every 2 seconds
    this.refreshInterval = setInterval(() => {
      this.fetchRoomDetail(true);
    }, 2000);

    // Handle page close/reload
    window.addEventListener("beforeunload", this.handlePageUnload);
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    window.removeEventListener("beforeunload", this.handlePageUnload);

    // Leave room when component is destroyed
    this.leaveRoomQuietly();
  },
  methods: {
    async fetchRoomDetail(silent = false) {
      if (!silent) this.loading = true;

      try {
        const response = await api.getRoomDetail(this.roomId);

        if (response.code === "success" || response.code === "ok") {
          this.room = response.room;

          // Check if current player is host
          this.myPlayerId = parseInt(sessionStorage.getItem("myPlayerId"));
          this.isHost = this.room.hostId === this.myPlayerId;

          // Check if game has started - if so, redirect all players to game screen
          if (this.room.status === "playing") {
            console.log("Game started! Redirecting to game screen...");
            this.$router.push(`/game/${this.roomId}`);
            return;
          }

          // Debug log
          console.log("Room Detail:", {
            room: this.room,
            myPlayerId: this.myPlayerId,
            hostId: this.room.hostId,
            isHost: this.isHost,
            currentPlayers: this.room.currentPlayers,
            status: this.room.status
          });
        } else {
          console.error("Failed to fetch room detail:", response.message);
          // Room might be deleted, go back to lobby
          this.$router.push("/lobby");
        }
      } catch (error) {
        console.error("Failed to fetch room detail:", error);
      } finally {
        if (!silent) this.loading = false;
      }
    },
    async startGame() {
      try {
        const myPlayerId = parseInt(sessionStorage.getItem("myPlayerId"));

        console.log("=== Starting game ===");
        console.log("roomId:", this.roomId, "type:", typeof this.roomId);
        console.log("playerId:", myPlayerId, "type:", typeof myPlayerId);
        console.log("room data:", this.room);

        const response = await api.startGame(this.roomId, myPlayerId);

        console.log("=== Start game response ===");
        console.log("Full response:", response);
        console.log("Response code:", response.code);
        console.log("Response message:", response.message);

        if (response.code === "success" || response.code === "ok") {
          console.log("Success! Navigating to game...");
          // Navigate to game
          this.$router.push(`/game/${this.roomId}`);
        } else {
          console.error("Start game failed with response:", response);
          alert(response.message || "게임 시작에 실패했습니다");
        }
      } catch (error) {
        console.error("=== Failed to start game (exception) ===");
        console.error("Error object:", error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        alert("게임 시작 중 오류가 발생했습니다: " + error.message);
      }
    },
    confirmLeave() {
      if (confirm("정말 방을 나가시겠습니까?")) {
        this.leaveRoom();
      }
    },
    async leaveRoom() {
      try {
        const myPlayerId = parseInt(sessionStorage.getItem("myPlayerId"));
        await api.leaveRoom(this.roomId, myPlayerId);
        sessionStorage.removeItem("currentRoomId");
        this.$router.push("/lobby");
      } catch (error) {
        console.error("Failed to leave room:", error);
        // Go back anyway
        sessionStorage.removeItem("currentRoomId");
        this.$router.push("/lobby");
      }
    },
    leaveRoomQuietly() {
      // Silent leave without navigation (for page close)
      try {
        const myPlayerId = parseInt(sessionStorage.getItem("myPlayerId"));
        const roomId = sessionStorage.getItem("currentRoomId");
        if (myPlayerId && roomId) {
          // Use sendBeacon for reliable page unload
          const data = JSON.stringify({ roomId: parseInt(roomId), playerId: myPlayerId });
          navigator.sendBeacon(`${api.baseURL}/api/room/leave`, data);
          localStorage.removeItem("currentRoomId");
        }
      } catch (error) {
        console.error("Failed to leave room quietly:", error);
      }
    },
    handlePageUnload() {
      this.leaveRoomQuietly();
    },
  },
};
</script>

<style scoped>
.waiting-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.waiting-header {
  max-width: 1000px;
  margin: 0 auto 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 20px 30px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.waiting-header h1 {
  color: white;
  margin: 0;
  font-size: 28px;
  flex: 1;
  text-align: center;
}

.btn_back {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.btn_back:hover {
  background: rgba(255, 255, 255, 0.3);
}

.room-id {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.waiting-content {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.players-area,
.actions-area {
  background: white;
  border-radius: 12px;
  padding: 30px;
}

.players-area h2 {
  margin: 0 0 20px 0;
  color: #333;
}

.players-grid {
  display: grid;
  gap: 15px;
}

.player-card {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  background: #f5f5f5;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.player-card.filled {
  background: #e8f5e9;
  border-color: #4caf50;
}

.player-card.host.filled {
  background: #fff3e0;
  border-color: #ff9800;
}

.player-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 15px;
}

.player-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.player-name {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.host-badge {
  background: #ff9800;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.empty-slot-text {
  color: #999;
  font-style: italic;
}

.actions-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.game-status {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-message {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  background: #f5f5f5;
}

.status-message.ready {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-message p {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.status-message .sub-text {
  margin-top: 8px;
  font-size: 14px;
  opacity: 0.8;
}

.button {
  padding: 15px 30px;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn_start {
  background: #4caf50;
  color: white;
  font-size: 20px;
  padding: 20px;
}

.btn_start:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.btn_leave {
  background: #f44336;
  color: white;
}

.btn_leave:hover {
  background: #da190b;
}

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

@media (max-width: 768px) {
  .waiting-content {
    grid-template-columns: 1fr;
  }
}
</style>
