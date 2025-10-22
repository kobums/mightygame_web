<template>
  <div class="lobby-container">
    <div class="lobby-header">
      <h1>🃏 마이티 게임 로비</h1>
      <div class="header-actions">
        <button class="button btn_blue" @click="showCreateModal = true">
          방 만들기
        </button>
        <button class="button" @click="refreshRooms">새로고침</button>
      </div>
    </div>

    <div class="room-list">
      <div v-if="loading" class="loading">방 목록을 불러오는 중...</div>
      <div v-else-if="rooms.length === 0" class="empty">
        대기 중인 방이 없습니다. 새로운 방을 만들어보세요!
      </div>
      <div v-else class="rooms-grid">
        <div
          v-for="room in rooms"
          :key="room.id"
          class="room-card"
          :class="{ full: room.currentPlayers >= room.maxPlayers }"
        >
          <div class="room-header">
            <h3>{{ room.name }}</h3>
            <span class="room-status" :class="room.status">
              {{ statusText(room.status) }}
            </span>
          </div>
          <div class="room-info">
            <div class="info-row">
              <span class="label">방장:</span>
              <span class="value">{{ room.hostName }}</span>
            </div>
            <div class="info-row">
              <span class="label">인원:</span>
              <span class="value players">
                {{ room.currentPlayers }}/{{ room.maxPlayers }}
              </span>
            </div>
            <div class="info-row">
              <span class="label">생성:</span>
              <span class="value">{{ formatDate(room.date) }}</span>
            </div>
          </div>
          <div class="room-players">
            <div v-for="(player, index) in 5" :key="index" class="player-slot">
              <span v-if="room.players[index]" class="player-name">
                {{ room.players[index] }}
              </span>
              <span v-else class="empty-slot">빈 자리</span>
            </div>
          </div>
          <button
            class="button btn_join"
            :disabled="room.currentPlayers >= room.maxPlayers"
            @click="joinRoom(room)"
          >
            {{ room.currentPlayers >= room.maxPlayers ? "방이 가득참" : "참가하기" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create Room Modal -->
    <CreateRoomModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="handleRoomCreated"
    />

    <!-- Join Room Modal -->
    <div v-if="showJoinModal" class="modal-wrap">
      <div class="modal-bg" @click="showJoinModal = false"></div>
      <div class="modal-con">
        <div class="pop-titArea">
          <h3>방 참가</h3>
          <button class="modal-close" @click="showJoinModal = false"></button>
        </div>
        <div class="pop-body">
          <div class="form-group">
            <label>플레이어 이름:</label>
            <input
              v-model="joinPlayerName"
              type="text"
              placeholder="이름을 입력하세요"
              @keyup.enter="confirmJoin"
            />
          </div>
        </div>
        <div class="pop-btm">
          <button class="button btn_blue" @click="confirmJoin">참가</button>
          <button class="button" @click="showJoinModal = false">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CreateRoomModal from "@/components/CreateRoomModal.vue";
import api from "@/services/api";

export default {
  name: "Lobby",
  components: {
    CreateRoomModal,
  },
  data() {
    return {
      rooms: [],
      loading: false,
      showCreateModal: false,
      showJoinModal: false,
      selectedRoom: null,
      joinPlayerName: "",
      refreshInterval: null,
    };
  },
  mounted() {
    this.fetchRooms();
    // Auto-refresh every 3 seconds
    this.refreshInterval = setInterval(() => {
      this.fetchRooms(true);
    }, 3000);
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  methods: {
    async fetchRooms(silent = false) {
      if (!silent) this.loading = true;
      try {
        const response = await api.getRoomList();
        this.rooms = response.rooms || [];
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
      } finally {
        if (!silent) this.loading = false;
      }
    },
    refreshRooms() {
      this.fetchRooms();
    },
    generatePlayerName() {
      const animals = ["호랑이", "사자", "독수리", "상어", "늑대", "팬더", "여우", "곰", "토끼", "고양이"];
      const colors = ["빨강", "파랑", "초록", "노랑", "보라", "검정", "하양", "주황"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const animal = animals[Math.floor(Math.random() * animals.length)];
      return `${color}${animal}`;
    },
    joinRoom(room) {
      this.selectedRoom = room;
      this.joinPlayerName = this.generatePlayerName();
      this.showJoinModal = true;
    },
    async confirmJoin() {
      if (!this.joinPlayerName.trim()) {
        alert("플레이어 이름을 입력하세요");
        return;
      }

      try {
        const response = await api.joinRoom(
          this.selectedRoom.id,
          this.joinPlayerName
        );

        if (response.code === "success" || response.code === "ok") {
          // Save player info and room info
          this.$store.commit("SET_MY_PLAYER_ID", response.playerId);
          localStorage.setItem("myPlayerId", response.playerId);
          localStorage.setItem("currentRoomId", this.selectedRoom.id);

          // Navigate to waiting room
          this.$router.push(`/room/${this.selectedRoom.id}`);
        } else {
          alert(response.message || "방 참가에 실패했습니다");
        }
      } catch (error) {
        console.error("Failed to join room:", error);
        alert("방 참가 중 오류가 발생했습니다");
      }
    },
    handleRoomCreated(data) {
      this.showCreateModal = false;

      // Save player info and room info
      this.$store.commit("SET_MY_PLAYER_ID", data.playerId);
      localStorage.setItem("myPlayerId", data.playerId);
      localStorage.setItem("currentRoomId", data.roomId);

      // Navigate to waiting room
      this.$router.push(`/room/${data.roomId}`);
    },
    statusText(status) {
      const statusMap = {
        waiting: "대기중",
        playing: "게임중",
        finished: "종료",
      };
      return statusMap[status] || status;
    },
    formatDate(dateStr) {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);

      if (minutes < 1) return "방금 전";
      if (minutes < 60) return `${minutes}분 전`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}시간 전`;
      return `${Math.floor(hours / 24)}일 전`;
    },
  },
};
</script>

<style scoped>
.lobby-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.lobby-header {
  max-width: 1200px;
  margin: 0 auto 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 20px 30px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.lobby-header h1 {
  color: white;
  margin: 0;
  font-size: 32px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.room-list {
  max-width: 1200px;
  margin: 0 auto;
}

.loading,
.empty {
  text-align: center;
  color: white;
  font-size: 18px;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.room-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.room-card:hover {
  transform: translateY(-5px);
}

.room-card.full {
  opacity: 0.7;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.room-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.room-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: bold;
}

.room-status.waiting {
  background: #4caf50;
  color: white;
}

.room-status.playing {
  background: #ff9800;
  color: white;
}

.room-info {
  margin-bottom: 15px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.info-row .label {
  color: #666;
  font-weight: 500;
}

.info-row .value {
  color: #333;
}

.info-row .players {
  font-weight: bold;
  color: #667eea;
}

.room-players {
  margin: 15px 0;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.player-slot {
  padding: 6px 10px;
  margin: 4px 0;
  background: white;
  border-radius: 4px;
  font-size: 14px;
}

.player-name {
  color: #333;
  font-weight: 500;
}

.empty-slot {
  color: #999;
  font-style: italic;
}

.button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  background: #e0e0e0;
  transition: background 0.2s;
}

.button:hover {
  background: #d0d0d0;
}

.btn_blue {
  background: #667eea;
  color: white;
}

.btn_blue:hover {
  background: #5568d3;
}

.btn_join {
  width: 100%;
  background: #4caf50;
  color: white;
  margin-top: 10px;
}

.btn_join:hover:not(:disabled) {
  background: #45a049;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal styles */
.modal-wrap {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-con {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.pop-titArea {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pop-titArea h3 {
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  width: 30px;
  height: 30px;
}

.modal-close::before {
  content: "×";
}

.pop-body {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}

.pop-btm {
  display: flex;
  gap: 10px;
}

.pop-btm .button {
  flex: 1;
}
</style>
