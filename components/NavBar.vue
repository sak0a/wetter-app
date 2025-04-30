// components/NavBar.vue
<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-start">
        <button class="menu-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div class="nav-links">
          <a href="#" class="nav-link active">Entdecken</a>
          <a href="#" class="nav-link">Folgen</a>
          <div class="separator"></div>
          <a href="#" class="nav-link">Wetter</a>
          <a href="#" class="nav-link">Karten</a>
          <a href="#" class="nav-link">Stündliche Vorhersage</a>
          <a href="#" class="nav-link">Monatliches Wetter</a>
          <a href="#" class="nav-link">Wettertrends</a>
          <a href="#" class="nav-link">Unwetter</a>
          <a href="#" class="nav-link">Luftqualität</a>
          <a href="#" class="nav-link">Pollen</a>
        </div>
      </div>
      <div class="navbar-end">
        <button class="settings-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <span>Personalisieren</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
// No additional logic needed for now
</script>

<style scoped>
.navbar {
  background-color: #0a0b1b;
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}

.navbar-start {
  display: flex;
  align-items: center;
}

.menu-button {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  margin-right: 1rem;
  display: none;
}

@media (max-width: 1024px) {
  .menu-button {
    display: block;
  }

  .nav-links {
    display: none;
  }
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.08);
}

.nav-link.active {
  color: white;
  font-weight: 500;
}

.separator {
  height: 24px;
  width: 1px;
  background-color: rgba(255, 255, 255, 0.15);
  margin: 0 0.5rem;
}

.navbar-end {
  display: flex;
  align-items: center;
}

.settings-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(255, 255, 255, 0.08);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-button:hover {
  background-color: rgba(255, 255, 255, 0.15);
}
</style>