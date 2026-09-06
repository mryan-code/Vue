import { ref } from "vue";

export const useLoading = (initialLoading = false) => {
	const loading = ref(initialLoading);

	const startLoading = () => {
		loading.value = true;
	};

	const stopLoading = () => {
		loading.value = false;
	};

	return {
		loading,
		startLoading,
		stopLoading,
	};
};
