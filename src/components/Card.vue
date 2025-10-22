<template>
  <div class="card-wrap" :class="cardClass" @click="handleClick" :style="{ cursor: clickable ? 'pointer' : 'default' }">
    <template v-if="!isBack">
      <div class="point">
        <span :class="symbolClass">{{ displayNumber }}</span>
      </div>
      <div class="sim-only">
        <span :class="symbolClass"></span>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: "Card",
  props: {
    card: {
      type: Object,
      required: false,
      default: null,
    },
    isBack: {
      type: Boolean,
      default: false,
    },
    clickable: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    cardClass() {
      if (this.isBack) return "card-back";
      if (this.card?.type === 5) return "card-joker"; // JOKER
      if (this.card?.type === 2 || this.card?.type === 3) return "card-red"; // HEART or DIAMOND
      return "";
    },
    symbolClass() {
      if (!this.card) return "";
      const typeMap = {
        1: "sim spade",
        2: "sim heart",
        3: "sim diamond",
        4: "sim clover",
        5: "sim",
      };
      return typeMap[this.card.type] || "";
    },
    displayNumber() {
      if (!this.card) return "";
      if (this.card.type === 5) return "joker"; // JOKER

      const numberMap = {
        11: "J",
        12: "Q",
        13: "K",
        14: "A",
      };
      return numberMap[this.card.number] || this.card.number.toString();
    },
  },
  methods: {
    handleClick() {
      if (this.clickable) {
        this.$emit("click", this.card);
      }
    },
  },
};
</script>

<style scoped>
.card-wrap {
  transition: transform 0.2s;
}

.card-wrap:hover {
  transform: translateY(-10px);
}

.card-wrap[style*="cursor: default"]:hover {
  transform: none;
}
</style>
