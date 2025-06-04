<template>
  <div class="search-container" :class="{ 'search-focused': isFocused }">
    <div class="search-inner glass-dark">
      <div class="search-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      <input
          type="text"
          class="search-input"
          placeholder="Ort suchen"
          v-model="searchQuery"
          @focus="isFocused = true"
          @blur="isFocused = false"
          @keyup.enter="search"
      />
      <div class="search-actions" v-if="searchQuery">
        <button class="search-clear" @click="clearSearch">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  loading: Boolean
});

const emit = defineEmits(['search']);

const searchQuery = ref('');
const isFocused = ref(false);

const search = () => {
  if (searchQuery.value.trim()) {
    emit('search', searchQuery.value);
  }
};

const clearSearch = () => {
  searchQuery.value = '';
};
</script>

<style src="./SearchBarCSS.css" scoped></style>