<template>
  <div class="modal-wrap">
    <div class="modal-bg" @click="$emit('close')"></div>
    <div class="modal-con">
      <div class="pop-titArea">
        <h3>새 방 만들기</h3>
        <button class="modal-close" @click="$emit('close')"></button>
      </div>
      <div class="pop-body">
        <div class="form-group">
          <label>방 이름:</label>
          <input
            v-model="roomName"
            type="text"
            placeholder="방 이름을 입력하세요"
            maxlength="30"
            @keyup.enter="createRoom"
          />
        </div>
        <div class="form-group">
          <label>플레이어 이름:</label>
          <input
            v-model="playerName"
            type="text"
            placeholder="이름을 입력하세요"
            maxlength="20"
            @keyup.enter="createRoom"
          />
        </div>
      </div>
      <div class="pop-btm">
        <button
          class="button btn_blue"
          :disabled="!canCreate"
          @click="createRoom"
        >
          방 만들기
        </button>
        <button class="button" @click="$emit('close')">취소</button>
      </div>
    </div>
  </div>
</template>

<script>
import api from "@/services/api";

export default {
  name: "CreateRoomModal",
  emits: ["close", "created"],
  data() {
    return {
      roomName: this.generateRoomName(),
      playerName: this.generatePlayerName(),
    };
  },
  computed: {
    canCreate() {
      return this.roomName.trim() && this.playerName.trim();
    },
  },
  methods: {
    generateRoomName() {
      const adjectives = ["즐거운", "신나는", "멋진", "화려한", "빠른", "강력한", "행복한", "재밌는"];
      const nouns = ["마이티방", "게임방", "플레이룸", "카드방", "친구방", "대결장", "배틀룸"];
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      return `${adj} ${noun}`;
    },
    generatePlayerName() {
      const animals = ["호랑이", "사자", "독수리", "상어", "늑대", "팬더", "여우", "곰", "토끼", "고양이"];
      const colors = ["빨강", "파랑", "초록", "노랑", "보라", "검정", "하양", "주황"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const animal = animals[Math.floor(Math.random() * animals.length)];
      return `${color}${animal}`;
    },
    async createRoom() {
      if (!this.canCreate) return;

      try {
        const response = await api.createRoom(this.roomName, this.playerName);

        if (response.code === "success" || response.code === "ok") {
          this.$emit("created", {
            roomId: response.roomId,
            playerId: response.playerId,
            room: response.room,
          });
        } else {
          alert(response.message || "방 생성에 실패했습니다");
        }
      } catch (error) {
        console.error("Failed to create room:", error);
        alert("방 생성 중 오류가 발생했습니다");
      }
    },
  },
};
</script>

<style scoped>
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
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.pop-titArea {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pop-titArea h3 {
  margin: 0;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  color: #666;
}

.modal-close::before {
  content: "×";
}

.modal-close:hover {
  color: #333;
}

.pop-body {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.pop-btm {
  display: flex;
  gap: 10px;
}

.button {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn_blue {
  background: #667eea;
  color: white;
}

.btn_blue:hover:not(:disabled) {
  background: #5568d3;
}

.button:not(.btn_blue) {
  background: #e0e0e0;
}

.button:not(.btn_blue):hover {
  background: #d0d0d0;
}
</style>
