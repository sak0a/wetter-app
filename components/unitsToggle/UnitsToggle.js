import { ref } from 'vue';

export default {
    props: {
        useImperialUnits: {
            type: Boolean,
            default: false
        }
    },
    emits: ['update:units'],
    setup(props, { emit }) {
        const isOpen = ref(false);

        const toggleUnits = () => {
            isOpen.value = !isOpen.value;
        };

        const selectUnit = (imperial) => {
            emit('update:units', imperial);
            isOpen.value = false;
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('click', (e) => {
                if (!e.target.closest('.units-toggle-wrapper')) {
                    isOpen.value = false;
                }
            });
        }

        return { isOpen, toggleUnits, selectUnit };
    }
};
