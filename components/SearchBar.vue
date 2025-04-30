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

<style scoped>
.search-container {
  width: 100%;
  max-width: 450px;
  margin: 0 auto;
  transition: all 0.3s ease;
}

.search-container.search-focused {
  transform: translateY(2px) scale(1.01);
}

.search-inner {
  display: flex;
  align-items: center;
  padding: 0.25rem 1rem;
  border-radius: 100px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(16, 17, 36, 0.8);
}

.search-container.search-focused .search-inner {
  box-shadow: 0 0 0 4px rgba(79, 109, 245, 0.2);
  border-color: rgba(255, 255, 255, 0.2);
}

.search-icon {
  color: rgba(255, 255, 255, 0.6);
  margin-right: 0.75rem;
  display: flex;
  align-items: center;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.7;
  }
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: white;
  font-size: 1rem;
  padding: 0.75rem 0;
  outline: none;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.search-actions {
  display: flex;
  align-items: center;
}

.search-clear {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.search-clear:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}
</style>