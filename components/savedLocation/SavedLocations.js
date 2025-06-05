import { ref } from 'vue';

export default {
    props: {
        history: {
            type: Array,
            default: () => []
        },
        useImperialUnits: {
            type: Boolean,
            default: false
        }
    },

    emits: ['select', 'remove'],

    setup(props, { emit }) {
        const activeDropdown = ref(null);

        const toggleDropdown = (id) => {
            activeDropdown.value = activeDropdown.value === id ? null : id;
        };

        const closeDropdown = () => {
            activeDropdown.value = null;
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('click', (e) => {
                if (
                    !e.target.closest('.menu-button') &&
                    !e.target.closest('.dropdown-menu')
                ) {
                    closeDropdown();
                }
            });
        }

        const formatTempC = (temp) => {
            return temp ? `${Math.round(temp)}°C` : 'N/A';
        };

        const formatTempF = (temp) => {
            return temp ? `${Math.round(temp * 9 / 5 + 32)}°F` : 'N/A';
        };

        const getWeatherIconUrl = (iconCode) => {
            return iconCode
                ? `https://openweathermap.org/img/wn/${iconCode}@2x.png`
                : '';
        };

        return {
            activeDropdown,
            toggleDropdown,
            closeDropdown,
            formatTempC,
            formatTempF,
            getWeatherIconUrl
        };
    }
};
