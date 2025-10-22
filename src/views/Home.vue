<template>
  <div class="wrapper">
    <!-- Bidding Modal -->
    <BiddingPanel :visible="showBiddingPanel" @close="showBiddingPanel = false" />

    <!-- Friend Selection Modal -->
    <div v-if="phase === 'friendSelect' && isMaster" class="modal-wrap">
      <div class="modal-bg"></div>
      <div class="modal-con">
        <div class="pop-titArea">
          <h3>프렌드 선택</h3>
        </div>
        <div class="pop-body">
          <div class="friend-options">
            <button @click="selectFriend('mighty')">마이티 프렌드</button>
            <button @click="selectFriend('joker')">조커 프렌드</button>
            <button @click="selectFriend('first')">첫 턴 프렌드</button>
            <button @click="selectFriend('none')">노 프렌드</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Players section -->
    <section class="player-wrap">
      <div v-for="player in otherPlayers" :key="player.id" class="player-sec" :class="{ active: currentTurn === player.id }">
        <div class="player-name">
          {{ player.name }}
          <span v-if="master === player.id" class="badge">주공</span>
          <span v-if="friend.id === player.id" class="badge friend">프렌드</span>
        </div>
        <div class="player-cards">
          <Card v-for="n in player.cardCount" :key="n" :is-back="true" />
        </div>
        <div v-if="getPlayerCard(player.id)" class="played-card">
          <Card :card="getPlayerCard(player.id)" />
        </div>
        <div class="player-chips">칩: {{ player.chips }}</div>
      </div>
    </section>

    <!-- Game info -->
    <section class="game-info">
      <div class="round-info">
        <h3>라운드 {{ round }}/10</h3>
        <p v-if="trump !== 8">기루다: {{ trumpName }}</p>
        <p v-else>기루다: 없음</p>
      </div>
      <div class="phase-info">
        <p>{{ phaseText }}</p>
      </div>
    </section>

    <!-- My section -->
    <section class="my-section">
      <div class="my-info">
        <span class="my-name">
          나
          <span v-if="isMaster" class="badge">주공</span>
        </span>
        <span class="my-chips">칩: {{ myPlayer?.chips || 50 }}</span>
      </div>

      <div class="my-card">
        <Card v-for="(card, index) in myCards" :key="index" :card="card" :clickable="canPlayCard && phase === 'playing'" @click="handleCardClick(index)" />
      </div>

      <div class="action-buttons">
        <button v-if="phase === 'bidding' && isMyTurn" class="button btn_blue" @click="showBiddingPanel = true">입찰하기</button>
        <button v-if="phase === 'tableCards' && isMaster" class="button btn_blue" @click="showTableCardSelection = true">카드 내려놓기</button>
      </div>
    </section>

    <!-- Table Cards Selection -->
    <div v-if="showTableCardSelection" class="modal-wrap">
      <div class="modal-bg"></div>
      <div class="modal-con">
        <div class="pop-titArea">
          <h3>카드 3장 선택 (내려놓기)</h3>
        </div>
        <div class="pop-body">
          <p>내려놓을 카드 {{ selectedTableCards.length }}/3 선택됨</p>
          <div class="my-card">
            <Card v-for="(card, index) in myCards" :key="index" :card="card" :clickable="true" :class="{ selected: isCardSelected(index) }" @click="toggleTableCard(index)" />
          </div>
        </div>
        <div class="pop-btm">
          <button class="button btn_blue" @click="confirmTableCards" :disabled="selectedTableCards.length !== 3">확인</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import Card from "@/components/Card.vue";
import BiddingPanel from "@/components/BiddingPanel.vue";

export default {
  name: "Home",
  components: {
    Card,
    BiddingPanel,
  },
  data() {
    return {
      showBiddingPanel: false,
      showTableCardSelection: false,
      selectedTableCards: [],
    };
  },
  computed: {
    ...mapState(["phase", "round", "players", "myCards", "currentTurn", "master", "friend", "trump", "playedCards"]),
    ...mapGetters(["isMyTurn", "myPlayer", "otherPlayers", "isMaster"]),
    trumpName() {
      const names = {
        1: "♠ 스페이드",
        2: "♥ 하트",
        3: "◆ 다이아몬드",
        4: "♣ 클로버",
      };
      return names[this.trump] || "";
    },
    phaseText() {
      const phases = {
        waiting: "게임 대기 중...",
        bidding: "입찰 중",
        tableCards: "주공이 카드를 내려놓는 중...",
        friendSelect: "주공이 프렌드를 선택하는 중...",
        playing: "게임 진행 중",
        result: "게임 종료",
      };
      return phases[this.phase] || "";
    },
    canPlayCard() {
      return this.phase === "playing" && this.isMyTurn;
    },
  },
  mounted() {
    // Initialize demo game for testing
    this.initDemoGame();
  },
  methods: {
    initDemoGame() {
      // Demo initialization
      const players = [
        { id: 0, name: "나", chips: 50, cardCount: 10 },
        { id: 1, name: "플레이어1", chips: 50, cardCount: 10 },
        { id: 2, name: "플레이어2", chips: 50, cardCount: 10 },
        { id: 3, name: "플레이어3", chips: 50, cardCount: 10 },
        { id: 4, name: "플레이어4", chips: 50, cardCount: 10 },
      ];

      const demoCards = [
        { type: 1, number: 14 }, // ♠A
        { type: 2, number: 13 }, // ♥K
        { type: 3, number: 12 }, // ◆Q
        { type: 4, number: 11 }, // ♣J
        { type: 1, number: 10 }, // ♠10
        { type: 2, number: 9 }, // ♥9
        { type: 3, number: 8 }, // ◆8
        { type: 4, number: 7 }, // ♣7
        { type: 1, number: 6 }, // ♠6
        { type: 5, number: 0 }, // Joker
      ];

      this.$store.dispatch("initGame", {
        gameId: 1,
        players,
        myPlayerId: 0,
      });

      this.$store.commit("SET_MY_CARDS", demoCards);
    },
    getPlayerCard(playerId) {
      const played = this.playedCards.find((p) => p.playerId === playerId);
      return played?.card;
    },
    handleCardClick(index) {
      if (!this.canPlayCard) return;

      const confirmPlay = confirm("이 카드를 내시겠습니까?");
      if (confirmPlay) {
        this.$store.dispatch("playCard", { cardIndex: index });
      }
    },
    toggleTableCard(index) {
      const cardIndex = this.selectedTableCards.indexOf(index);
      if (cardIndex > -1) {
        this.selectedTableCards.splice(cardIndex, 1);
      } else if (this.selectedTableCards.length < 3) {
        this.selectedTableCards.push(index);
      }
    },
    isCardSelected(index) {
      return this.selectedTableCards.includes(index);
    },
    confirmTableCards() {
      if (this.selectedTableCards.length !== 3) return;

      const cards = this.selectedTableCards.map((i) => this.myCards[i]);
      this.$store.dispatch("setTableCards", cards);

      // Remove selected cards from hand
      this.selectedTableCards
        .sort((a, b) => b - a)
        .forEach((index) => {
          this.$store.commit("REMOVE_MY_CARD", index);
        });

      this.selectedTableCards = [];
      this.showTableCardSelection = false;
    },
    selectFriend(type) {
      const friendMap = {
        mighty: { type: 0, card: { type: 6, number: 14 } },
        joker: { type: 0, card: { type: 5, number: 0 } },
        first: { type: 1, card: null },
        none: { type: 2, card: null },
      };

      this.$store.dispatch("selectFriend", friendMap[type]);
    },
  },
};
</script>

<style scoped>
.wrapper {
  width: 100%;
  min-height: 100vh;
  padding: 20px;
  background: #2d5016;
}

.player-wrap {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30px;
}

.player-sec {
  text-align: center;
  padding: 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
}

.player-sec.active {
  background: rgba(255, 255, 0, 0.2);
  border: 2px solid #ffd700;
}

.player-name {
  color: white;
  font-weight: bold;
  margin-bottom: 10px;
}

.player-cards {
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
}

.player-chips {
  color: white;
  font-size: 14px;
}

.badge {
  background: #ff6b6b;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  margin-left: 5px;
}

.badge.friend {
  background: #4ecdc4;
}

.game-info {
  text-align: center;
  color: white;
  margin-bottom: 20px;
}

.round-info h3 {
  margin: 0;
  font-size: 24px;
}

.my-section {
  background: rgba(255, 255, 255, 0.15);
  padding: 20px;
  border-radius: 12px;
}

.my-info {
  display: flex;
  justify-content: space-between;
  color: white;
  margin-bottom: 15px;
  font-weight: bold;
}

.my-card {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.button {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  background: #ccc;
}

.btn_blue {
  background: #3498db;
  color: white;
}

.btn_blue:hover {
  background: #2980b9;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.friend-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.friend-options button {
  padding: 15px;
  font-size: 16px;
  border: 2px solid #3498db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.friend-options button:hover {
  background: #3498db;
  color: white;
}

.selected {
  border: 3px solid #ffd700;
  box-shadow: 0 0 10px #ffd700;
}

.played-card {
  margin-top: 10px;
}
</style>
