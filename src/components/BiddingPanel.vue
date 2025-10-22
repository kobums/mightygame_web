<template>
  <div v-if="visible" class="modal-wrap">
    <div class="modal-bg"></div>
    <div class="modal-con">
      <div class="pop-titArea">
        <h3>입찰 (Bidding)</h3>
      </div>
      <div class="pop-body">
        <div class="bidding-info">
          <p>현재 최고 입찰: {{ highestBid }}장</p>
          <p v-if="biddingType !== 8">기루다: {{ trumpName }}</p>
          <p v-else>기루다: 없음 (노기루다)</p>
        </div>

        <div class="bidding-controls">
          <div class="bid-amount">
            <label>입찰 장수:</label>
            <select v-model.number="selectedBid">
              <option v-for="n in validBids" :key="n" :value="n">{{ n }}장</option>
            </select>
          </div>

          <div class="bid-trump">
            <label>기루다:</label>
            <select v-model.number="selectedTrump">
              <option :value="1">♠ 스페이드</option>
              <option :value="2">♥ 하트</option>
              <option :value="3">◆ 다이아몬드</option>
              <option :value="4">♣ 클로버</option>
              <option :value="8">노기루다</option>
            </select>
          </div>
        </div>
      </div>
      <div class="pop-btm">
        <button class="button btn_blue" @click="handleBid">입찰</button>
        <button class="button" @click="handlePass">패스</button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "BiddingPanel",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      selectedBid: 13,
      selectedTrump: 1,
    };
  },
  computed: {
    ...mapState(["highestBid", "biddingType"]),
    validBids() {
      const bids = [];
      for (let i = Math.max(13, this.highestBid + 1); i <= 20; i++) {
        bids.push(i);
      }
      return bids;
    },
    trumpName() {
      const names = {
        1: "♠ 스페이드",
        2: "♥ 하트",
        3: "◆ 다이아몬드",
        4: "♣ 클로버",
        8: "노기루다",
      };
      return names[this.biddingType] || "";
    },
  },
  watch: {
    validBids(newBids) {
      if (newBids.length > 0) {
        this.selectedBid = newBids[0];
      }
    },
  },
  methods: {
    handleBid() {
      if (this.selectedBid <= this.highestBid) {
        alert("현재 입찰보다 높게 입찰해야 합니다.");
        return;
      }
      this.$store.dispatch("placeBid", {
        bid: this.selectedBid,
        type: this.selectedTrump,
      });
      this.$emit("close");
    },
    handlePass() {
      this.$store.dispatch("passBid");
      this.$emit("close");
    },
  },
};
</script>

<style scoped>
.bidding-info {
  margin-bottom: 20px;
  text-align: center;
}

.bidding-info p {
  margin: 5px 0;
  font-size: 16px;
}

.bidding-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.bid-amount,
.bid-trump {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bid-amount label,
.bid-trump label {
  width: 100px;
  font-weight: bold;
}

.bid-amount select,
.bid-trump select {
  flex: 1;
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.pop-btm {
  display: flex;
  gap: 10px;
}

.pop-btm .button {
  flex: 1;
}
</style>
