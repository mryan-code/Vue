import { computed, ref } from "vue";

export const useFilters = () => {
	const filters = ref({});

	const apply = (list) => {
		const fields = Object.keys(filters.value);
		if (!fields.length) return list;

		return list.filter((agent) => {
			return fields.every((field) => agent[field] === filters.value[field]);
		});
	};

	const toggle = (field, value) => {
		const previous = { ...filters.value };

		if (value === null) {
			delete previous[field];
		} else {
			previous[field] = value;
		}

		filters.value = previous;
	};

	const reset = () => {
		filters.value = {};
	};

	const list = computed(() => filters.value);

	return {
		list,
		toggle,
		reset,
		apply,
	};
};
